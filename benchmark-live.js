// LIVE benchmark: a real model (via Anthropic-compatible router) drives both
// paradigms against the mock API. Nothing is scripted — the model decides
// which tools to call (MCP side) and writes the script (codecall side).
//
// Metrics come from the API's own usage field (real billed tokens) and
// real wall-clock time. Answers are checked against locally computed
// ground truth.
//
// Run:  N_USERS=50 N_ORDERS=400 N_PRODUCTS=40 \
//       ANTHROPIC_AUTH_TOKEN=... ANTHROPIC_BASE_URL=... node benchmark-live.js
const { spawn } = require('child_process');
const fs = require('fs');
const { createServer, SPEC_INDEX, users, orders } = require('./server/mock-api');
const { callModel, MODEL, BASE } = require('./lib/anthropic');

// ---------- tasks + ground truth (computed from the same in-process data) ----------
const kept = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'refunded');
const spendByUser = new Map();
for (const o of kept) spendByUser.set(o.user_id, (spendByUser.get(o.user_id) || 0) + o.total);
const topSpender = [...spendByUser.entries()].sort((a, b) => b[1] - a[1])[0];

const TASKS = [
  {
    name: 'total_revenue',
    prompt: 'Compute total revenue: the sum of the `total` field over ALL orders whose status is neither "cancelled" nor "refunded". You must consider every order in the system. Reply with ONLY the number rounded to 2 decimals (no $, no commas, no other text).',
    truth: kept.reduce((s, o) => s + o.total, 0).toFixed(2),
    check: (a) => Math.abs(parseFloat(a.replace(/[$,]/g, '')) - parseFloat(kept.reduce((s, o) => s + o.total, 0).toFixed(2))) <= 0.01,
  },
  {
    name: 'refunded_march',
    prompt: 'Count how many orders have status "refunded" AND were created in March 2026 (created_at starts with "2026-03"). Reply with ONLY the integer, no other text.',
    truth: String(orders.filter((o) => o.status === 'refunded' && o.created_at.startsWith('2026-03')).length),
    check: (a, t) => parseInt(a.match(/\d+/)?.[0] ?? 'NaN', 10) === parseInt(t, 10),
  },
  {
    name: 'top_spender',
    prompt: 'Find the single user with the highest total spend, where spend is the sum of the `total` field of their orders excluding orders with status "cancelled" or "refunded". You must consider every order in the system. Reply with ONLY that user\'s email address, no other text.',
    truth: users.find((u) => u.id === topSpender[0]).email,
    check: (a, t) => a.trim().toLowerCase().includes(t.toLowerCase()),
  },
];

// ---------- shared usage accounting ----------
function newStats() { return { trips: 0, inputTokens: 0, outputTokens: 0, cacheRead: 0 }; }
function addUsage(stats, usage) {
  stats.trips += 1;
  stats.inputTokens += (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) + (usage.cache_read_input_tokens || 0);
  stats.cacheRead += usage.cache_read_input_tokens || 0;
  stats.outputTokens += usage.output_tokens || 0;
}
const textOf = (resp) => resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();

// ---------- paradigm A: MCP-style (model calls tools, payloads enter context) ----------
const { TOOL_SCHEMAS } = require('./agents/mcp-style');
const TOOLS = JSON.parse(TOOL_SCHEMAS).map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema }));

async function toolHTTP(baseUrl, name, input) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(input || {})) if (v !== undefined && v !== null) q.set(k, String(v));
  const routes = {
    list_users: `/users?${q}`, get_user: `/users/${input?.user_id}`,
    list_orders: `/orders?${q}`, get_order: `/orders/${input?.order_id}`,
    list_products: `/products?${q}`, get_product: `/products/${input?.product_id}`,
  };
  if (!(name in routes)) return JSON.stringify({ error: `unknown tool ${name}` });
  return (await fetch(baseUrl + routes[name])).text();
}

async function runMcpTask(task, baseUrl) {
  const stats = newStats();
  const messages = [{ role: 'user', content: task.prompt }];
  const system = 'You are a data analyst agent. Use the provided tools to answer. Data is paginated — iterate pages until total_pages is exhausted when a task requires all records. Be precise with arithmetic.';
  let nudges = 0;
  for (let turn = 0; turn < 30; turn++) {
    const resp = await callModel({ system, tools: TOOLS, messages, maxTokens: 8192 });
    addUsage(stats, resp.usage);
    messages.push({ role: 'assistant', content: resp.content });
    const toolUses = resp.content.filter((b) => b.type === 'tool_use');
    process.stderr.write(`  [mcp/${task.name}] turn ${turn + 1}: ${resp.stop_reason} ${toolUses.map((t) => t.name + JSON.stringify(t.input)).join(' ') || textOf(resp).slice(0, 60)}\n`);
    if (resp.stop_reason === 'tool_use') {
      const results = [];
      for (const tu of toolUses) {
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: await toolHTTP(baseUrl, tu.name, tu.input) });
      }
      messages.push({ role: 'user', content: results });
      continue;
    }
    const text = textOf(resp);
    // A bare final answer is short. Anything else (cut off mid-arithmetic,
    // or ended its turn while narrating a plan) gets nudged to conclude —
    // same thing an interactive user or agent harness would do.
    if (resp.stop_reason === 'end_turn' && text.length <= 100) return { answer: text, stats };
    if (nudges >= 4) return { answer: text.slice(-100), stats };
    nudges += 1;
    messages.push({
      role: 'user',
      content: 'Do not repeat the data or show working. Finish the computation and reply with ONLY the final answer in the requested format, nothing else.',
    });
  }
  return { answer: '(max turns exceeded)', stats };
}

// ---------- paradigm B: codecall (model writes a script; only stdout returns) ----------
function runSandboxed(script, baseUrl) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['-e', script], { env: { ...process.env, API_URL: baseUrl }, timeout: 30000 });
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('close', (code) => resolve(code === 0 ? { ok: true, out: out.trim() } : { ok: false, out: (err || `exit ${code}`).slice(0, 800) }));
  });
}

async function runCodecallTask(task, baseUrl) {
  const stats = newStats();
  const system = `You are a data analyst agent. You answer by writing ONE Node.js (v18+, global fetch available) script inside a single \`\`\`js code block. The script must fetch what it needs from the API and print ONLY the final answer to stdout. The API base URL is in process.env.API_URL. Endpoints:\n${SPEC_INDEX}`;
  const messages = [{ role: 'user', content: task.prompt }];
  for (let attempt = 0; attempt < 3; attempt++) {
    const resp = await callModel({ system, messages });
    addUsage(stats, resp.usage);
    messages.push({ role: 'assistant', content: resp.content });
    const code = textOf(resp).match(/```(?:js|javascript)?\n([\s\S]*?)```/)?.[1];
    if (!code) { messages.push({ role: 'user', content: 'No code block found. Reply with exactly one ```js code block.' }); continue; }
    const run = await runSandboxed(code, baseUrl);
    process.stderr.write(`  [codecall/${task.name}] attempt ${attempt + 1}: ${run.ok ? 'ok -> ' + run.out.slice(0, 60) : 'ERR ' + run.out.slice(0, 80)}\n`);
    if (run.ok) return { answer: run.out, stats };
    messages.push({ role: 'user', content: `Script failed:\n${run.out}\nFix it and reply with one \`\`\`js code block.` });
  }
  return { answer: '(script failed after retries)', stats };
}

// ---------- runner ----------
async function main() {
  const server = createServer();
  await new Promise((r) => server.listen(0, r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  console.log(`model=${MODEL} via ${BASE}`);
  console.log(`dataset: ${users.length} users, ${orders.length} orders (pagination 100/page)\n`);

  const rows = [];
  for (const task of TASKS) {
    for (const [paradigm, runner] of [['mcp', runMcpTask], ['codecall', runCodecallTask]]) {
      const t0 = performance.now();
      let r;
      try { r = await runner(task, baseUrl); }
      catch (e) { r = { answer: `(error: ${e.message.slice(0, 120)})`, stats: newStats() }; }
      const wallS = (performance.now() - t0) / 1000;
      const correct = task.check(r.answer, task.truth);
      rows.push({ task: task.name, paradigm, ...r.stats, wallS, answer: r.answer.slice(0, 60), truth: task.truth, correct });
      console.log(`${task.name} / ${paradigm}: trips=${r.stats.trips} in=${r.stats.inputTokens} out=${r.stats.outputTokens} wall=${wallS.toFixed(1)}s correct=${correct} answer="${r.answer.slice(0, 60)}"`);
    }
  }
  server.close();

  // summary
  const sum = (p, k) => rows.filter((r) => r.paradigm === p).reduce((s, r) => s + r[k], 0);
  const nCorrect = (p) => rows.filter((r) => r.paradigm === p && r.correct).length;
  let md = `# Live benchmark — real model (${MODEL} via AgentRouter)\n\n`;
  md += `Dataset: ${users.length} users, ${orders.length} orders, pagination 100/page. ${TASKS.length} tasks.\n\n`;
  md += '| task | paradigm | trips | input tok | output tok | wall | correct | answer |\n|---|---|---|---|---|---|---|---|\n';
  for (const r of rows) md += `| ${r.task} | ${r.paradigm} | ${r.trips} | ${r.inputTokens.toLocaleString()} | ${r.outputTokens.toLocaleString()} | ${r.wallS.toFixed(1)}s | ${r.correct ? '✔' : `✘ (truth: ${r.truth})`} | \`${r.answer}\` |\n`;
  md += `| **TOTAL** | **mcp** | ${sum('mcp', 'trips')} | ${sum('mcp', 'inputTokens').toLocaleString()} | ${sum('mcp', 'outputTokens').toLocaleString()} | ${sum('mcp', 'wallS').toFixed(1)}s | ${nCorrect('mcp')}/${TASKS.length} | |\n`;
  md += `| **TOTAL** | **codecall** | ${sum('codecall', 'trips')} | ${sum('codecall', 'inputTokens').toLocaleString()} | ${sum('codecall', 'outputTokens').toLocaleString()} | ${sum('codecall', 'wallS').toFixed(1)}s | ${nCorrect('codecall')}/${TASKS.length} | |\n`;
  const ratio = (k) => (sum('mcp', k) / Math.max(sum('codecall', k), 1)).toFixed(1);
  md += `\nRatios (mcp ÷ codecall): trips ${ratio('trips')}×, input tokens ${ratio('inputTokens')}×, wall time ${ratio('wallS')}×.\n`;
  fs.writeFileSync(__dirname + '/results-live.md', md);
  console.log('\n' + md);
}

main().catch((e) => { console.error(e); process.exit(1); });

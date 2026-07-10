// Benchmark: MCP-style agent loop vs codecall (code-execution) runtime.
// Same mock API, same 5 analytics tasks, answers cross-checked for equality.
//
// Measured per task:
//   context     final context-window footprint (tokens)
//   billed      cumulative input tokens across all round trips (what you pay)
//   output      model-generated tokens (tool calls / code)
//   trips       model inference round trips
//   wall        harness wall time (API + sandbox execution, no model)
//   e2e-model   modeled end-to-end latency: wall + trips*TTFT + output/TPS
//
// Model latency/cost parameters (typical hosted frontier model):
const TTFT_MS = 1200;          // time-to-first-token per round trip
const TPS = 60;                // output tokens/sec
const USD_PER_M_INPUT = 3.0;   // Sonnet-class pricing
const USD_PER_M_OUTPUT = 15.0;

const { createServer } = require('./server/mock-api');
const mcp = require('./agents/mcp-style');
const codecall = require('./agents/codecall');

const TASK_NAMES = ['top5_spenders', 'refunded_march', 'avg_by_category', 'total_revenue', 'most_cancelled_user'];

async function runSuite(agentTasks, baseUrl) {
  const results = {};
  for (const name of TASK_NAMES) {
    const t0 = performance.now();
    const { answer, stats } = await agentTasks[name](baseUrl);
    const wallMs = performance.now() - t0;
    const e2eMs = wallMs + stats.roundTrips * TTFT_MS + (stats.outputTokens / TPS) * 1000;
    const costUsd = (stats.billedInputTokens / 1e6) * USD_PER_M_INPUT + (stats.outputTokens / 1e6) * USD_PER_M_OUTPUT;
    results[name] = { answer, ...stats, wallMs, e2eMs, costUsd };
  }
  return results;
}

function fmt(n, digits = 0) {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function table(rows, headers) {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const line = (cells) => '| ' + cells.map((c, i) => String(c).padStart(widths[i])).join(' | ') + ' |';
  return [line(headers), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}

async function main() {
  const server = createServer();
  await new Promise((res) => server.listen(0, res));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const mcpResults = await runSuite(mcp.TASKS, baseUrl);
  const ccResults = await runSuite(codecall.TASKS, baseUrl);
  server.close();

  // Correctness cross-check: both paradigms must produce identical answers.
  const mismatches = TASK_NAMES.filter((n) => mcpResults[n].answer !== ccResults[n].answer);
  if (mismatches.length) {
    for (const n of mismatches) {
      console.error(`ANSWER MISMATCH on ${n}:\n  mcp:      ${mcpResults[n].answer}\n  codecall: ${ccResults[n].answer}`);
    }
    process.exit(1);
  }

  let out = '';
  const log = (s = '') => { out += s + '\n'; };

  log('# MCP-style vs codecall (code execution) — benchmark results\n');
  log(`Dataset: 200 users, 2000 orders, 100 products; pagination 100/page.`);
  log(`Answers verified identical across both paradigms on all ${TASK_NAMES.length} tasks. ✔`);
  log(`Model params for modeled latency/cost: TTFT ${TTFT_MS}ms, ${TPS} tok/s out, $${USD_PER_M_INPUT}/M in, $${USD_PER_M_OUTPUT}/M out.\n`);

  const agg = { mcp: {}, cc: {} };
  for (const [key, results] of [['mcp', mcpResults], ['cc', ccResults]]) {
    for (const m of ['contextTokens', 'billedInputTokens', 'outputTokens', 'roundTrips', 'wallMs', 'e2eMs', 'costUsd']) {
      agg[key][m] = TASK_NAMES.reduce((s, n) => s + results[n][m], 0);
    }
  }

  for (const name of TASK_NAMES) {
    const a = mcpResults[name], b = ccResults[name];
    log(`## ${name}`);
    log(table([
      ['MCP-style', fmt(a.roundTrips), fmt(a.contextTokens), fmt(a.billedInputTokens), fmt(a.outputTokens), fmt(a.wallMs) + ' ms', fmt(a.e2eMs / 1000, 1) + ' s', '$' + a.costUsd.toFixed(4)],
      ['codecall', fmt(b.roundTrips), fmt(b.contextTokens), fmt(b.billedInputTokens), fmt(b.outputTokens), fmt(b.wallMs) + ' ms', fmt(b.e2eMs / 1000, 1) + ' s', '$' + b.costUsd.toFixed(4)],
      ['ratio', (a.roundTrips / b.roundTrips).toFixed(1) + 'x', (a.contextTokens / b.contextTokens).toFixed(1) + 'x', (a.billedInputTokens / b.billedInputTokens).toFixed(1) + 'x', (a.outputTokens / b.outputTokens).toFixed(1) + 'x', '', (a.e2eMs / b.e2eMs).toFixed(1) + 'x', (a.costUsd / b.costUsd).toFixed(1) + 'x'],
    ], ['paradigm', 'trips', 'context', 'billed-in', 'output', 'wall', 'e2e-model', 'cost']));
    log();
  }

  log('## TOTAL (all 5 tasks)');
  const A = agg.mcp, B = agg.cc;
  log(table([
    ['MCP-style', fmt(A.roundTrips), fmt(A.contextTokens), fmt(A.billedInputTokens), fmt(A.outputTokens), fmt(A.wallMs) + ' ms', fmt(A.e2eMs / 1000, 1) + ' s', '$' + A.costUsd.toFixed(4)],
    ['codecall', fmt(B.roundTrips), fmt(B.contextTokens), fmt(B.billedInputTokens), fmt(B.outputTokens), fmt(B.wallMs) + ' ms', fmt(B.e2eMs / 1000, 1) + ' s', '$' + B.costUsd.toFixed(4)],
    ['ratio', (A.roundTrips / B.roundTrips).toFixed(1) + 'x', (A.contextTokens / B.contextTokens).toFixed(1) + 'x', (A.billedInputTokens / B.billedInputTokens).toFixed(1) + 'x', (A.outputTokens / B.outputTokens).toFixed(1) + 'x', '', (A.e2eMs / B.e2eMs).toFixed(1) + 'x', (A.costUsd / B.costUsd).toFixed(1) + 'x'],
  ], ['paradigm', 'trips', 'context', 'billed-in', 'output', 'wall', 'e2e-model', 'cost']));

  log(`
Notes:
- "billed-in" grows quadratically for MCP: every round trip re-reads the whole
  conversation, and the conversation contains every raw payload so far.
- codecall's wall time includes spawning a node subprocess per task (~40ms) —
  in a persistent sandbox this drops to ~0.
- Prompt caching would soften MCP's billed-in cost but not its context
  footprint, which is what crowds out the model's working memory.
- Tokens are estimated with a BPE-approximating heuristic (lib/tokens.js),
  same estimator for both paradigms, so the *ratios* are robust.`);

  console.log(out);
  require('fs').writeFileSync(__dirname + '/results.md', out);
}

main().catch((e) => { console.error(e); process.exit(1); });

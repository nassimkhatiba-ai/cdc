// Live CDC test: a real model uses the cdc-make-generated GitHub CDC to
// answer questions against the REAL api.github.com (unauthenticated).
//
// Flow (progressive disclosure):
//   1. system = generated SKILL.md (~900 tokens) + section-request protocol
//   2. model replies `SECTIONS: <tags>` -> harness sends only those CDC.md sections
//   3. model writes a ```js script -> sandboxed subprocess calls GitHub
//   4. only stdout enters the conversation
//
// Ground truth is fetched locally right before each task (data is live).
const fs = require('fs');
const { spawn } = require('child_process');
const { callModel, MODEL } = require('./lib/anthropic');
const { estimateTokens } = require('./lib/tokens');

const CDC = fs.readFileSync(__dirname + '/cdc/github/CDC.md', 'utf8');
const SKILL = fs.readFileSync(__dirname + '/cdc/github/SKILL.md', 'utf8');

// parse CDC.md into tag -> section text
const sections = new Map();
for (const m of CDC.matchAll(/^## (.+)$\n([\s\S]*?)(?=^## |\n*$(?![\s\S]))/gm)) {
  sections.set(m[1].trim().toLowerCase(), `## ${m[1]}\n${m[2].trim()}`);
}

const gh = (path) => fetch('https://api.github.com' + path, { headers: { 'user-agent': 'cdc-bench' } }).then((r) => r.json());

const TASKS = [
  {
    name: 'user_public_repos',
    prompt: "How many public repositories does the GitHub user 'torvalds' have? Reply with ONLY the integer.",
    truth: async () => String((await gh('/users/torvalds')).public_repos),
    check: (a, t) => parseInt(a.match(/\d+/)?.[0] ?? 'NaN', 10) === parseInt(t, 10),
  },
  {
    name: 'newest_org_repo',
    prompt: "What is the full_name of the most recently created public repository in the 'anthropics' GitHub organization? Reply with ONLY the full_name.",
    truth: async () => (await gh('/orgs/anthropics/repos?sort=created&direction=desc&per_page=1'))[0].full_name,
    check: (a, t) => a.trim().toLowerCase().includes(t.toLowerCase()),
  },
  {
    name: 'org_total_stars',
    prompt: "What is the total stargazers_count summed across ALL public repositories of the 'anthropics' GitHub organization? Reply with ONLY the integer.",
    truth: async () => {
      let total = 0;
      for (let page = 1; ; page++) {
        const repos = await gh(`/orgs/anthropics/repos?per_page=100&page=${page}`);
        if (!Array.isArray(repos) || repos.length === 0) break;
        total += repos.reduce((s, r) => s + r.stargazers_count, 0);
      }
      return String(total);
    },
    // stars move in real time; allow 1% drift between truth fetch and script run
    check: (a, t) => {
      const x = parseInt(a.match(/\d+/)?.[0] ?? 'NaN', 10), y = parseInt(t, 10);
      return Number.isFinite(x) && Math.abs(x - y) <= Math.max(5, y * 0.01);
    },
  },
];

function runSandboxed(script) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['-e', script], { timeout: 60000 });
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('close', (code) => resolve(code === 0 ? { ok: true, out: out.trim() } : { ok: false, out: (err || `exit ${code}`).slice(0, 800) }));
  });
}

function newStats() { return { trips: 0, inputTokens: 0, outputTokens: 0, sectionTokens: 0 }; }
const textOf = (r) => r.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();

async function runTask(task) {
  const stats = newStats();
  const system = `${SKILL}

You are running headless: you cannot grep. Instead, FIRST reply with exactly one line:
SECTIONS: <comma-separated tag names from the list above>
You will receive those sections' endpoint lines. THEN reply with one \`\`\`js script following the CDC rules (Node 18+, global fetch, print ONLY the final answer; include a user-agent header on GitHub requests).`;
  const messages = [{ role: 'user', content: task.prompt }];
  for (let turn = 0; turn < 8; turn++) {
    const resp = await callModel({ system, messages });
    addUsage: { stats.trips += 1; const u = resp.usage; stats.inputTokens += (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0); stats.outputTokens += u.output_tokens || 0; }
    messages.push({ role: 'assistant', content: resp.content });
    const text = textOf(resp);
    const code = text.match(/```(?:js|javascript)?\n([\s\S]*?)```/)?.[1];
    if (code) {
      const run = await runSandboxed(code);
      process.stderr.write(`  [${task.name}] script: ${run.ok ? 'ok -> ' + run.out.slice(0, 60) : 'ERR ' + run.out.slice(0, 80)}\n`);
      if (run.ok && run.out) return { answer: run.out, stats };
      messages.push({ role: 'user', content: `Script failed:\n${run.out || '(empty stdout)'}\nFix it and reply with one \`\`\`js code block.` });
      continue;
    }
    const secMatch = text.match(/SECTIONS:\s*(.+)/i);
    if (secMatch) {
      const asked = secMatch[1].split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const found = asked.map((t) => sections.get(t)).filter(Boolean);
      const blob = found.length ? found.join('\n\n') : `No such sections. Available: ${[...sections.keys()].join(', ')}`;
      stats.sectionTokens += estimateTokens(blob);
      process.stderr.write(`  [${task.name}] sections: ${asked.join(',')} (${estimateTokens(blob)} tok)\n`);
      messages.push({ role: 'user', content: blob });
      continue;
    }
    messages.push({ role: 'user', content: 'Reply with either a SECTIONS: line or one ```js code block.' });
  }
  return { answer: '(failed)', stats };
}

async function main() {
  console.log(`model=${MODEL}, target=api.github.com (real, unauthenticated), CDC generated by cdc-make from the 12.7MB official spec\n`);
  const rows = [];
  for (const task of TASKS) {
    const truth = await task.truth();
    const t0 = performance.now();
    const { answer, stats } = await runTask(task);
    const wallS = (performance.now() - t0) / 1000;
    const correct = task.check(answer, truth);
    rows.push({ task: task.name, ...stats, wallS, answer: answer.slice(0, 60), truth, correct });
    console.log(`${task.name}: trips=${stats.trips} in=${stats.inputTokens} out=${stats.outputTokens} wall=${wallS.toFixed(1)}s correct=${correct} answer="${answer.slice(0, 60)}" truth="${truth}"`);
  }
  let md = `# Live CDC test — ${MODEL} driving the real GitHub API via a generated CDC\n\n`;
  md += 'CDC compiled by cdc-make from GitHub\'s official 12.7MB OpenAPI spec (1,196 endpoints).\n';
  md += 'Upfront context: 909-token SKILL preamble. Model requests CDC sections on demand.\n\n';
  md += '| task | trips | input tok | output tok | section tok served | wall | correct | answer |\n|---|---|---|---|---|---|---|---|\n';
  for (const r of rows) md += `| ${r.task} | ${r.trips} | ${r.inputTokens.toLocaleString()} | ${r.outputTokens.toLocaleString()} | ${r.sectionTokens.toLocaleString()} | ${r.wallS.toFixed(1)}s | ${r.correct ? '✔' : `✘ (truth: ${r.truth})`} | \`${r.answer}\` |\n`;
  const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
  md += `| **TOTAL** | ${sum('trips')} | ${sum('inputTokens').toLocaleString()} | ${sum('outputTokens').toLocaleString()} | ${sum('sectionTokens').toLocaleString()} | ${sum('wallS').toFixed(1)}s | ${rows.filter((r) => r.correct).length}/${rows.length} | |\n`;
  fs.writeFileSync(__dirname + '/results-cdc-live.md', md);
  console.log('\n' + md);
}

main().catch((e) => { console.error(e); process.exit(1); });

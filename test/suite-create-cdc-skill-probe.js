#!/usr/bin/env node
// Drives the shipped create-cdc-skill CLI against a live local MCP probe.
// Asserts non-null command in manifest + skill files exist. No hard-coded tool dumps.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.resolve(__dirname, '..');
const creator = path.join(root, 'skills/cdc-skill-creator/scripts/create-cdc-skill.js');
const scratch = process.env.CDC_SUITE_SCRATCH || fs.mkdtempSync(path.join(os.tmpdir(), 'cdc-probe-'));
const skillsDir = path.join(scratch, 'skills-out');
fs.mkdirSync(skillsDir, { recursive: true });

// Use server-memory — no auth, stable tool list
const probeScript = path.join(scratch, 'mem-probe.sh');
const memFile = path.join(scratch, 'memory.jsonl');
fs.writeFileSync(memFile, '');
fs.writeFileSync(probeScript, `#!/bin/bash\nexport MEMORY_FILE_PATH="${memFile}"\nexec npx -y @modelcontextprotocol/server-memory "$@"\n`);
fs.chmodSync(probeScript, 0o755);

const r = spawnSync(process.execPath, [
  creator, 'from-mcp', '--name', 'memory', '--probe', probeScript, '--skills-dir', skillsDir,
], { encoding: 'utf8', timeout: 120000, env: process.env });

const out = (r.stdout || '') + (r.stderr || '');
let report;
try {
  const line = out.trim().split('\n').filter(l => l.startsWith('{') && l.includes('"ok"')).pop();
  report = JSON.parse(line);
} catch (e) {
  console.error('FAIL: could not parse creator JSON output');
  console.error(out.slice(-1500));
  process.exit(1);
}

if (!report.ok) {
  console.error('FAIL: creator returned ok=false', report);
  process.exit(1);
}
if (report.tools < 5) {
  console.error('FAIL: expected >=5 tools, got', report.tools);
  process.exit(1);
}

const skillDir = path.join(skillsDir, 'memory-cdc');
for (const f of ['SKILL.md', 'CDC.md', 'mcp-call.js', 'mcp-manifest.json', 'stats.json']) {
  const p = path.join(skillDir, f);
  if (!fs.existsSync(p)) {
    console.error('FAIL: missing', p);
    process.exit(1);
  }
}
const manifest = JSON.parse(fs.readFileSync(path.join(skillDir, 'mcp-manifest.json'), 'utf8'));
if (!manifest.command) {
  console.error('FAIL: manifest.command is null/empty — skill cannot launch MCP');
  process.exit(1);
}
if (manifest.command !== probeScript && !String(manifest.command).includes('mem-probe')) {
  // still ok if absolute path equals probe
  if (path.resolve(manifest.command) !== path.resolve(probeScript)) {
    console.error('FAIL: unexpected command', manifest.command);
    process.exit(1);
  }
}

// Smoke: openSession + read_graph via generated bridge
const smoke = spawnSync(process.execPath, ['-e', `
const { openSession } = require(${JSON.stringify(path.join(skillDir, 'mcp-call.js'))});
(async () => {
  const s = await openSession();
  const g = await s.call('read_graph', {});
  if (!g || (!g.entities && !g.content)) throw new Error('bad read_graph shape '+JSON.stringify(g).slice(0,200));
  s.close();
  console.log('smoke_ok');
})().catch(e => { console.error(e); process.exit(1); });
`], { encoding: 'utf8', timeout: 60000, env: { ...process.env, MEMORY_FILE_PATH: memFile, CDC_MCP_DAEMON: '0' } });

if (smoke.status !== 0 || !String(smoke.stdout).includes('smoke_ok')) {
  console.error('FAIL: bridge smoke', smoke.stdout, smoke.stderr);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  tools: report.tools,
  skillTokens: report.skillTokens,
  sourceTokens: report.sourceTokens,
  compression: report.definitionSavingsRatio || report.compression,
  command: manifest.command,
  skillDir,
}, null, 2));
process.exit(0);

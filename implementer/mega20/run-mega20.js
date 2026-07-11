#!/usr/bin/env node
/**
 * mega20 harness — Codex MCP vs CDC USE arms across ~20 servers.
 * Isolated CODEX_HOME per arm; skills only under mega20/skills (not user dirs).
 */
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync, execSync } = require('child_process');

const MEGA = path.resolve(__dirname);
const ROOT = path.resolve(MEGA, '../..');
const CREATE = path.join(ROOT, 'skills/cdc-skill-creator/scripts/create-cdc-skill.js');
const TARGETS = JSON.parse(fs.readFileSync(path.join(MEGA, 'targets.json'), 'utf8'));
const FIX = path.join(MEGA, 'fixtures');
const BIN = path.join(MEGA, 'bin');
const SKILLS = path.join(MEGA, 'skills');
const RESULTS = path.join(MEGA, 'results');
const LOGS = path.join(MEGA, 'logs');
const MODEL = process.env.CODEX_MODEL || 'gpt-5.6-luna';
const TIMEOUT_MS = parseInt(process.env.ARM_TIMEOUT_MS || '300000', 10);
const PARALLEL = parseInt(process.env.PARALLEL || '3', 10);
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(s => s.trim()) : null;
const PHASE = process.env.PHASE || 'all'; // setup|prebuild|mcp|use|score|all

function expand(s) {
  if (s == null) return s;
  return String(s)
    .replaceAll('FIXTURES', FIX)
    .replaceAll('BIN', BIN)
    .replaceAll('MEGA', MEGA);
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function write(p, c) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, c);
}

function resolveCommand(t) {
  const cmd = t.command.map(expand);
  const env = { ...process.env };
  if (t.env) {
    for (const [k, v] of Object.entries(t.env)) {
      if (v === 'FROM_GH') {
        try {
          env.GITHUB_TOKEN = execSync('gh auth token', { encoding: 'utf8' }).trim();
          env.GITHUB_PERSONAL_ACCESS_TOKEN = env.GITHUB_TOKEN;
        } catch {
          env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
        }
      } else {
        env[k] = expand(v);
      }
    }
  }
  return { cmd, env };
}

function writeMcpLauncher(t, home) {
  const { cmd, env } = resolveCommand(t);
  const shPath = path.join(home, `${t.id}-mcp.sh`);
  const lines = ['#!/bin/bash', 'set -e'];
  if (t.env) {
    for (const [k, v] of Object.entries(t.env)) {
      if (v === 'FROM_GH') continue;
      lines.push(`export ${k}=${JSON.stringify(expand(v))}`);
    }
  }
  if (t.id === 'github') {
    lines.push('export GITHUB_TOKEN="${GITHUB_TOKEN:-$(gh auth token 2>/dev/null)}"');
    lines.push('export GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_TOKEN"');
  }
  lines.push(`exec ${cmd.map(c => JSON.stringify(c)).join(' ')} "$@"`);
  write(shPath, lines.join('\n') + '\n');
  fs.chmodSync(shPath, 0o755);
  return shPath;
}

function setupHomes() {
  for (const t of TARGETS) {
    if (ONLY && !ONLY.includes(t.id)) continue;
    const home = path.join(MEGA, 'homes', t.id);
    ensureDir(path.join(home, 'out'));
    ensureDir(path.join(home, 'work'));
    const launcher = writeMcpLauncher(t, home);
    write(path.join(home, 'truth.json'), JSON.stringify(t.truth, null, 2));
    write(path.join(home, 'prompt-mcp.txt'), t.prompt_mcp + '\n');
    write(path.join(home, 'prompt-use.txt'), t.prompt_use + '\n');
    write(path.join(home, 'score_keys.json'), JSON.stringify(t.score_keys, null, 2));

    const mcpHome = path.join(home, 'mcp-home');
    ensureDir(mcpHome);
    const mcpCfg = `model = "${MODEL}"
model_reasoning_effort = "medium"
approval_policy = "never"
sandbox_mode = "danger-full-access"

[projects."${path.join(home, 'work')}"]
trust_level = "trusted"

[projects."${ROOT}"]
trust_level = "trusted"

[projects."${MEGA}"]
trust_level = "trusted"

[mcp_servers.${t.id}]
command = "${launcher}"
args = []
`;
    write(path.join(mcpHome, 'config.toml'), mcpCfg);
    try {
      const authSrc = path.join(process.env.HOME || '', '.codex', 'auth.json');
      if (fs.existsSync(authSrc)) fs.copyFileSync(authSrc, path.join(mcpHome, 'auth.json'));
      const mc = path.join(process.env.HOME || '', '.codex', 'models_cache.json');
      if (fs.existsSync(mc)) fs.copyFileSync(mc, path.join(mcpHome, 'models_cache.json'));
    } catch {}


    const useHome = path.join(home, 'use-home');
    ensureDir(useHome);
    const useCfg = `model = "${MODEL}"
model_reasoning_effort = "medium"
approval_policy = "never"
sandbox_mode = "danger-full-access"

[projects."${path.join(home, 'work')}"]
trust_level = "trusted"

[projects."${ROOT}"]
trust_level = "trusted"

[projects."${MEGA}"]
trust_level = "trusted"
`;
    write(path.join(useHome, 'config.toml'), useCfg);
    try {
      const authSrc = path.join(process.env.HOME || '', '.codex', 'auth.json');
      if (fs.existsSync(authSrc)) fs.copyFileSync(authSrc, path.join(useHome, 'auth.json'));
      const mc = path.join(process.env.HOME || '', '.codex', 'models_cache.json');
      if (fs.existsSync(mc)) fs.copyFileSync(mc, path.join(useHome, 'models_cache.json'));
    } catch {}

    const skillsLink = path.join(useHome, 'skills');
    try { fs.rmSync(skillsLink, { recursive: true, force: true }); } catch {}
    try { fs.symlinkSync(SKILLS, skillsLink, 'dir'); } catch {}
    console.log('setup', t.id);
  }
}

function probeName(t) {
  if (t.id === 'filesystem_large') return 'filesystem-large';
  return t.id;
}

function prebuildOne(t) {
  if (ONLY && !ONLY.includes(t.id)) return null;
  const home = path.join(MEGA, 'homes', t.id);
  const launcher = path.join(home, `${t.id}-mcp.sh`);
  const outLog = path.join(LOGS, `prebuild-${t.id}.json`);
  const errLog = path.join(LOGS, `prebuild-${t.id}.err`);
  const skillName = t.skill || `${t.id}-cdc`;
  const args = [
    CREATE,
    'from-mcp',
    '--name', probeName(t),
    '--probe', launcher,
    '--skills-dir', SKILLS,
    '--target', 'codex',
    '--out', path.join(MEGA, '.cdc-build'),
    '--skill-name', skillName,
  ];
  console.log('prebuild', t.id, '...');
  const r = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, ...resolveCommand(t).env },
    timeout: 180000,
  });
  fs.writeFileSync(errLog, (r.stderr || '') + '\n' + (r.stdout || ''));
  const line = (r.stdout || '').trim().split('\n').filter(Boolean).pop() || '';
  try {
    const j = JSON.parse(line);
    fs.writeFileSync(outLog, JSON.stringify(j, null, 2));
    console.log('prebuild', t.id, j.ok ? `ok tools=${j.tools} warmed=${j.warmed} skill=${j.skillName}` : j);

    // Rename if skill landed under unexpected name
    const installed = (j.installed || [])[0];
    if (installed && path.basename(installed) !== skillName) {
      const dest = path.join(SKILLS, skillName);
      if (!fs.existsSync(dest)) {
        fs.renameSync(installed, dest);
      }
    }
    const skillDir = path.join(SKILLS, skillName);
    const call = path.join(skillDir, 'mcp-call.js');
    if (fs.existsSync(call)) {
      spawnSync(process.execPath, [call, 'daemon-start'], { encoding: 'utf8', timeout: 90000 });
    }
    return j;
  } catch (e) {
    fs.writeFileSync(outLog, JSON.stringify({ ok: false, error: String(e), raw: line, code: r.status }));
    console.log('prebuild FAIL', t.id, r.status, line.slice(0, 300));
    return { ok: false };
  }
}

function prebuildAll() {
  ensureDir(SKILLS);
  ensureDir(path.join(MEGA, '.cdc-build'));
  for (const t of TARGETS) {
    if (ONLY && !ONLY.includes(t.id)) continue;
    prebuildOne(t);
  }
}

function extractJson(text) {
  const matches = [];
  let depth = 0, start = -1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        matches.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
  for (let i = matches.length - 1; i >= 0; i--) {
    try { return JSON.parse(matches[i]); } catch {}
  }
  return null;
}

function extractTokens(text) {
  const m = text.match(/tokens used\s*\n\s*([\d,]+)/i);
  if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  const m2 = text.match(/tokens used[:\s]+([\d,]+)/i);
  if (m2) return parseInt(m2[1].replace(/,/g, ''), 10);
  return null;
}

function purity(text) {
  const t = text || '';
  return {
    curl: (t.match(/\bcurl\b/g) || []).length,
    gh_cli: (t.match(/\bgh\s+(api|repo|auth)\b/g) || []).length,
    sqlite3_cli: (t.match(/\bsqlite3\b/g) || []).length,
    mcp_calls: (t.match(/mcp:\s+\w+\//g) || []).length,
    openSession: (t.match(/openSession/g) || []).length,
    callPaged: (t.match(/callPaged/g) || []).length,
    mcp_call_js: (t.match(/mcp-call\.js/g) || []).length,
  };
}

function runArm(t, arm) {
  return new Promise((resolve) => {
    if (ONLY && !ONLY.includes(t.id)) return resolve(null);
    const home = path.join(MEGA, 'homes', t.id);
    const work = path.join(home, 'work');
    const outDir = path.join(home, 'out');
    ensureDir(outDir);
    ensureDir(work);
    const codexHome = path.join(home, arm === 'mcp' ? 'mcp-home' : 'use-home');
    const prompt = fs.readFileSync(path.join(home, arm === 'mcp' ? 'prompt-mcp.txt' : 'prompt-use.txt'), 'utf8');

    if (arm === 'use') {
      const skillsLink = path.join(codexHome, 'skills');
      try {
        if (!fs.existsSync(skillsLink)) fs.symlinkSync(SKILLS, skillsLink, 'dir');
      } catch {}
      const skillDir = path.join(SKILLS, t.skill);
      const call = path.join(skillDir, 'mcp-call.js');
      if (fs.existsSync(call)) {
        // Block until daemon is actually warm so first tool call is not cold-start.
        const warm = spawnSync(process.execPath, [call, 'daemon-start'], {
          encoding: 'utf8',
          timeout: 120000,
        });
        if (warm.status !== 0) {
          console.log(`WARN daemon-start ${t.id}:`, (warm.stderr || warm.stdout || '').slice(0, 200));
        }
      }
    }

    const env = {
      ...process.env,
      CODEX_HOME: codexHome,
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      ...resolveCommand(t).env,
    };
    if (t.id === 'filesystem' || t.id === 'filesystem_large') {
      env.CDC_FS_ROOT = path.join(FIX, 'fsroot');
    }

    console.log(`RUN ${arm} ${t.id} ...`);
    const t0 = Date.now();
    const child = spawn(
      'codex',
      [
        'exec',
        '--dangerously-bypass-approvals-and-sandbox',
        '-m', MODEL,
        '-c', 'model_reasoning_effort="medium"',
        prompt,
      ],
      { cwd: work, env, stdio: ['ignore', 'pipe', 'pipe'] }
    );

    let out = '', err = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.stderr.on('data', d => { err += d.toString(); });

    const timer = setTimeout(() => {
      try { child.kill('SIGTERM'); } catch {}
      setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 3000);
    }, TIMEOUT_MS);

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const secs = Math.round((Date.now() - t0) / 1000);
      const text = out + '\n' + err;
      const logPath = path.join(outDir, `${arm}.log`);
      fs.writeFileSync(logPath, text);
      const tokens = extractTokens(text);
      const ans = extractJson(text);
      const meta = {
        target: t.id,
        arm,
        exit: code,
        secs,
        tokens,
        signal: signal || null,
        purity: purity(text),
        ans,
      };
      fs.writeFileSync(path.join(outDir, `${arm}.meta`), `${arm} ${t.id} exit=${code} secs=${secs}\n${tokens != null ? tokens + ':tokens used' : 'no-tokens'}\n`);
      fs.writeFileSync(path.join(outDir, `${arm}.ans.json`), JSON.stringify(ans, null, 2));
      fs.writeFileSync(path.join(outDir, `${arm}.run.json`), JSON.stringify(meta, null, 2));
      console.log(`DONE ${arm} ${t.id} exit=${code} ${secs}s tokens=${tokens}`);
      resolve(meta);
    });
  });
}

function scoreValue(key, got, expect, ans) {
  if (key.endsWith('_min')) {
    const base = key.replace(/_min$/, '');
    const n = ans && (ans[base] != null ? ans[base] : ans[key]);
    if (typeof expect === 'number') {
      if (typeof n === 'number') return n >= expect;
      if (typeof got === 'boolean') return got === true;
      if (typeof got === 'number') return got >= expect;
    }
    return false;
  }
  if (Array.isArray(expect)) {
    if (!Array.isArray(got)) return false;
    const a = [...got].map(String).sort().join('\0');
    const b = [...expect].map(String).sort().join('\0');
    return a === b;
  }
  if (typeof expect === 'number') {
    const n = typeof got === 'number' ? got : Number(got);
    if (!Number.isFinite(n)) return false;
    return Math.abs(n - expect) < 0.02 || Math.abs(n - expect) / (Math.abs(expect) || 1) < 0.001;
  }
  if (typeof expect === 'boolean') return got === expect;
  return got === expect;
}

function scoreArm(t, ans) {
  const detail = {};
  let ok = 0;
  const keys = t.score_keys || Object.keys(t.truth);
  for (const k of keys) {
    const expect = t.truth[k];
    let got = ans ? ans[k] : undefined;
    if (k === 'tool_count_min' && ans && ans.tool_count != null) got = ans.tool_count;
    if (k === 'file_count_min' && ans && ans.file_count != null) got = ans.file_count;
    if (k === 'thought_steps_min' && ans && ans.thought_steps != null) got = ans.thought_steps;
    if (k === 'allowed_count_min' && ans && ans.allowed_count != null) got = ans.allowed_count;
    const good = scoreValue(k, got, expect, ans);
    detail[k] = good;
    if (good) ok++;
  }
  return { ok, total: keys.length, detail, score: `${ok}/${keys.length}` };
}

function safeJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function scoreAll() {
  const rows = [];
  for (const t of TARGETS) {
    if (ONLY && !ONLY.includes(t.id)) continue;
    const home = path.join(MEGA, 'homes', t.id);
    const mcpRun = safeJson(path.join(home, 'out', 'mcp.run.json'));
    const useRun = safeJson(path.join(home, 'out', 'use.run.json'));
    const mcpAns = mcpRun?.ans || safeJson(path.join(home, 'out', 'mcp.ans.json'));
    const useAns = useRun?.ans || safeJson(path.join(home, 'out', 'use.ans.json'));
    const mcpS = scoreArm(t, mcpAns);
    const useS = scoreArm(t, useAns);
    rows.push({
      target: t.id,
      auth: !!t.auth,
      mcp_tokens: mcpRun?.tokens ?? null,
      mcp_wall: mcpRun?.secs ?? null,
      mcp_score: mcpS.score,
      mcp_ok: mcpS.ok,
      mcp_total: mcpS.total,
      mcp_detail: mcpS.detail,
      mcp_ans: mcpAns,
      mcp_purity: mcpRun?.purity || null,
      use_tokens: useRun?.tokens ?? null,
      use_wall: useRun?.secs ?? null,
      use_score: useS.score,
      use_ok: useS.ok,
      use_total: useS.total,
      use_detail: useS.detail,
      use_ans: useAns,
      use_purity: useRun?.purity || null,
    });
    console.log(
      t.id,
      'MCP', mcpS.score, `tok=${mcpRun?.tokens} wall=${mcpRun?.secs}`,
      '| USE', useS.score, `tok=${useRun?.tokens} wall=${useRun?.secs}`
    );
  }
  write(path.join(RESULTS, 'scored.json'), JSON.stringify(rows, null, 2));
  return rows;
}

async function mapPool(items, limit, fn) {
  const ret = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      ret[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return ret;
}

let httpProc = null;
let mockProc = null;

function startServers() {
  const httpLog = path.join(LOGS, 'http-fixture.log');
  const staticJs = `
const http=require('http');const fs=require('fs');const path=require('path');
const root=${JSON.stringify(FIX)};
http.createServer((req,res)=>{
  let p=decodeURIComponent((req.url||'/').split('?')[0]);
  if(p==='/') p='/store.html';
  const fp=path.join(root, p.replace(/^\\//,''));
  if(!fp.startsWith(root) || !fs.existsSync(fp)) { res.writeHead(404); return res.end('nf'); }
  const ext=path.extname(fp);
  const ct=ext==='.html'?'text/html':ext==='.json'?'application/json':'text/plain';
  res.writeHead(200,{'content-type':ct}); fs.createReadStream(fp).pipe(res);
}).listen(8766,'127.0.0.1',()=>console.log('static :8766'));
`;
  write(path.join(MEGA, 'bin', 'static-server.js'), staticJs);

  // kill old
  for (const name of ['http.pid', 'mock.pid']) {
    try {
      const pid = parseInt(fs.readFileSync(path.join(LOGS, name), 'utf8'), 10);
      if (pid) process.kill(pid, 'SIGTERM');
    } catch {}
  }

  httpProc = spawn(process.execPath, [path.join(MEGA, 'bin', 'static-server.js')], {
    stdio: 'ignore',
    detached: true,
  });
  fs.writeFileSync(path.join(LOGS, 'http.pid'), String(httpProc.pid));
  httpProc.unref();

  const mockApi = path.join(ROOT, 'server/mock-api.js');
  if (fs.existsSync(mockApi)) {
    mockProc = spawn(process.execPath, [mockApi], {
      env: {
        ...process.env,
        PORT: '8791',
        N_PRODUCTS: '30',
        N_ORDERS: '200',
        N_USERS: '50',
      },
      stdio: 'ignore',
      detached: true,
    });
    fs.writeFileSync(path.join(LOGS, 'mock.pid'), String(mockProc.pid));
    mockProc.unref();
  }
  spawnSync('sleep', ['1']);
  console.log('servers up :8766 :8791');
}

function stopServers() {
  for (const name of ['http.pid', 'mock.pid']) {
    const p = path.join(LOGS, name);
    try {
      const pid = parseInt(fs.readFileSync(p, 'utf8'), 10);
      if (pid) process.kill(pid, 'SIGTERM');
    } catch {}
  }
}

async function main() {
  ensureDir(RESULTS);
  ensureDir(LOGS);
  ensureDir(SKILLS);

  if (PHASE === 'setup' || PHASE === 'all') setupHomes();
  if (['servers', 'all', 'mcp', 'use'].includes(PHASE)) startServers();
  if ((PHASE === 'prebuild' || PHASE === 'all') && process.env.SKIP_PREBUILD !== '1') prebuildAll();
  else if (PHASE === 'all' && process.env.SKIP_PREBUILD === '1') console.log('skip prebuild');

  if (PHASE === 'mcp' || PHASE === 'all') {
    const list = TARGETS.filter(t => !ONLY || ONLY.includes(t.id));
    await mapPool(list, PARALLEL, (t) => runArm(t, 'mcp'));
  }
  if (PHASE === 'use' || PHASE === 'all') {
    const list = TARGETS.filter(t => !ONLY || ONLY.includes(t.id));
    await mapPool(list, PARALLEL, (t) => runArm(t, 'use'));
  }
  if (PHASE === 'score' || PHASE === 'all') {
    const rows = scoreAll();
    console.log('scored', rows.length, '->', path.join(RESULTS, 'scored.json'));
  }
  if (['all', 'mcp', 'use', 'servers'].includes(PHASE)) {
    // keep servers for multi-phase manual runs? stop only on all or when env STOP_SERVERS=1
    if (PHASE === 'all' || process.env.STOP_SERVERS === '1') stopServers();
  }
  // force exit — detached servers should not pin event loop
  setTimeout(() => process.exit(0), 200).unref();
}

main().catch(e => {
  console.error(e);
  stopServers();
  process.exit(1);
});

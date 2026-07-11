#!/usr/bin/env node
/**
 * mega40 harness — ~40 MCPs x three arms: MCP | text CDC | image .cdc
 *
 * Image skill is MAIN path (CDC_IMAGE default). Text arm forces CDC_IMAGE=0.
 *
 * Phases: setup | prebuild | mcp | text | image | score | all
 * Env: CODEX_MODEL, ARM_TIMEOUT_MS, PARALLEL, ONLY, PHASE, SKIP_PREBUILD,
 *      ARMS=mcp,text,image  SKIP_MCP=1
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync, execSync } = require('child_process');

const MEGA = path.resolve(__dirname);
const ROOT = path.resolve(MEGA, '../..');
const CREATE = path.join(ROOT, 'skills/cdc-skill-creator/scripts/create-cdc-skill.js');
const TARGETS = JSON.parse(fs.readFileSync(path.join(MEGA, 'targets.json'), 'utf8'));
const FIX = (() => {
  const local = path.join(MEGA, 'fixtures');
  const alt = path.join(MEGA, '../mega20/fixtures');
  if (fs.existsSync(local)) return local;
  if (fs.existsSync(alt)) return alt;
  return local;
})();
const BIN = path.join(MEGA, 'bin');
const SKILLS_TEXT = path.join(MEGA, 'skills-text');
const SKILLS_IMAGE = path.join(MEGA, 'skills-image');
const RESULTS = path.join(MEGA, 'results');
const LOGS = path.join(MEGA, 'logs');
const MODEL = process.env.CODEX_MODEL || 'gpt-5.6-sol';
const TIMEOUT_MS = parseInt(process.env.ARM_TIMEOUT_MS || '300000', 10);
const PARALLEL = parseInt(process.env.PARALLEL || '2', 10);
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map((s) => s.trim()) : null;
const PHASE = process.env.PHASE || 'all';
const ARMS = (process.env.ARMS || 'mcp,text,image')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

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
function safeJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
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
  const { cmd } = resolveCommand(t);
  const shPath = path.join(home, t.id + '-mcp.sh');
  const lines = ['#!/bin/bash', 'set -e'];
  if (t.env) {
    for (const [k, v] of Object.entries(t.env)) {
      if (v === 'FROM_GH') continue;
      lines.push('export ' + k + '=' + JSON.stringify(expand(v)));
    }
  }
  if (t.id === 'github') {
    lines.push('export GITHUB_TOKEN="${GITHUB_TOKEN:-$(gh auth token 2>/dev/null)}"');
    lines.push('export GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_TOKEN"');
  }
  lines.push('exec ' + cmd.map((c) => JSON.stringify(c)).join(' ') + ' "$@"');
  write(shPath, lines.join('\n') + '\n');
  fs.chmodSync(shPath, 0o755);
  return shPath;
}

function copyAuth(dest) {
  try {
    const authSrc = path.join(process.env.HOME || '', '.codex', 'auth.json');
    if (fs.existsSync(authSrc)) fs.copyFileSync(authSrc, path.join(dest, 'auth.json'));
    const mc = path.join(process.env.HOME || '', '.codex', 'models_cache.json');
    if (fs.existsSync(mc)) fs.copyFileSync(mc, path.join(dest, 'models_cache.json'));
  } catch {}
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
    write(path.join(home, 'prompt-text.txt'), (t.prompt_use || t.prompt_mcp) + '\n');
    write(path.join(home, 'prompt-image.txt'), (t.prompt_image || t.prompt_use || t.prompt_mcp) + '\n');
    write(path.join(home, 'score_keys.json'), JSON.stringify(t.score_keys, null, 2));

    const mcpHome = path.join(home, 'mcp-home');
    ensureDir(mcpHome);
    write(
      path.join(mcpHome, 'config.toml'),
      'model = "' + MODEL + '"\n' +
      'model_reasoning_effort = "medium"\n' +
      'approval_policy = "never"\n' +
      'sandbox_mode = "danger-full-access"\n\n' +
      '[projects."' + path.join(home, 'work') + '"]\ntrust_level = "trusted"\n\n' +
      '[projects."' + ROOT + '"]\ntrust_level = "trusted"\n\n' +
      '[projects."' + MEGA + '"]\ntrust_level = "trusted"\n\n' +
      '[mcp_servers.' + t.id + ']\ncommand = "' + launcher + '"\nargs = []\n',
    );
    copyAuth(mcpHome);

    const textHome = path.join(home, 'text-home');
    ensureDir(textHome);
    write(
      path.join(textHome, 'config.toml'),
      'model = "' + MODEL + '"\n' +
      'model_reasoning_effort = "medium"\n' +
      'approval_policy = "never"\n' +
      'sandbox_mode = "danger-full-access"\n\n' +
      '[projects."' + path.join(home, 'work') + '"]\ntrust_level = "trusted"\n\n' +
      '[projects."' + ROOT + '"]\ntrust_level = "trusted"\n\n' +
      '[projects."' + MEGA + '"]\ntrust_level = "trusted"\n',
    );
    copyAuth(textHome);
    const textSkillsLink = path.join(textHome, 'skills');
    try { fs.rmSync(textSkillsLink, { recursive: true, force: true }); } catch {}
    try { fs.symlinkSync(SKILLS_TEXT, textSkillsLink, 'dir'); } catch {}

    const imageHome = path.join(home, 'image-home');
    ensureDir(imageHome);
    write(
      path.join(imageHome, 'config.toml'),
      'model = "' + MODEL + '"\n' +
      'model_reasoning_effort = "medium"\n' +
      'approval_policy = "never"\n' +
      'sandbox_mode = "danger-full-access"\n\n' +
      '[projects."' + path.join(home, 'work') + '"]\ntrust_level = "trusted"\n\n' +
      '[projects."' + ROOT + '"]\ntrust_level = "trusted"\n\n' +
      '[projects."' + MEGA + '"]\ntrust_level = "trusted"\n',
    );
    copyAuth(imageHome);
    console.log('setup', t.id);
  }
}

function probeName(t) {
  if (t.id === 'filesystem_large') return 'filesystem-large';
  return t.id;
}

function prebuildOne(t, mode) {
  if (ONLY && !ONLY.includes(t.id)) return null;
  const home = path.join(MEGA, 'homes', t.id);
  const launcher = path.join(home, t.id + '-mcp.sh');
  const skillsDir = mode === 'image' ? SKILLS_IMAGE : SKILLS_TEXT;
  const outLog = path.join(LOGS, 'prebuild-' + mode + '-' + t.id + '.json');
  const errLog = path.join(LOGS, 'prebuild-' + mode + '-' + t.id + '.err');
  const skillName = t.skill || t.id + '-cdc';
  ensureDir(skillsDir);
  ensureDir(path.join(MEGA, '.cdc-build', mode));

  const args = [
    CREATE, 'from-mcp', '--name', probeName(t), '--probe', launcher,
    '--skills-dir', skillsDir, '--target', 'codex',
    '--out', path.join(MEGA, '.cdc-build', mode),
    '--skill-name', skillName,
  ];
  if (mode === 'text') args.push('--text');

  console.log('prebuild ' + mode, t.id, '...');
  const r = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, ...resolveCommand(t).env, CDC_IMAGE: mode === 'image' ? '1' : '0' },
    timeout: 180000,
  });
  fs.writeFileSync(errLog, (r.stderr || '') + '\n' + (r.stdout || ''));
  const line = (r.stdout || '').trim().split('\n').filter(Boolean).pop() || '';
  try {
    const j = JSON.parse(line);
    fs.writeFileSync(outLog, JSON.stringify(j, null, 2));
    console.log(
      'prebuild ' + mode, t.id,
      j.ok ? 'ok tools=' + j.tools + ' imagePrimary=' + j.imagePrimary + ' pages=' + j.imagePages + ' skill=' + j.skillName : j,
    );
    const installed = (j.installed || [])[0];
    if (installed && path.basename(installed) !== skillName) {
      const dest = path.join(skillsDir, skillName);
      if (!fs.existsSync(dest)) fs.renameSync(installed, dest);
    }
    const skillDir = path.join(skillsDir, skillName);
    const call = path.join(skillDir, 'mcp-call.js');
    if (fs.existsSync(call)) {
      spawnSync(process.execPath, [call, 'daemon-start'], { encoding: 'utf8', timeout: 90000 });
    }
    return j;
  } catch (e) {
    fs.writeFileSync(outLog, JSON.stringify({ ok: false, error: String(e), raw: line, code: r.status }));
    console.log('prebuild FAIL ' + mode, t.id, r.status, line.slice(0, 300));
    return { ok: false };
  }
}

function prebuildAll() {
  ensureDir(SKILLS_TEXT);
  ensureDir(SKILLS_IMAGE);
  ensureDir(path.join(MEGA, '.cdc-build'));
  for (const t of TARGETS) {
    if (ONLY && !ONLY.includes(t.id)) continue;
    prebuildOne(t, 'text');
    prebuildOne(t, 'image');
  }
}

function extractJson(text) {
  const matches = [];
  let depth = 0, start = -1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') { if (depth === 0) start = i; depth++; }
    else if (c === '}') {
      depth--;
      if (depth === 0 && start >= 0) { matches.push(text.slice(start, i + 1)); start = -1; }
    }
  }
  for (let i = matches.length - 1; i >= 0; i--) {
    try { return JSON.parse(matches[i]); } catch {}
  }
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (m) { try { return JSON.parse(m[1].trim()); } catch {} }
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
    mcp_calls: (t.match(/mcp:\s+\w+\//g) || []).length,
    openSession: (t.match(/openSession/g) || []).length,
    callPaged: (t.match(/callPaged/g) || []).length,
    mcp_call_js: (t.match(/mcp-call\.js/g) || []).length,
    image_attach: (t.match(/IMAGE SKILL|\.cdc\.png|attached image/gi) || []).length,
  };
}

function findImagePages(skillDir, skillName) {
  const pages = [];
  if (!fs.existsSync(skillDir)) return pages;
  const files = fs.readdirSync(skillDir);
  const pngs = files
    .filter((f) => f.endsWith('.cdc.png') || (f.endsWith('.png') && f.includes('.cdc')))
    .sort();
  for (const f of pngs) pages.push(path.join(skillDir, f));
  if (!pages.length) {
    const meta = safeJson(path.join(skillDir, 'image-meta.json'));
    if (meta && meta.pageFiles) {
      for (const p of meta.pageFiles) {
        if (fs.existsSync(p)) pages.push(p);
        else {
          const base = path.join(skillDir, path.basename(p));
          if (fs.existsSync(base)) pages.push(base);
        }
      }
    }
  }
  return pages;
}

function runArm(t, arm) {
  return new Promise((resolve) => {
    if (ONLY && !ONLY.includes(t.id)) return resolve(null);
    const home = path.join(MEGA, 'homes', t.id);
    const workBase = path.join(home, 'work');
    const work = path.join(workBase, arm);
    const outDir = path.join(home, 'out');
    ensureDir(outDir);
    ensureDir(work);

    let codexHome;
    let prompt;
    let images = [];

    if (arm === 'mcp') {
      codexHome = path.join(home, 'mcp-home');
      prompt = fs.readFileSync(path.join(home, 'prompt-mcp.txt'), 'utf8');
    } else if (arm === 'text') {
      codexHome = path.join(home, 'text-home');
      prompt = fs.readFileSync(path.join(home, 'prompt-text.txt'), 'utf8');
      const skillsLink = path.join(codexHome, 'skills');
      try { if (!fs.existsSync(skillsLink)) fs.symlinkSync(SKILLS_TEXT, skillsLink, 'dir'); } catch {}
      const skillDir = path.join(SKILLS_TEXT, t.skill);
      const call = path.join(skillDir, 'mcp-call.js');
      if (fs.existsSync(call)) {
        spawnSync(process.execPath, [call, 'daemon-start'], { encoding: 'utf8', timeout: 120000 });
      }
    } else if (arm === 'image') {
      codexHome = path.join(home, 'image-home');
      const skillDir = path.join(SKILLS_IMAGE, t.skill);
      images = findImagePages(skillDir, t.skill.replace(/-cdc$/, ''));
      if (!images.length) images = findImagePages(skillDir, t.skill);
      const bridgeSrc = path.join(skillDir, 'mcp-call.js');
      if (fs.existsSync(bridgeSrc)) {
        fs.copyFileSync(bridgeSrc, path.join(work, 'mcp-call.js'));
        spawnSync(process.execPath, [path.join(work, 'mcp-call.js'), 'daemon-start'], {
          encoding: 'utf8', timeout: 120000,
        });
      }
      if (fs.existsSync(path.join(skillDir, 'mcp-manifest.json'))) {
        fs.copyFileSync(path.join(skillDir, 'mcp-manifest.json'), path.join(work, 'mcp-manifest.json'));
      }
      const basePrompt = fs.readFileSync(path.join(home, 'prompt-image.txt'), 'utf8');
      const imgNames = images.map((p) => path.basename(p));
      prompt =
        'IMAGE SKILL MODE. MCP disabled. Skill body is in ATTACHED image(s): ' +
        (imgNames.join(', ') || '(missing)') + '.\n' +
        'Bridge only: node ' + JSON.stringify(path.join(work, 'mcp-call.js')) + ' --batch \'[...]\'\n' +
        'Do not cat SOURCE.md or SKILL.text.md.\n\n' + basePrompt;
    } else {
      return resolve({ target: t.id, arm, error: 'unknown arm' });
    }

    copyAuth(codexHome);

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

    const args = [
      'exec', '--dangerously-bypass-approvals-and-sandbox',
      '-m', MODEL, '-c', 'model_reasoning_effort="medium"',
    ];
    for (const img of images) args.push('-i', img);
    const useStdin = images.length > 0;
    if (useStdin) args.push('-');
    else args.push(prompt);

    console.log('RUN ' + arm + ' ' + t.id + ' images=' + images.length + ' ...');
    const t0 = Date.now();
    const child = spawn('codex', args, {
      cwd: work, env, stdio: [useStdin ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    });
    if (useStdin) { child.stdin.write(prompt); child.stdin.end(); }

    let out = '', err = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { err += d.toString(); });
    const timer = setTimeout(() => {
      try { child.kill('SIGTERM'); } catch {}
      setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 3000);
    }, TIMEOUT_MS);

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const secs = Math.round((Date.now() - t0) / 1000);
      const text = out + '\n' + err;
      fs.writeFileSync(path.join(outDir, arm + '.log'), text);
      const tokens = extractTokens(text);
      const ans = extractJson(text);
      const meta = {
        target: t.id, arm, model: MODEL, exit: code, secs, tokens,
        signal: signal || null, images: images.map((p) => path.basename(p)),
        purity: purity(text), ans,
      };
      fs.writeFileSync(path.join(outDir, arm + '.run.json'), JSON.stringify(meta, null, 2));
      fs.writeFileSync(path.join(outDir, arm + '.ans.json'), JSON.stringify(ans, null, 2));
      console.log('DONE ' + arm + ' ' + t.id + ' exit=' + code + ' ' + secs + 's tokens=' + tokens);
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
    return Math.abs(n - expect) < 0.05 || Math.abs(n - expect) / (Math.abs(expect) || 1) < 0.002;
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
  return { ok, total: keys.length, detail, score: ok + '/' + keys.length };
}

function scoreAll() {
  const rows = [];
  for (const t of TARGETS) {
    if (ONLY && !ONLY.includes(t.id)) continue;
    const home = path.join(MEGA, 'homes', t.id);
    const row = { target: t.id, auth: !!t.auth, arms: {} };
    for (const arm of ['mcp', 'text', 'image']) {
      const run = safeJson(path.join(home, 'out', arm + '.run.json'));
      const ans = (run && run.ans) || safeJson(path.join(home, 'out', arm + '.ans.json'));
      if (!run && !ans) continue;
      const s = scoreArm(t, ans);
      row.arms[arm] = {
        tokens: run ? run.tokens : null,
        wall: run ? run.secs : null,
        score: s.score, ok: s.ok, total: s.total, detail: s.detail,
        exit: run ? run.exit : null, purity: (run && run.purity) || null,
        images: (run && run.images) || [], ans,
      };
    }
    const m = row.arms.mcp, tx = row.arms.text, im = row.arms.image;
    row.ratios = {};
    if (m && m.tokens && tx && tx.tokens) row.ratios.mcp_over_text = +(m.tokens / tx.tokens).toFixed(2);
    if (m && m.tokens && im && im.tokens) row.ratios.mcp_over_image = +(m.tokens / im.tokens).toFixed(2);
    if (tx && tx.tokens && im && im.tokens) {
      row.ratios.text_over_image = +(tx.tokens / im.tokens).toFixed(2);
      row.ratios.image_vs_text_pct = +((1 - im.tokens / tx.tokens) * 100).toFixed(1);
    }
    rows.push(row);
    const fmt = (a) => row.arms[a]
      ? row.arms[a].score + ' tok=' + row.arms[a].tokens + ' wall=' + row.arms[a].wall
      : '-';
    console.log(t.id, 'MCP', fmt('mcp'), '| TEXT', fmt('text'), '| IMAGE', fmt('image'));
  }
  write(path.join(RESULTS, 'scored.json'), JSON.stringify(rows, null, 2));

  const arms = ['mcp', 'text', 'image'];
  const sums = {};
  for (const a of arms) {
    const withTok = rows.filter((r) => r.arms[a] && r.arms[a].tokens != null);
    const withScore = rows.filter((r) => r.arms[a]);
    const tokSum = withTok.reduce((s, r) => s + r.arms[a].tokens, 0);
    const wallSum = withTok.reduce((s, r) => s + (r.arms[a].wall || 0), 0);
    const okSum = withScore.reduce((s, r) => s + (r.arms[a].ok || 0), 0);
    const totSum = withScore.reduce((s, r) => s + (r.arms[a].total || 0), 0);
    sums[a] = {
      n: withScore.length, n_tok: withTok.length, tokens_sum: tokSum,
      tokens_avg: withTok.length ? Math.round(tokSum / withTok.length) : null,
      wall_sum: wallSum,
      wall_avg: withTok.length ? +(wallSum / withTok.length).toFixed(1) : null,
      accuracy: totSum ? okSum + '/' + totSum : null,
      accuracy_pct: totSum ? +((100 * okSum) / totSum).toFixed(1) : null,
    };
  }

  const dash = (v) => (v == null ? '-' : v);
  const md = [
    '# mega40 three-arm benchmark (MCP vs text CDC vs image .cdc)',
    '',
    '**Model:** `' + MODEL + '`  ',
    '**When:** ' + new Date().toISOString() + '  ',
    '**Targets:** ' + rows.length + ' / ' + TARGETS.length + '  ',
    '**Image skill is MAIN** (default compile path)',
    '',
    '## Aggregate',
    '',
    '| arm | n | avg tokens | avg wall (s) | accuracy |',
    '|-----|---|------------|--------------|----------|',
    '| MCP | ' + sums.mcp.n + ' | ' + dash(sums.mcp.tokens_avg) + ' | ' + dash(sums.mcp.wall_avg) + ' | ' + dash(sums.mcp.accuracy) + ' (' + dash(sums.mcp.accuracy_pct) + '%) |',
    '| text CDC | ' + sums.text.n + ' | ' + dash(sums.text.tokens_avg) + ' | ' + dash(sums.text.wall_avg) + ' | ' + dash(sums.text.accuracy) + ' (' + dash(sums.text.accuracy_pct) + '%) |',
    '| **image .cdc** | ' + sums.image.n + ' | ' + dash(sums.image.tokens_avg) + ' | ' + dash(sums.image.wall_avg) + ' | ' + dash(sums.image.accuracy) + ' (' + dash(sums.image.accuracy_pct) + '%) |',
    '',
    '### Overall ratios (avg tokens)',
    '| | |',
    '|--|--|',
    '| MCP / text | ' + (sums.mcp.tokens_avg && sums.text.tokens_avg ? (sums.mcp.tokens_avg / sums.text.tokens_avg).toFixed(2) : 'n/a') + ' |',
    '| MCP / image | ' + (sums.mcp.tokens_avg && sums.image.tokens_avg ? (sums.mcp.tokens_avg / sums.image.tokens_avg).toFixed(2) : 'n/a') + ' |',
    '| text / image | ' + (sums.text.tokens_avg && sums.image.tokens_avg ? (sums.text.tokens_avg / sums.image.tokens_avg).toFixed(2) : 'n/a') + ' |',
    '| image vs text savings | ' + (sums.text.tokens_avg && sums.image.tokens_avg ? ((1 - sums.image.tokens_avg / sums.text.tokens_avg) * 100).toFixed(1) + '%' : 'n/a') + ' |',
    '',
    '## Per-target',
    '',
    '| target | mcp tok | text tok | image tok | mcp score | text score | image score | img vs text % |',
    '|--------|---------|----------|-----------|-----------|------------|-------------|---------------|',
    ...rows.map((r) => {
      const m = r.arms.mcp, tx = r.arms.text, im = r.arms.image;
      return '| ' + r.target + ' | ' + dash(m && m.tokens) + ' | ' + dash(tx && tx.tokens) + ' | ' + dash(im && im.tokens) +
        ' | ' + dash(m && m.score) + ' | ' + dash(tx && tx.score) + ' | ' + dash(im && im.score) +
        ' | ' + (r.ratios.image_vs_text_pct != null ? r.ratios.image_vs_text_pct + '%' : '-') + ' |';
    }),
    '',
    '## Hard multi-system MCPs',
    '',
    '- **complex** (acme-ops ~47 tools) - P1 SLA breaches',
    '- **nova** (nova-fleet ~48 tools) - SEV1 SLO + MRR at risk',
    '',
    '## How to re-run',
    '',
    '```bash',
    'CODEX_MODEL=gpt-5.6-sol PHASE=all PARALLEL=2 node implementer/mega40/run-mega40.js',
    '# stepwise: setup | prebuild | mcp | text | image | score',
    '# subset: ONLY=nova,complex,calc PHASE=all',
    '```',
    '',
    '## Files',
    '- targets: `implementer/mega40/targets.json` (' + TARGETS.length + ')',
    '- scored: `implementer/mega40/results/scored.json`',
    '- nova server: `implementer/mega40/bin/nova-complex-mcp.js`',
    '',
  ].join('\n');

  write(path.join(RESULTS, 'results-mega40.md'), md);
  write(path.join(RESULTS, 'summary.json'), JSON.stringify({
    when: new Date().toISOString(), model: MODEL, sums, n: rows.length,
  }, null, 2));
  write(path.join(ROOT, 'results-mega40.md'), md);
  console.log('scored', rows.length, '->', path.join(RESULTS, 'scored.json'));
  console.log('report', path.join(RESULTS, 'results-mega40.md'));
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

function startServers() {
  const staticJs = [
    "const http=require('http');const fs=require('fs');const path=require('path');",
    "const root=" + JSON.stringify(FIX) + ";",
    "http.createServer((req,res)=>{",
    "  let p=decodeURIComponent((req.url||'/').split('?')[0]);",
    "  if(p==='/') p='/store.html';",
    "  const fp=path.join(root, p.replace(/^\\//,''));",
    "  if(!fp.startsWith(root) || !fs.existsSync(fp)) { res.writeHead(404); return res.end('nf'); }",
    "  const ext=path.extname(fp);",
    "  const ct=ext==='.html'?'text/html':ext==='.json'?'application/json':'text/plain';",
    "  res.writeHead(200,{'content-type':ct}); fs.createReadStream(fp).pipe(res);",
    "}).listen(8766,'127.0.0.1',()=>console.log('static :8766'));",
  ].join('\n');
  write(path.join(BIN, 'static-server.js'), staticJs);
  for (const name of ['http.pid', 'mock.pid']) {
    try {
      const pid = parseInt(fs.readFileSync(path.join(LOGS, name), 'utf8'), 10);
      if (pid) process.kill(pid, 'SIGTERM');
    } catch {}
  }
  const httpProc = spawn(process.execPath, [path.join(BIN, 'static-server.js')], { stdio: 'ignore', detached: true });
  fs.writeFileSync(path.join(LOGS, 'http.pid'), String(httpProc.pid));
  httpProc.unref();

  const mockApi = path.join(ROOT, 'server/mock-api.js');
  if (fs.existsSync(mockApi)) {
    const mockProc = spawn(process.execPath, [mockApi], {
      env: { ...process.env, PORT: '8791', N_PRODUCTS: '30', N_ORDERS: '200', N_USERS: '50' },
      stdio: 'ignore', detached: true,
    });
    fs.writeFileSync(path.join(LOGS, 'mock.pid'), String(mockProc.pid));
    mockProc.unref();
  }
  spawnSync('sleep', ['1']);
  try { fs.copyFileSync(path.join(FIX, 'shop.db'), '/tmp/mega20-shop.db'); } catch {}
  console.log('servers up :8766 :8791');
}

function stopServers() {
  for (const name of ['http.pid', 'mock.pid']) {
    try {
      const pid = parseInt(fs.readFileSync(path.join(LOGS, name), 'utf8'), 10);
      if (pid) process.kill(pid, 'SIGTERM');
    } catch {}
  }
}

async function main() {
  ensureDir(RESULTS);
  ensureDir(LOGS);
  ensureDir(SKILLS_TEXT);
  ensureDir(SKILLS_IMAGE);
  console.log('mega40 PHASE=', PHASE, 'MODEL=', MODEL, 'ARMS=', ARMS.join(','), 'targets=', TARGETS.length);

  if (PHASE === 'setup' || PHASE === 'all') setupHomes();
  if (['servers', 'all', 'mcp', 'text', 'image'].includes(PHASE)) startServers();
  if ((PHASE === 'prebuild' || PHASE === 'all') && process.env.SKIP_PREBUILD !== '1') prebuildAll();
  else if (PHASE === 'all' && process.env.SKIP_PREBUILD === '1') console.log('skip prebuild');

  const list = TARGETS.filter((t) => !ONLY || ONLY.includes(t.id));

  for (const arm of ARMS) {
    if (PHASE === arm || PHASE === 'all') {
      if (arm === 'mcp' && process.env.SKIP_MCP === '1') { console.log('skip mcp'); continue; }
      if (!['mcp', 'text', 'image'].includes(arm)) continue;
      await mapPool(list, PARALLEL, (t) => runArm(t, arm));
    }
  }

  if (PHASE === 'score' || PHASE === 'all') scoreAll();

  if (['all', 'mcp', 'text', 'image', 'servers'].includes(PHASE)) {
    if (PHASE === 'all' || process.env.STOP_SERVERS === '1') stopServers();
  }
  setTimeout(() => process.exit(0), 200).unref();
}

main().catch((e) => {
  console.error(e);
  stopServers();
  process.exit(1);
});

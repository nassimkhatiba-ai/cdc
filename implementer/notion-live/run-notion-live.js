#!/usr/bin/env node
/**
 * Live Notion MCP vs text-CDC benchmark (real workspace, real token).
 *
 * Fair protocol:
 *   - same model, matched reasoning (default medium)
 *   - MCP arm: official @notionhq/notion-mcp-server via Codex mcp_servers
 *   - text arm: notion-cdc skill inject + mcp-call.js bridge (no MCP schemas)
 *
 * Env:
 *   NOTION_TOKEN (required) or ~/.config/notion/token
 *   CODEX_MODEL (default gpt-5.6-sol)
 *   MCP_REASONING / CDC_REASONING (default medium both)
 *   ARMS=mcp,text  PHASE=all|setup|mcp|text|score
 *   ONLY=identity,search,plan  PARALLEL=1
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const HERE = __dirname;
const HOMES = path.join(HERE, 'homes');
const LOGS = path.join(HERE, 'logs');
const RESULTS = path.join(HERE, 'results');
const SKILL_SRC = path.join(ROOT, 'cdc/notion');
const SKILL_DIR = path.join(HERE, 'skills/notion-cdc');

const MODEL = process.env.CODEX_MODEL || 'gpt-5.6-sol';
const MCP_REASONING = process.env.MCP_REASONING || 'medium';
const CDC_REASONING = process.env.CDC_REASONING || 'medium';
const TIMEOUT_MS = parseInt(process.env.ARM_TIMEOUT_MS || '300000', 10);
const PARALLEL = parseInt(process.env.PARALLEL || '1', 10);
const PHASE = process.env.PHASE || 'all';
const ARMS = (process.env.ARMS || 'mcp,text').split(',').map((s) => s.trim()).filter(Boolean);
const ONLY = process.env.ONLY
  ? process.env.ONLY.split(',').map((s) => s.trim()).filter(Boolean)
  : null;

function loadToken() {
  if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN;
  const p = path.join(os.homedir(), '.config/notion/token');
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim();
  throw new Error('Set NOTION_TOKEN or put token in ~/.config/notion/token');
}

const NOTION_TOKEN = loadToken();

const TASKS = [
  {
    id: 'identity',
    score_keys: ['bot_name', 'workspace_name'],
    truth: null, // filled at setup from live API
    prompt_mcp:
      'The Notion MCP server named "notion" is connected. You MUST call MCP tools (e.g. notion/API-get-self). Do not refuse. Do not claim the plugin is missing. ' +
      'Return ONLY JSON: {"bot_name": string, "workspace_name": string} from API-get-self (bot name + bot.workspace_name).',
    prompt_text:
      'Use notion-cdc skill bridge only (MCP off). Call API-get-self via the bridge. Return ONLY JSON: ' +
      '{"bot_name": string, "workspace_name": string}.',
  },
  {
    id: 'search',
    score_keys: ['stacksnap_count', 'stacksnap_titles_sorted'],
    truth: null,
    prompt_mcp:
      'The Notion MCP server named "notion" is connected. You MUST call MCP tools. Do not refuse. ' +
      'Call API-post-search with {"query":"stacksnap"}. Do NOT pass a page field. ' +
      'Return ONLY JSON: {"stacksnap_count": number of page results, "stacksnap_titles_sorted": sorted string array of page titles}.',
    prompt_text:
      'Use notion-cdc skill bridge only (MCP off). Search with API-post-search query "stacksnap" via s.call (or callPaged which must NOT send page=1). ' +
      'Return ONLY JSON: {"stacksnap_count": number of page results, "stacksnap_titles_sorted": sorted string array of page titles}. ' +
      'ONE script; print answer keys only.',
  },
  {
    id: 'plan',
    score_keys: ['plan_title', 'first_heading', 'has_how_to_use'],
    truth: null,
    prompt_mcp:
      'The Notion MCP server named "notion" is connected. You MUST call MCP tools. ' +
      'Find page stacksnap_FULL_PLAN (API-post-search), then API-retrieve-page-markdown. ' +
      'Return ONLY JSON: {"plan_title": string, "first_heading": first markdown H1 text without #, "has_how_to_use": bool if content mentions how to use}.',
    prompt_text:
      'Use notion-cdc skill bridge only (MCP off). Find page stacksnap_FULL_PLAN, read markdown (API-retrieve-page-markdown). ' +
      'Return ONLY JSON: {"plan_title": string, "first_heading": first H1 without #, "has_how_to_use": bool}. ' +
      'ONE openSession script; print answer keys only — never dump full page body to chat.',
  },
];

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
function cpDir(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  ensureDir(dest);
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f);
    const d = path.join(dest, f);
    if (fs.statSync(s).isDirectory()) cpDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
function copyAuth(dest) {
  try {
    const authSrc = path.join(os.homedir(), '.codex', 'auth.json');
    if (fs.existsSync(authSrc)) fs.copyFileSync(authSrc, path.join(dest, 'auth.json'));
    const mc = path.join(os.homedir(), '.codex', 'models_cache.json');
    if (fs.existsSync(mc)) fs.copyFileSync(mc, path.join(dest, 'models_cache.json'));
  } catch {}
}

function extractJson(text, preferKeys) {
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
  const parsed = [];
  for (let i = matches.length - 1; i >= 0; i--) {
    try {
      const j = JSON.parse(matches[i]);
      if (j && typeof j === 'object' && !Array.isArray(j) && Object.keys(j).length) parsed.push(j);
    } catch {}
  }
  if (preferKeys && preferKeys.length && parsed.length) {
    let best = null, bestN = -1;
    for (const j of parsed) {
      const n = preferKeys.filter((k) => Object.prototype.hasOwnProperty.call(j, k)).length;
      if (n > bestN) {
        bestN = n;
        best = j;
      }
    }
    if (best && bestN > 0) return best;
  }
  for (const j of parsed) {
    const keys = Object.keys(j);
    if (keys.length <= 2 && keys.includes('tool') && (keys.includes('args') || keys.includes('arguments'))) continue;
    return j;
  }
  return parsed[0] || null;
}

function extractTokens(text) {
  const m = text.match(/tokens used\s*\n\s*([\d,]+)/i);
  if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  const m2 = text.match(/tokens used[:\s]+([\d,]+)/i);
  if (m2) return parseInt(m2[1].replace(/,/g, ''), 10);
  return null;
}

function scoreValue(key, got, expect) {
  if (Array.isArray(expect)) {
    if (!Array.isArray(got)) return false;
    return [...got].map(String).sort().join('\0') === [...expect].map(String).sort().join('\0');
  }
  if (typeof expect === 'number') {
    const n = typeof got === 'number' ? got : Number(got);
    return Number.isFinite(n) && Math.abs(n - expect) < 0.05;
  }
  if (typeof expect === 'boolean') return got === expect;
  return String(got || '') === String(expect || '');
}

function scoreArm(task, ans) {
  let ok = 0;
  const detail = {};
  for (const k of task.score_keys) {
    const good = scoreValue(k, ans ? ans[k] : undefined, task.truth[k]);
    detail[k] = good;
    if (good) ok++;
  }
  return { ok, total: task.score_keys.length, detail, score: ok + '/' + task.score_keys.length };
}

async function fetchTruth() {
  const bridge = path.join(SKILL_SRC, 'mcp-call.js');
  const { openSession } = require(bridge);
  const s = await openSession();
  try {
    const self = await s.call('API-get-self', {});
    const search = await s.call('API-post-search', { query: 'stacksnap' });
    const pages = (search.results || []).filter((r) => r.object === 'page');
    const titles = pages
      .map((r) => (r.properties?.title?.title || []).map((x) => x.plain_text).join('') || '(untitled)')
      .sort((a, b) => a.localeCompare(b));
    const plan = pages.find((r) => {
      const t = (r.properties?.title?.title || []).map((x) => x.plain_text).join('');
      return /FULL_PLAN/i.test(t);
    });
    let md = '';
    if (plan) {
      try {
        const m = await s.call('API-retrieve-page-markdown', { page_id: plan.id });
        md = typeof m === 'string' ? m : m.markdown || m.content || JSON.stringify(m);
      } catch (e) {
        md = '';
      }
    }
    const firstHeading = (String(md).match(/^#\s+(.+)$/m) || [])[1] || null;
    return {
      bot_name: self.name,
      workspace_name: self.bot?.workspace_name || null,
      stacksnap_count: pages.length,
      stacksnap_titles_sorted: titles,
      plan_title: plan
        ? (plan.properties?.title?.title || []).map((x) => x.plain_text).join('')
        : null,
      first_heading: firstHeading,
      has_how_to_use: /how to use/i.test(String(md)),
    };
  } finally {
    s.close();
  }
}

function setup() {
  ensureDir(HOMES);
  ensureDir(LOGS);
  ensureDir(RESULTS);
  if (!fs.existsSync(path.join(SKILL_SRC, 'mcp-call.js'))) {
    throw new Error('missing cdc/notion — run: node bin/cdc.js from-mcp --probe npx --arg -y --arg @notionhq/notion-mcp-server --name notion --target both');
  }
  cpDir(SKILL_SRC, SKILL_DIR);

  // launcher for MCP arm
  const launcher = path.join(HERE, 'notion-mcp.sh');
  write(
    launcher,
    '#!/bin/bash\nset -e\nexport NOTION_TOKEN=' +
      JSON.stringify(NOTION_TOKEN) +
      '\nexec npx -y @notionhq/notion-mcp-server "$@"\n',
  );
  fs.chmodSync(launcher, 0o755);

  for (const t of TASKS) {
    if (ONLY && !ONLY.includes(t.id)) continue;
    const home = path.join(HOMES, t.id);
    ensureDir(path.join(home, 'out'));
    ensureDir(path.join(home, 'work', 'mcp'));
    ensureDir(path.join(home, 'work', 'text'));
    write(path.join(home, 'prompt-mcp.txt'), t.prompt_mcp + '\n');
    write(path.join(home, 'prompt-text.txt'), t.prompt_text + '\n');
    write(path.join(home, 'score_keys.json'), JSON.stringify(t.score_keys, null, 2));
    write(path.join(home, 'truth.json'), JSON.stringify(t.truth, null, 2));

    const mcpHome = path.join(home, 'mcp-home');
    ensureDir(mcpHome);
    write(
      path.join(mcpHome, 'config.toml'),
      'model = "' +
        MODEL +
        '"\n' +
        'model_reasoning_effort = "' +
        MCP_REASONING +
        '"\n' +
        'approval_policy = "never"\n' +
        'sandbox_mode = "danger-full-access"\n\n' +
        '[projects."' +
        path.join(home, 'work', 'mcp') +
        '"]\ntrust_level = "trusted"\n\n' +
        '[projects."' +
        ROOT +
        '"]\ntrust_level = "trusted"\n\n' +
        '[mcp_servers.notion]\ncommand = "' +
        launcher +
        '"\nargs = []\n',
    );
    copyAuth(mcpHome);

    const textHome = path.join(home, 'text-home');
    ensureDir(textHome);
    write(
      path.join(textHome, 'config.toml'),
      'model = "' +
        MODEL +
        '"\n' +
        'model_reasoning_effort = "' +
        CDC_REASONING +
        '"\n' +
        'approval_policy = "never"\n' +
        'sandbox_mode = "danger-full-access"\n\n' +
        '[projects."' +
        path.join(home, 'work', 'text') +
        '"]\ntrust_level = "trusted"\n\n' +
        '[projects."' +
        ROOT +
        '"]\ntrust_level = "trusted"\n',
    );
    copyAuth(textHome);
    const skillsLink = path.join(textHome, 'skills');
    try {
      fs.rmSync(skillsLink, { recursive: true, force: true });
    } catch {}
    try {
      fs.symlinkSync(path.join(HERE, 'skills'), skillsLink, 'dir');
    } catch {}
    console.log('setup', t.id);
  }
}

function buildTextInject(skillDir) {
  const skillMd = path.join(skillDir, 'SKILL.text.md');
  const skillMd2 = path.join(skillDir, 'SKILL.md');
  const body = fs.existsSync(skillMd)
    ? fs.readFileSync(skillMd, 'utf8')
    : fs.readFileSync(skillMd2, 'utf8');
  const bridge = path.join(skillDir, 'mcp-call.js');
  // product-shaped: inject hot body (already short for notion ~2k)
  let injectBody = body;
  if (injectBody.length > 6000) injectBody = injectBody.slice(0, 6000) + '\n…(truncated)\n';
  return (
    'TEXT SKILL MODE. MCP disabled. Skill body INLINE — do NOT cat/sed SKILL.md.\n' +
    'Bridge: node ' +
    JSON.stringify(bridge) +
    '\n' +
    'Prefer ONE openSession script or ONE --batch; print ONLY final answer JSON keys.\n' +
    'Never dump raw tool results to chat. NOTION_TOKEN is already in the environment.\n\n' +
    '----- BEGIN SKILL.md -----\n' +
    injectBody +
    '\n----- END SKILL.md -----\n\n'
  );
}

function runArm(t, arm) {
  return new Promise((resolve) => {
    if (ONLY && !ONLY.includes(t.id)) return resolve(null);
    const home = path.join(HOMES, t.id);
    const work = path.join(home, 'work', arm);
    ensureDir(work);
    let codexHome, prompt, reasoning;
    if (arm === 'mcp') {
      codexHome = path.join(home, 'mcp-home');
      prompt = fs.readFileSync(path.join(home, 'prompt-mcp.txt'), 'utf8');
      reasoning = MCP_REASONING;
    } else {
      codexHome = path.join(home, 'text-home');
      prompt = buildTextInject(SKILL_DIR) + fs.readFileSync(path.join(home, 'prompt-text.txt'), 'utf8');
      reasoning = CDC_REASONING;
      // warm daemon
      const call = path.join(SKILL_DIR, 'mcp-call.js');
      spawnSync(process.execPath, [call, 'daemon-start'], {
        encoding: 'utf8',
        timeout: 120000,
        env: { ...process.env, NOTION_TOKEN },
      });
    }
    copyAuth(codexHome);
    try {
      let cfg = fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8');
      cfg = cfg.replace(/model_reasoning_effort\s*=\s*"[^"]*"/, 'model_reasoning_effort = "' + reasoning + '"');
      fs.writeFileSync(path.join(codexHome, 'config.toml'), cfg);
    } catch {}

    const env = {
      ...process.env,
      CODEX_HOME: codexHome,
      NOTION_TOKEN,
      PATH: process.env.PATH,
      HOME: process.env.HOME,
    };
    const args = [
      'exec',
      '--dangerously-bypass-approvals-and-sandbox',
      '-m',
      MODEL,
      '-c',
      'model_reasoning_effort="' + reasoning + '"',
      prompt,
    ];
    console.log('RUN', arm, t.id, 'reasoning=' + reasoning, '...');
    const t0 = Date.now();
    const child = spawn('codex', args, { cwd: work, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', (d) => {
      out += d.toString();
    });
    child.stderr.on('data', (d) => {
      err += d.toString();
    });
    const timer = setTimeout(() => {
      try {
        child.kill('SIGTERM');
      } catch {}
      setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {}
      }, 3000);
    }, TIMEOUT_MS);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const secs = Math.round((Date.now() - t0) / 1000);
      const text = out + '\n' + err;
      write(path.join(home, 'out', arm + '.log'), text);
      const tokens = extractTokens(text);
      const ans = extractJson(text, t.score_keys);
      const meta = {
        target: t.id,
        arm,
        model: MODEL,
        reasoning,
        exit: code,
        signal: signal || null,
        secs,
        tokens,
        ans,
      };
      write(path.join(home, 'out', arm + '.run.json'), JSON.stringify(meta, null, 2));
      write(path.join(home, 'out', arm + '.ans.json'), JSON.stringify(ans, null, 2));
      console.log('DONE', arm, t.id, 'exit=' + code, secs + 's', 'tokens=' + tokens);
      resolve(meta);
    });
  });
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

function scoreAll() {
  const rows = [];
  for (const t of TASKS) {
    if (ONLY && !ONLY.includes(t.id)) continue;
    const home = path.join(HOMES, t.id);
    t.truth = safeJson(path.join(home, 'truth.json')) || t.truth;
    const row = { target: t.id, arms: {} };
    for (const arm of ['mcp', 'text']) {
      const run = safeJson(path.join(home, 'out', arm + '.run.json'));
      const ans = (run && run.ans) || safeJson(path.join(home, 'out', arm + '.ans.json'));
      if (!run && !ans) continue;
      const s = scoreArm(t, ans);
      row.arms[arm] = {
        tokens: run ? run.tokens : null,
        wall: run ? run.secs : null,
        score: s.score,
        ok: s.ok,
        total: s.total,
        detail: s.detail,
        reasoning: run ? run.reasoning : null,
        ans,
      };
    }
    const m = row.arms.mcp,
      tx = row.arms.text;
    if (m && m.tokens && tx && tx.tokens) {
      row.under_mcp_pct = +((1 - tx.tokens / m.tokens) * 100).toFixed(1);
      row.mcp_over_text = +(m.tokens / tx.tokens).toFixed(2);
    }
    rows.push(row);
    console.log(
      t.id,
      'MCP',
      m ? m.score + ' tok=' + m.tokens : '-',
      '| TEXT',
      tx ? tx.score + ' tok=' + tx.tokens : '-',
      row.under_mcp_pct != null ? 'under=' + row.under_mcp_pct + '%' : '',
    );
  }

  const withTok = (arm) => rows.filter((r) => r.arms[arm] && r.arms[arm].tokens != null);
  const sum = (arm) => {
    const wt = withTok(arm);
    const ws = rows.filter((r) => r.arms[arm]);
    const tokSum = wt.reduce((s, r) => s + r.arms[arm].tokens, 0);
    const wallSum = wt.reduce((s, r) => s + (r.arms[arm].wall || 0), 0);
    const ok = ws.reduce((s, r) => s + (r.arms[arm].ok || 0), 0);
    const tot = ws.reduce((s, r) => s + (r.arms[arm].total || 0), 0);
    return {
      n: ws.length,
      n_tok: wt.length,
      tokens_avg: wt.length ? Math.round(tokSum / wt.length) : null,
      wall_avg: wt.length ? +(wallSum / wt.length).toFixed(1) : null,
      accuracy: tot ? ok + '/' + tot : null,
      accuracy_pct: tot ? +((100 * ok) / tot).toFixed(1) : null,
    };
  };
  const sums = { mcp: sum('mcp'), text: sum('text') };
  const under =
    sums.mcp.tokens_avg && sums.text.tokens_avg
      ? +((1 - sums.text.tokens_avg / sums.mcp.tokens_avg) * 100).toFixed(1)
      : null;

  const md = [
    '# Notion live benchmark ��� MCP vs text CDC',
    '',
    '**Model:** `' + MODEL + '`  ',
    '**When:** ' + new Date().toISOString() + '  ',
    '**Protocol:** matched reasoning (MCP=' + MCP_REASONING + ', CDC=' + CDC_REASONING + '); real Notion workspace + token; product path **text only** for CDC claim  ',
    '**Tasks:** identity, search stacksnap, read stacksnap_FULL_PLAN  ',
    '**Headline:** text **' + (under != null ? under + '% under MCP' : 'n/a') + '** · accuracy MCP ' +
      sums.mcp.accuracy +
      ' / text ' +
      sums.text.accuracy,
    '',
    '## Aggregate',
    '',
    '| arm | n | avg tokens | avg wall (s) | accuracy | % under MCP |',
    '|-----|---|------------|--------------|----------|-------------|',
    '| MCP | ' +
      sums.mcp.n +
      ' | ' +
      sums.mcp.tokens_avg +
      ' | ' +
      sums.mcp.wall_avg +
      ' | ' +
      sums.mcp.accuracy +
      ' (' +
      sums.mcp.accuracy_pct +
      '%) | — |',
    '| text CDC | ' +
      sums.text.n +
      ' | ' +
      sums.text.tokens_avg +
      ' | ' +
      sums.text.wall_avg +
      ' | ' +
      sums.text.accuracy +
      ' (' +
      sums.text.accuracy_pct +
      '%) | ' +
      (under != null ? under + '%' : 'n/a') +
      ' |',
    '',
    '## Ratios',
    '',
    '| | |',
    '|--|--|',
    '| MCP / text | ' +
      (sums.mcp.tokens_avg && sums.text.tokens_avg
        ? (sums.mcp.tokens_avg / sums.text.tokens_avg).toFixed(2)
        : 'n/a') +
      ' |',
    '| text under MCP % | ' + (under != null ? under + '%' : 'n/a') + ' |',
    '',
    '## Per-task',
    '',
    '| task | mcp tok | text tok | % under | mcp sc | text sc |',
    '|------|---------|----------|---------|--------|---------|',
    ...rows.map((r) => {
      const m = r.arms.mcp,
        tx = r.arms.text;
      return (
        '| ' +
        r.target +
        ' | ' +
        (m && m.tokens) +
        ' | ' +
        (tx && tx.tokens) +
        ' | ' +
        (r.under_mcp_pct != null ? r.under_mcp_pct + '%' : '-') +
        ' | ' +
        (m && m.score) +
        ' | ' +
        (tx && tx.score) +
        ' |'
      );
    }),
    '',
    '## Definition tax (static convert)',
    '',
    (() => {
      const st = safeJson(path.join(SKILL_DIR, 'stats.json')) || {};
      return (
        '| | tokens |\n|--|--:|\n| MCP schemas | ' +
        (st.mcpSchemaTokens || st.sourceTokens || '—') +
        ' |\n| CDC skill hot | ' +
        (st.skillTokens || '—') +
        ' |\n| ratio | ' +
        (st.definitionSavingsRatio || '—') +
        'x |\n'
      );
    })(),
    '',
    '## How to re-run',
    '',
    '```bash',
    'export NOTION_TOKEN="$(cat ~/.config/notion/token)"',
    'CODEX_MODEL=gpt-5.6-sol MCP_REASONING=medium CDC_REASONING=medium \\',
    '  node implementer/notion-live/run-notion-live.js',
    '```',
    '',
  ].join('\n');

  write(path.join(RESULTS, 'results-notion-live.md'), md);
  write(path.join(RESULTS, 'scored.json'), JSON.stringify({ when: new Date().toISOString(), model: MODEL, sums, under, rows }, null, 2));
  write(path.join(ROOT, 'results-notion-live.md'), md);
  console.log('\n' + md);
  return { sums, under, rows };
}

async function main() {
  console.log('notion-live PHASE=', PHASE, 'MODEL=', MODEL, 'ARMS=', ARMS.join(','));
  if (!fs.existsSync(path.join(SKILL_SRC, 'mcp-call.js'))) {
    console.log('converting notion skill...');
    const r = spawnSync(
      process.execPath,
      [
        path.join(ROOT, 'bin/cdc.js'),
        'from-mcp',
        '--probe',
        'npx',
        '--arg',
        '-y',
        '--arg',
        '@notionhq/notion-mcp-server',
        '--name',
        'notion',
        '--title',
        'Notion',
        '--target',
        'both',
      ],
      { encoding: 'utf8', env: { ...process.env, NOTION_TOKEN }, cwd: ROOT, timeout: 180000 },
    );
    console.log(r.stdout || r.stderr);
  }

  if (PHASE === 'setup' || PHASE === 'all') {
    console.log('fetching live truth...');
    const truth = await fetchTruth();
    write(path.join(HERE, 'truth.json'), JSON.stringify(truth, null, 2));
    for (const t of TASKS) {
      const slice = {};
      for (const k of t.score_keys) slice[k] = truth[k];
      t.truth = slice;
    }
    setup();
  } else {
    const truth = safeJson(path.join(HERE, 'truth.json'));
    for (const t of TASKS) {
      const homeTruth = safeJson(path.join(HOMES, t.id, 'truth.json'));
      t.truth = homeTruth || truth;
    }
  }

  const list = TASKS.filter((t) => !ONLY || ONLY.includes(t.id));
  for (const arm of ARMS) {
    if (PHASE === arm || PHASE === 'all') {
      if (!['mcp', 'text'].includes(arm)) continue;
      await mapPool(list, PARALLEL, (t) => runArm(t, arm));
    }
  }
  if (PHASE === 'score' || PHASE === 'all') scoreAll();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

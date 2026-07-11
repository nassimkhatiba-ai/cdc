#!/usr/bin/env node
/**
 * Image-skill concept benchmarks (Codex).
 *
 * Arms:
 *   mcp   — complex MCP server (47 tools)
 *   text  — complex-cdc text skill (SKILL.md + CDC.md)
 *   image — complex-cdc as .cdc PNG attached via `codex exec -i` (no text body)
 *
 * Extra microbench (PHASE=load):
 *   load-text  — cat fat SOURCE as text
 *   load-image — attach fat image pages only
 *
 * NOTE: when using -i, prompt must be passed via stdin with trailing `-`
 * (Codex treats all free args after -i as image paths).
 *
 * Env: CODEX_MODEL, ARM_TIMEOUT_MS, PHASE, SKIP_MCP
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { packSkill } = require('./pack');

const ROOT = path.resolve(__dirname, '../..');
const CONCEPT = path.resolve(__dirname);
const CX = path.join(ROOT, 'implementer/complex');
const SERVER = path.join(CX, 'bin/complex-mcp.js');
const TEXT_SKILL = path.join(CX, 'skills/complex-cdc');
const PACKAGES = path.join(CONCEPT, 'packages');
const BENCH = path.join(CONCEPT, 'bench');
const RESULTS = path.join(CONCEPT, 'results');
const LOGS = path.join(CONCEPT, 'logs');
const MODEL = process.env.CODEX_MODEL || 'gpt-5.6-sol';
const TIMEOUT_MS = parseInt(process.env.ARM_TIMEOUT_MS || '600000', 10);
const PHASE = process.env.PHASE || 'all';
const SKILL_NAME = 'complex-cdc';

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

function loadTruth() {
  const r = spawnSync(process.execPath, [SERVER, '--truth'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('truth: ' + (r.stderr || r.stdout));
  return JSON.parse(r.stdout);
}

function copyAuth(dest) {
  try {
    const authSrc = path.join(process.env.HOME || '', '.codex', 'auth.json');
    if (fs.existsSync(authSrc)) fs.copyFileSync(authSrc, path.join(dest, 'auth.json'));
    const mc = path.join(process.env.HOME || '', '.codex', 'models_cache.json');
    if (fs.existsSync(mc)) fs.copyFileSync(mc, path.join(dest, 'models_cache.json'));
  } catch {}
}

function hardTaskRules() {
  return `HARD TASK — SLA breaches for open P1 tickets.

Rules:
1. get_reference_now for the clock (not wall clock).
2. Page ALL open P1 tickets (list_open_p1_tickets / list_tickets; respect has_more).
3. Join ticket → account → tier ��� SLA. Starter = no SLA. Enterprise 30m, Growth 120m.
4. Prefer evaluate_ticket_sla. Join related open eng issues by component_id only.
5. Avoid suggest_related_issues_by_subject (trap).
6. arr_at_risk = sum of UNIQUE account ARR among breach accounts.

Return ONE JSON object only with keys:
open_p1_count, breach_count, arr_at_risk, top_account_at_risk, top_account_arr,
breach_subjects_sorted, accounts_in_breach_sorted`;
}

function promptMcp() {
  return `You are connected to the acme-ops-complex MCP server (CRM/Support/Eng/SLA, many tools).
Use ONLY MCP tools. Do not invent data.

${hardTaskRules()}
`;
}

function promptText() {
  return `Use the ${SKILL_NAME} skill (text CDC). MCP is disabled.
Call tools via skill bridge only (node mcp-call.js / openSession / callPaged / --batch).

${hardTaskRules()}
`;
}

function promptImage(bridgePath, imageNames) {
  return `IMAGE SKILL MODE. MCP is disabled. There is NO text skill body.

The full skill documentation is in the ATTACHED IMAGE(s): ${imageNames.join(', ')}.
Read the image(s) carefully for tool names, call style, and rules.

Bridge (only way to call tools):
  node ${JSON.stringify(bridgePath)} --batch '[{"tool":"...","args":{}}]'
  or openSession/callPaged from that mcp-call.js

Do not cat SOURCE.md. Do not re-enable MCP.

${hardTaskRules()}
`;
}

function promptLoadText(sourcePath) {
  return `Read the text file at:
${sourcePath}

It is a CDC skill document. Answer with ONE JSON object only:
{
  "tool_count_estimate": <number of distinct tool names you see>,
  "has_evaluate_ticket_sla": <true|false>,
  "has_list_open_p1_tickets": <true|false>,
  "first_five_tools": ["...","..."] ,
  "bridge_mentions_batch": <true|false>
}
Do not call any MCP or network. Text file only.
`;
}

function promptLoadImage() {
  return `The attached image(s) are a CDC skill document rendered as an image (entire skill body).

Answer with ONE JSON object only:
{
  "tool_count_estimate": <number of distinct tool names you see>,
  "has_evaluate_ticket_sla": <true|false>,
  "has_list_open_p1_tickets": <true|false>,
  "first_five_tools": ["...","..."],
  "bridge_mentions_batch": <true|false>
}
Do not cat SOURCE.md. Use the image only.
`;
}

function setupHomes() {
  const truth = loadTruth();
  write(path.join(BENCH, 'truth.json'), JSON.stringify(truth, null, 2));

  const launcher = path.join(BENCH, 'complex-mcp.sh');
  write(
    launcher,
    `#!/bin/bash
set -e
export COMPLEX_PAGE_SIZE="\${COMPLEX_PAGE_SIZE:-8}"
export COMPLEX_SEED="\${COMPLEX_SEED:-42}"
exec ${JSON.stringify(process.execPath)} ${JSON.stringify(SERVER)} "$@"
`,
  );
  fs.chmodSync(launcher, 0o755);

  const mcpHome = path.join(BENCH, 'homes', 'mcp');
  ensureDir(mcpHome);
  ensureDir(path.join(BENCH, 'work-mcp'));
  write(
    path.join(mcpHome, 'config.toml'),
    `model = "${MODEL}"
model_reasoning_effort = "medium"
approval_policy = "never"
sandbox_mode = "danger-full-access"

[projects."${path.join(BENCH, 'work-mcp')}"]
trust_level = "trusted"

[projects."${ROOT}"]
trust_level = "trusted"

[mcp_servers.acme_ops_complex]
command = "${launcher}"
args = []
`,
  );
  copyAuth(mcpHome);

  const textHome = path.join(BENCH, 'homes', 'text');
  ensureDir(textHome);
  ensureDir(path.join(BENCH, 'work-text'));
  write(
    path.join(textHome, 'config.toml'),
    `model = "${MODEL}"
model_reasoning_effort = "medium"
approval_policy = "never"
sandbox_mode = "danger-full-access"

[projects."${path.join(BENCH, 'work-text')}"]
trust_level = "trusted"

[projects."${ROOT}"]
trust_level = "trusted"
`,
  );
  copyAuth(textHome);
  const textSkills = path.join(textHome, 'skills');
  try {
    fs.rmSync(textSkills, { recursive: true, force: true });
  } catch {}
  ensureDir(path.join(BENCH, 'skills-text'));
  const textSkillDest = path.join(BENCH, 'skills-text', SKILL_NAME);
  try {
    fs.rmSync(textSkillDest, { recursive: true, force: true });
  } catch {}
  fs.cpSync(TEXT_SKILL, textSkillDest, { recursive: true });
  try {
    fs.symlinkSync(path.join(BENCH, 'skills-text'), textSkills, 'dir');
  } catch {
    fs.cpSync(path.join(BENCH, 'skills-text'), textSkills, { recursive: true });
  }

  const imageHome = path.join(BENCH, 'homes', 'image');
  ensureDir(imageHome);
  ensureDir(path.join(BENCH, 'work-image'));
  write(
    path.join(imageHome, 'config.toml'),
    `model = "${MODEL}"
model_reasoning_effort = "medium"
approval_policy = "never"
sandbox_mode = "danger-full-access"

[projects."${path.join(BENCH, 'work-image')}"]
trust_level = "trusted"

[projects."${ROOT}"]
trust_level = "trusted"
`,
  );
  copyAuth(imageHome);
  const imageSkills = path.join(imageHome, 'skills');
  try {
    fs.rmSync(imageSkills, { recursive: true, force: true });
  } catch {}
  ensureDir(imageSkills);

  for (const arm of ['load-text', 'load-image']) {
    const h = path.join(BENCH, 'homes', arm);
    ensureDir(h);
    ensureDir(path.join(BENCH, `work-${arm}`));
    write(
      path.join(h, 'config.toml'),
      `model = "${MODEL}"
model_reasoning_effort = "medium"
approval_policy = "never"
sandbox_mode = "danger-full-access"

[projects."${path.join(BENCH, `work-${arm}`)}"]
trust_level = "trusted"

[projects."${ROOT}"]
trust_level = "trusted"
`,
    );
    copyAuth(h);
  }

  write(path.join(BENCH, 'prompt-mcp.txt'), promptMcp());
  write(path.join(BENCH, 'prompt-text.txt'), promptText());
  console.log('setup ok', { tools: truth.tool_count, breaches: truth.breach_count, model: MODEL });
  return truth;
}

function pack() {
  if (!fs.existsSync(path.join(TEXT_SKILL, 'SKILL.md'))) {
    throw new Error('missing text skill at ' + TEXT_SKILL);
  }
  const report = packSkill({
    skillDir: TEXT_SKILL,
    outDir: PACKAGES,
    name: SKILL_NAME,
    scale: 2,
    maxCols: 100,
    maxPageHeight: 3600,
  });
  write(path.join(BENCH, 'pack-report.json'), JSON.stringify(report, null, 2));

  const source = path.join(PACKAGES, SKILL_NAME, 'SOURCE.md');
  let fat = fs.readFileSync(source, 'utf8');
  const padBlock = Array.from({ length: 80 }, (_, i) =>
    `tool_noise_${String(i).padStart(3, '0')}(account_id:string, page:integer, per_page:integer, region?:string, tier?:Enterprise|Growth|Starter, include_closed?:boolean, sort?:asc|desc) -> {data:[...], page, total, has_more} // verbose multi-system join helper intentionally long description for definition tax simulation ${'x'.repeat(40)}`,
  ).join('\n');
  fat = fat + '\n\n===== DENSE SCHEMA PAD (definition tax sim) =====\n' + padBlock;
  write(path.join(BENCH, 'fat-SOURCE.md'), fat);

  const { writeCdc } = require('./render');
  const fatCdc = writeCdc(path.join(BENCH, 'fat-skill.cdc'), fat, {
    scale: 2,
    maxCols: 100,
    maxPageHeight: 3600,
  });
  write(path.join(BENCH, 'fat-pack.json'), JSON.stringify(fatCdc.meta, null, 2));

  console.log('pack ok', {
    pages: report.pages,
    chars: report.charCount,
    textTok: report.approxTextTokens,
    visionTok: report.approxVisionTokens,
    fatChars: fat.length,
    fatTextTok: Math.ceil(fat.length / 4),
    fatVision: fatCdc.meta.approxVisionTokens,
    fatPages: fatCdc.meta.pages,
  });
  return report;
}

function extractJson(text) {
  const matches = [];
  let depth = 0;
  let start = -1;
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
    try {
      return JSON.parse(matches[i]);
    } catch {}
  }
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (m) {
    try {
      return JSON.parse(m[1].trim());
    } catch {}
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
    mcp_tool_calls: (t.match(/mcp:\s+\w+/g) || []).length,
    openSession: (t.match(/openSession/g) || []).length,
    callPaged: (t.match(/callPaged/g) || []).length,
    mcp_call_js: (t.match(/mcp-call\.js/g) || []).length,
    batch: (t.match(/--batch/g) || []).length,
    image_attach: (t.match(/attached image|IMAGE SKILL|\.cdc\.png/gi) || []).length,
    read_source: (t.match(/SOURCE\.md/g) || []).length,
  };
}

function runCodex({ arm, codexHome, work, prompt, images = [] }) {
  return new Promise((resolve) => {
    ensureDir(work);
    ensureDir(path.join(BENCH, 'out'));
    copyAuth(codexHome);

    const env = {
      ...process.env,
      CODEX_HOME: codexHome,
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      COMPLEX_PAGE_SIZE: '8',
      COMPLEX_SEED: '42',
    };

    if (arm === 'text' || arm === 'image') {
      const bridge =
        arm === 'text'
          ? path.join(BENCH, 'skills-text', SKILL_NAME, 'mcp-call.js')
          : path.join(work, 'mcp-call.js');
      if (fs.existsSync(bridge)) {
        spawnSync(process.execPath, [bridge, 'daemon-start'], {
          encoding: 'utf8',
          timeout: 120000,
        });
      }
    }

    const args = [
      'exec',
      '--dangerously-bypass-approvals-and-sandbox',
      '-m',
      MODEL,
      '-c',
      'model_reasoning_effort="medium"',
    ];
    for (const img of images) {
      args.push('-i', img);
    }
    // When images present: prompt via stdin + trailing `-`
    // (free args after -i are treated as more image paths)
    const useStdin = images.length > 0;
    if (useStdin) {
      args.push('-');
    } else {
      args.push(prompt);
    }

    console.log(`RUN ${arm} model=${MODEL} images=${images.length} stdin=${useStdin} ...`);
    const t0 = Date.now();
    const child = spawn('codex', args, {
      cwd: work,
      env,
      stdio: [useStdin ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    });
    if (useStdin) {
      child.stdin.write(prompt);
      child.stdin.end();
    }

    let out = '';
    let err = '';
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
      write(path.join(BENCH, 'out', `${arm}.log`), text);
      const tokens = extractTokens(text);
      const ans = extractJson(text);
      const meta = {
        arm,
        model: MODEL,
        exit: code,
        secs,
        tokens,
        signal: signal || null,
        images: images.map((p) => path.basename(p)),
        purity: purity(text),
        ans,
      };
      write(path.join(BENCH, 'out', `${arm}.run.json`), JSON.stringify(meta, null, 2));
      write(path.join(BENCH, 'out', `${arm}.ans.json`), JSON.stringify(ans, null, 2));
      console.log(`DONE ${arm} exit=${code} ${secs}s tokens=${tokens}`);
      resolve(meta);
    });
  });
}

async function runMcp() {
  return runCodex({
    arm: 'mcp',
    codexHome: path.join(BENCH, 'homes', 'mcp'),
    work: path.join(BENCH, 'work-mcp'),
    prompt: fs.readFileSync(path.join(BENCH, 'prompt-mcp.txt'), 'utf8'),
  });
}

async function runText() {
  return runCodex({
    arm: 'text',
    codexHome: path.join(BENCH, 'homes', 'text'),
    work: path.join(BENCH, 'work-text'),
    prompt: fs.readFileSync(path.join(BENCH, 'prompt-text.txt'), 'utf8'),
  });
}

async function runImage() {
  const packMeta = safeJson(path.join(PACKAGES, SKILL_NAME, 'meta.json'));
  if (!packMeta) throw new Error('pack first');
  const pngs = (packMeta.pageFiles || []).filter((p) => fs.existsSync(p));
  if (!pngs.length) {
    const one = path.join(PACKAGES, SKILL_NAME, `${SKILL_NAME}.cdc.png`);
    if (fs.existsSync(one)) pngs.push(one);
  }
  if (!pngs.length) throw new Error('no image pages found');

  const bridge = path.join(PACKAGES, SKILL_NAME, 'mcp-call.js');
  const work = path.join(BENCH, 'work-image');
  ensureDir(work);
  fs.copyFileSync(bridge, path.join(work, 'mcp-call.js'));
  if (fs.existsSync(path.join(PACKAGES, SKILL_NAME, 'mcp-manifest.json'))) {
    fs.copyFileSync(
      path.join(PACKAGES, SKILL_NAME, 'mcp-manifest.json'),
      path.join(work, 'mcp-manifest.json'),
    );
  }
  const prompt = promptImage(path.join(work, 'mcp-call.js'), pngs.map((p) => path.basename(p)));
  write(path.join(BENCH, 'prompt-image.txt'), prompt);
  return runCodex({
    arm: 'image',
    codexHome: path.join(BENCH, 'homes', 'image'),
    work,
    prompt,
    images: pngs,
  });
}

async function runLoad() {
  const fatSource = path.join(BENCH, 'fat-SOURCE.md');
  const fatMeta = safeJson(path.join(BENCH, 'fat-pack.json'));
  if (!fs.existsSync(fatSource) || !fatMeta) throw new Error('pack first for load bench');

  const loadText = await runCodex({
    arm: 'load-text',
    codexHome: path.join(BENCH, 'homes', 'load-text'),
    work: path.join(BENCH, 'work-load-text'),
    prompt: promptLoadText(fatSource),
  });

  const pngs = (fatMeta.pageFiles || []).filter((p) => fs.existsSync(p));
  const loadImage = await runCodex({
    arm: 'load-image',
    codexHome: path.join(BENCH, 'homes', 'load-image'),
    work: path.join(BENCH, 'work-load-image'),
    prompt: promptLoadImage(),
    images: pngs,
  });
  return { loadText, loadImage };
}

function scoreValue(key, got, expect) {
  if (Array.isArray(expect)) {
    if (!Array.isArray(got)) return false;
    return (
      [...got].map(String).sort().join('\0') === [...expect].map(String).sort().join('\0')
    );
  }
  if (typeof expect === 'number') {
    const n = typeof got === 'number' ? got : Number(got);
    if (!Number.isFinite(n)) return false;
    return Math.abs(n - expect) < 0.5 || Math.abs(n - expect) / (Math.abs(expect) || 1) < 0.001;
  }
  return got === expect;
}

function scoreTask(truth, ans) {
  const keys = [
    'open_p1_count',
    'breach_count',
    'arr_at_risk',
    'top_account_at_risk',
    'top_account_arr',
    'breach_subjects_sorted',
    'accounts_in_breach_sorted',
  ];
  const detail = {};
  let ok = 0;
  for (const k of keys) {
    const good = scoreValue(k, ans ? ans[k] : undefined, truth[k]);
    detail[k] = good;
    if (good) ok++;
  }
  return { ok, total: keys.length, detail, score: `${ok}/${keys.length}` };
}

function scoreLoad(ans) {
  const detail = {
    has_evaluate_ticket_sla: ans?.has_evaluate_ticket_sla === true,
    has_list_open_p1_tickets: ans?.has_list_open_p1_tickets === true,
    bridge_mentions_batch: ans?.bridge_mentions_batch === true,
    tool_count_reasonable:
      typeof ans?.tool_count_estimate === 'number' &&
      ans.tool_count_estimate >= 20 &&
      ans.tool_count_estimate <= 200,
  };
  const ok = Object.values(detail).filter(Boolean).length;
  return { ok, total: Object.keys(detail).length, detail, score: `${ok}/${Object.keys(detail).length}` };
}

function scoreAll() {
  const truth = safeJson(path.join(BENCH, 'truth.json')) || loadTruth();
  const arms = ['mcp', 'text', 'image', 'load-text', 'load-image'];
  const runs = {};
  for (const a of arms) {
    runs[a] = safeJson(path.join(BENCH, 'out', `${a}.run.json`));
  }

  const packMeta = safeJson(path.join(PACKAGES, SKILL_NAME, 'meta.json'));
  const fatMeta = safeJson(path.join(BENCH, 'fat-pack.json'));

  const task = {};
  for (const a of ['mcp', 'text', 'image']) {
    const r = runs[a];
    if (!r) continue;
    const s = scoreTask(truth, r.ans);
    task[a] = {
      tokens: r.tokens,
      wall_s: r.secs,
      score: s.score,
      ok: s.ok,
      total: s.total,
      detail: s.detail,
      purity: r.purity,
      exit: r.exit,
      ans: r.ans,
    };
  }

  const load = {};
  for (const a of ['load-text', 'load-image']) {
    const r = runs[a];
    if (!r) continue;
    const s = scoreLoad(r.ans);
    load[a] = {
      tokens: r.tokens,
      wall_s: r.secs,
      score: s.score,
      detail: s.detail,
      purity: r.purity,
      exit: r.exit,
      ans: r.ans,
    };
  }

  const ratios = {};
  if (task.mcp?.tokens && task.text?.tokens) {
    ratios.mcp_over_text_tokens = +(task.mcp.tokens / task.text.tokens).toFixed(2);
  }
  if (task.mcp?.tokens && task.image?.tokens) {
    ratios.mcp_over_image_tokens = +(task.mcp.tokens / task.image.tokens).toFixed(2);
  }
  if (task.text?.tokens && task.image?.tokens) {
    ratios.text_over_image_tokens = +(task.text.tokens / task.image.tokens).toFixed(2);
    ratios.image_vs_text_savings_pct = +(
      (1 - task.image.tokens / task.text.tokens) *
      100
    ).toFixed(1);
  }
  if (task.mcp?.wall_s && task.image?.wall_s) {
    ratios.mcp_over_image_wall = +(task.mcp.wall_s / task.image.wall_s).toFixed(2);
  }
  if (task.text?.wall_s && task.image?.wall_s) {
    ratios.text_over_image_wall = +(task.text.wall_s / task.image.wall_s).toFixed(2);
  }
  if (load['load-text']?.tokens && load['load-image']?.tokens) {
    ratios.load_text_over_image_tokens = +(
      load['load-text'].tokens / load['load-image'].tokens
    ).toFixed(2);
    ratios.load_savings_pct = +(
      (1 - load['load-image'].tokens / load['load-text'].tokens) *
      100
    ).toFixed(1);
  }
  if (load['load-text']?.wall_s && load['load-image']?.wall_s) {
    ratios.load_text_over_image_wall = +(
      load['load-text'].wall_s / load['load-image'].wall_s
    ).toFixed(2);
  }

  const row = {
    when: new Date().toISOString(),
    model: MODEL,
    truth: {
      open_p1_count: truth.open_p1_count,
      breach_count: truth.breach_count,
      arr_at_risk: truth.arr_at_risk,
      top_account_at_risk: truth.top_account_at_risk,
    },
    pack: packMeta
      ? {
          pages: packMeta.pages,
          chars: packMeta.charCount,
          approxTextTokens: packMeta.approxTextTokens,
          approxVisionTokens: packMeta.approxVisionTokens,
        }
      : null,
    fat: fatMeta
      ? {
          pages: fatMeta.pages,
          chars: fatMeta.charCount,
          approxTextTokens: fatMeta.approxTextTokens,
          approxVisionTokens: fatMeta.approxVisionTokens,
        }
      : null,
    task,
    load,
    ratios,
  };

  write(path.join(RESULTS, 'scored.json'), JSON.stringify(row, null, 2));

  const md = `# Image skill (.cdc) benchmarks

**Model:** \`${MODEL}\`  
**When:** ${row.when}  
**Concept:** skill body as image (\`codex exec -i name.cdc.png\`) vs text SKILL.md vs MCP

## Pack metrics (definition tax estimates)

| pack | chars | ~text tokens | pages | ~vision tokens (est) |
|------|-------|--------------|-------|----------------------|
| complex-cdc image | ${row.pack?.chars ?? 'n/a'} | ${row.pack?.approxTextTokens ?? 'n/a'} | ${row.pack?.pages ?? 'n/a'} | ${row.pack?.approxVisionTokens ?? 'n/a'} |
| fat load fixture | ${row.fat?.chars ?? 'n/a'} | ${row.fat?.approxTextTokens ?? 'n/a'} | ${row.fat?.pages ?? 'n/a'} | ${row.fat?.approxVisionTokens ?? 'n/a'} |

## Task A/B — multi-hop SLA (accuracy + speed + tokens)

| arm | tokens | wall (s) | accuracy | exit |
|-----|--------|----------|----------|------|
| MCP | ${task.mcp?.tokens ?? '���'} | ${task.mcp?.wall_s ?? '—'} | ${task.mcp?.score ?? '—'} | ${task.mcp?.exit ?? '—'} |
| text skill | ${task.text?.tokens ?? '—'} | ${task.text?.wall_s ?? '—'} | ${task.text?.score ?? '—'} | ${task.text?.exit ?? '—'} |
| **image .cdc** | ${task.image?.tokens ?? '—'} | ${task.image?.wall_s ?? '—'} | ${task.image?.score ?? '—'} | ${task.image?.exit ?? '—'} |

### Ratios (task)
| | |
|--|--|
| MCP / text tokens | ${ratios.mcp_over_text_tokens ?? 'n/a'} |
| MCP / image tokens | ${ratios.mcp_over_image_tokens ?? 'n/a'} |
| text / image tokens | ${ratios.text_over_image_tokens ?? 'n/a'} |
| image vs text savings | ${ratios.image_vs_text_savings_pct != null ? ratios.image_vs_text_savings_pct + '%' : 'n/a'} |
| text / image wall | ${ratios.text_over_image_wall ?? 'n/a'} |
| MCP / image wall | ${ratios.mcp_over_image_wall ?? 'n/a'} |

### Task detail
- MCP: ${JSON.stringify(task.mcp?.detail || {})}
- text: ${JSON.stringify(task.text?.detail || {})}
- image: ${JSON.stringify(task.image?.detail || {})}

## Load microbench — fat document as text vs image

| arm | tokens | wall (s) | score | exit |
|-----|--------|----------|-------|------|
| load-text | ${load['load-text']?.tokens ?? '—'} | ${load['load-text']?.wall_s ?? '���'} | ${load['load-text']?.score ?? '—'} | ${load['load-text']?.exit ?? '—'} |
| load-image | ${load['load-image']?.tokens ?? '—'} | ${load['load-image']?.wall_s ?? '—'} | ${load['load-image']?.score ?? '���'} | ${load['load-image']?.exit ?? '—'} |

| load text/image tokens | ${ratios.load_text_over_image_tokens ?? 'n/a'} |
| load savings | ${ratios.load_savings_pct != null ? ratios.load_savings_pct + '%' : 'n/a'} |
| load wall text/image | ${ratios.load_text_over_image_wall ?? 'n/a'} |

### Load answers
- text: \`${JSON.stringify(load['load-text']?.ans || null)}\`
- image: \`${JSON.stringify(load['load-image']?.ans || null)}\`

## How to re-run

\`\`\`bash
CODEX_MODEL=gpt-5.6-sol PHASE=all node concept/image-skill/bench.js
# stepwise: setup | pack | mcp | text | image | load | score
\`\`\`

## Files
- packages: \`concept/image-skill/packages/complex-cdc/\`
- logs: \`concept/image-skill/bench/out/*.log\`
- scored: \`concept/image-skill/results/scored.json\`
`;

  write(path.join(RESULTS, 'results-image-skill-bench.md'), md);
  console.log('--- SCORE ---');
  console.log(JSON.stringify({ task, load, ratios }, null, 2));
  console.log('wrote', path.join(RESULTS, 'results-image-skill-bench.md'));
  return row;
}

async function main() {
  ensureDir(RESULTS);
  ensureDir(LOGS);
  ensureDir(BENCH);
  console.log('image-skill bench PHASE=', PHASE, 'MODEL=', MODEL);

  if (PHASE === 'setup' || PHASE === 'all') setupHomes();
  if (PHASE === 'pack' || PHASE === 'all') pack();

  if (PHASE === 'mcp' || (PHASE === 'all' && process.env.SKIP_MCP !== '1')) {
    await runMcp();
  } else if (PHASE === 'all' && process.env.SKIP_MCP === '1') {
    console.log('skip mcp');
  }
  if (PHASE === 'text' || PHASE === 'all') await runText();
  if (PHASE === 'image' || PHASE === 'all') await runImage();
  if (PHASE === 'load' || PHASE === 'all') await runLoad();
  if (PHASE === 'score' || PHASE === 'all') scoreAll();

  setTimeout(() => process.exit(0), 200).unref();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

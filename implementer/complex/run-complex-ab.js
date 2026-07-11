#!/usr/bin/env node
/**
 * complex MCP vs CDC skill A/B harness.
 *
 * BEFORE: Codex with acme-ops-complex MCP (~47 tools) — definition tax + multi-hop SLA task
 * AFTER:  Codex with complex-cdc skill only (MCP disabled) — CLI-first bridge
 *
 * Phases: setup | prebuild | mcp | use | score | all
 * Env: CODEX_MODEL, ARM_TIMEOUT_MS, PHASE
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const CX = path.resolve(__dirname);
const ROOT = path.resolve(CX, '../..');
const CREATE = path.join(ROOT, 'skills/cdc-skill-creator/scripts/create-cdc-skill.js');
const BIN = path.join(CX, 'bin');
const SERVER = path.join(BIN, 'complex-mcp.js');
const SKILLS = path.join(CX, 'skills');
const RESULTS = path.join(CX, 'results');
const LOGS = path.join(CX, 'logs');
const HOME_DIR = path.join(CX, 'homes', 'complex');
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
  if (r.status !== 0) throw new Error('truth fail: ' + (r.stderr || r.stdout));
  return JSON.parse(r.stdout);
}

function promptMcp() {
  return `You are connected to the acme-ops-complex MCP server (many tools across CRM, Support, Engineering, SLA, KB).

HARD TASK — compute SLA breaches for open P1 tickets. Use ONLY MCP tools (no inventing data).

Rules:
1. Use get_reference_now for the clock (do NOT use wall clock).
2. Find ALL open P1 tickets (page through list_open_p1_tickets or list_tickets until has_more is false).
3. For each open P1: join ticket → account (get_ticket_account or get_account) → tier → list_sla_policies / get_sla_for_tier.
4. Starter tier has NO contractual SLA (first_response_minutes null) → never a breach.
5. Enterprise first_response = 30 minutes; Growth = 120 minutes. Breach if age_hours > threshold_hours and first_response_at is null / not responded.
6. Prefer evaluate_ticket_sla when available; still page all open P1s.
7. Join related open engineering issues by component_id (list_open_issues_for_component). Do NOT use suggest_related_issues_by_subject (heuristic trap).
8. arr_at_risk = sum of UNIQUE account ARR for accounts that have at least one breach (do not double-count).

Return ONE JSON object only (no markdown fences if possible) with exactly these keys:
{
  "open_p1_count": <number>,
  "breach_count": <number>,
  "arr_at_risk": <number>,
  "top_account_at_risk": "<account name with highest ARR among breach accounts>",
  "top_account_arr": <number>,
  "breach_subjects_sorted": ["...sorted alphabetically..."],
  "accounts_in_breach_sorted": ["...unique account names sorted..."]
}
`;
}

function promptUse() {
  return `Use the ${SKILL_NAME} skill (CDC). MCP is disabled. Call tools via the skill bridge only (node mcp-call.js / openSession / callPaged / --batch). Do not re-enable MCP.

HARD TASK — same SLA breach analysis as the ops multi-system surface.

Rules:
1. get_reference_now for the clock.
2. Page ALL open P1 tickets (list_open_p1_tickets / list_tickets with filters; respect has_more).
3. Join ticket → account → tier → SLA policies. Starter = no SLA. Enterprise 30m, Growth 120m.
4. Prefer evaluate_ticket_sla; component_id joins for related open issues. Avoid suggest_related_issues_by_subject.
5. arr_at_risk = unique account ARR sum among breach accounts.

Return ONE JSON object only with keys:
open_p1_count, breach_count, arr_at_risk, top_account_at_risk, top_account_arr,
breach_subjects_sorted, accounts_in_breach_sorted
`;
}

function copyAuth(dest) {
  try {
    const authSrc = path.join(process.env.HOME || '', '.codex', 'auth.json');
    if (fs.existsSync(authSrc)) fs.copyFileSync(authSrc, path.join(dest, 'auth.json'));
    const mc = path.join(process.env.HOME || '', '.codex', 'models_cache.json');
    if (fs.existsSync(mc)) fs.copyFileSync(mc, path.join(dest, 'models_cache.json'));
  } catch {}
}

function setup() {
  const truth = loadTruth();
  ensureDir(path.join(HOME_DIR, 'out'));
  ensureDir(path.join(HOME_DIR, 'work'));
  ensureDir(SKILLS);
  ensureDir(LOGS);
  ensureDir(RESULTS);

  write(path.join(HOME_DIR, 'truth.json'), JSON.stringify(truth, null, 2));
  write(path.join(HOME_DIR, 'score_keys.json'), JSON.stringify([
    'open_p1_count',
    'breach_count',
    'arr_at_risk',
    'top_account_at_risk',
    'top_account_arr',
    'breach_subjects_sorted',
    'accounts_in_breach_sorted',
  ], null, 2));
  write(path.join(HOME_DIR, 'prompt-mcp.txt'), promptMcp());
  write(path.join(HOME_DIR, 'prompt-use.txt'), promptUse());

  const launcher = path.join(HOME_DIR, 'complex-mcp.sh');
  write(launcher, `#!/bin/bash
set -e
export COMPLEX_PAGE_SIZE="\${COMPLEX_PAGE_SIZE:-8}"
export COMPLEX_SEED="\${COMPLEX_SEED:-42}"
exec ${JSON.stringify(process.execPath)} ${JSON.stringify(SERVER)} "$@"
`);
  fs.chmodSync(launcher, 0o755);

  const mcpHome = path.join(HOME_DIR, 'mcp-home');
  ensureDir(mcpHome);
  write(
    path.join(mcpHome, 'config.toml'),
    `model = "${MODEL}"
model_reasoning_effort = "medium"
approval_policy = "never"
sandbox_mode = "danger-full-access"

[projects."${path.join(HOME_DIR, 'work')}"]
trust_level = "trusted"

[projects."${ROOT}"]
trust_level = "trusted"

[projects."${CX}"]
trust_level = "trusted"

[mcp_servers.acme_ops_complex]
command = "${launcher}"
args = []
`,
  );
  copyAuth(mcpHome);

  const useHome = path.join(HOME_DIR, 'use-home');
  ensureDir(useHome);
  write(
    path.join(useHome, 'config.toml'),
    `model = "${MODEL}"
model_reasoning_effort = "medium"
approval_policy = "never"
sandbox_mode = "danger-full-access"

[projects."${path.join(HOME_DIR, 'work')}"]
trust_level = "trusted"

[projects."${ROOT}"]
trust_level = "trusted"

[projects."${CX}"]
trust_level = "trusted"
`,
  );
  copyAuth(useHome);

  const skillsLink = path.join(useHome, 'skills');
  try {
    fs.rmSync(skillsLink, { recursive: true, force: true });
  } catch {}
  try {
    fs.symlinkSync(SKILLS, skillsLink, 'dir');
  } catch (e) {
    console.warn('symlink skills', e.message);
  }

  console.log('setup ok', {
    tools: truth.tool_count,
    breaches: truth.breach_count,
    open_p1: truth.open_p1_count,
    model: MODEL,
  });
  return truth;
}

function prebuild() {
  ensureDir(SKILLS);
  ensureDir(path.join(CX, '.cdc-build'));
  const launcher = path.join(HOME_DIR, 'complex-mcp.sh');
  if (!fs.existsSync(launcher)) setup();
  const args = [
    CREATE,
    'from-mcp',
    '--name',
    'complex',
    '--probe',
    launcher,
    '--skills-dir',
    SKILLS,
    '--target',
    'codex',
    '--out',
    path.join(CX, '.cdc-build'),
    '--skill-name',
    SKILL_NAME,
  ];
  console.log('prebuild complex-cdc ...');
  const r = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    timeout: 180000,
  });
  const log = (r.stderr || '') + '\n' + (r.stdout || '');
  write(path.join(LOGS, 'prebuild.log'), log);
  const line = (r.stdout || '').trim().split('\n').filter(Boolean).pop() || '';
  let j = null;
  try {
    j = JSON.parse(line);
  } catch {
    j = { ok: false, raw: line, status: r.status };
  }
  write(path.join(LOGS, 'prebuild.json'), JSON.stringify(j, null, 2));
  console.log('prebuild', j.ok ? `ok tools=${j.tools} skill=${j.skillName || SKILL_NAME}` : j);

  // ensure skill name
  const installed = (j.installed || [])[0];
  if (installed && path.basename(installed) !== SKILL_NAME) {
    const dest = path.join(SKILLS, SKILL_NAME);
    if (!fs.existsSync(dest)) fs.renameSync(installed, dest);
  }
  const call = path.join(SKILLS, SKILL_NAME, 'mcp-call.js');
  if (fs.existsSync(call)) {
    const warm = spawnSync(process.execPath, [call, 'daemon-start'], {
      encoding: 'utf8',
      timeout: 120000,
    });
    console.log('daemon-start', warm.status === 0 ? 'ok' : (warm.stderr || warm.stdout || '').slice(0, 200));
  }
  return j;
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
  // fenced json
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
    mcp_tool_calls: (t.match(/mcp__|mcp_servers|acme_ops|tools\/call/gi) || []).length,
    openSession: (t.match(/openSession/g) || []).length,
    callPaged: (t.match(/callPaged/g) || []).length,
    mcp_call_js: (t.match(/mcp-call\.js/g) || []).length,
    batch: (t.match(/--batch/g) || []).length,
    curl: (t.match(/\bcurl\b/g) || []).length,
  };
}

function runArm(arm) {
  return new Promise((resolve) => {
    const work = path.join(HOME_DIR, 'work');
    const outDir = path.join(HOME_DIR, 'out');
    ensureDir(outDir);
    ensureDir(work);
    const codexHome = path.join(HOME_DIR, arm === 'mcp' ? 'mcp-home' : 'use-home');
    const prompt = fs.readFileSync(
      path.join(HOME_DIR, arm === 'mcp' ? 'prompt-mcp.txt' : 'prompt-use.txt'),
      'utf8',
    );

    if (arm === 'use') {
      const skillsLink = path.join(codexHome, 'skills');
      try {
        if (!fs.existsSync(skillsLink)) fs.symlinkSync(SKILLS, skillsLink, 'dir');
      } catch {}
      const call = path.join(SKILLS, SKILL_NAME, 'mcp-call.js');
      if (fs.existsSync(call)) {
        const warm = spawnSync(process.execPath, [call, 'daemon-start'], {
          encoding: 'utf8',
          timeout: 120000,
        });
        if (warm.status !== 0) {
          console.log('WARN daemon-start', (warm.stderr || warm.stdout || '').slice(0, 200));
        }
      }
    }

    // Refresh auth each run
    copyAuth(codexHome);

    const env = {
      ...process.env,
      CODEX_HOME: codexHome,
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      COMPLEX_PAGE_SIZE: '8',
      COMPLEX_SEED: '42',
    };

    console.log(`RUN ${arm} model=${MODEL} timeout=${TIMEOUT_MS}ms ...`);
    const t0 = Date.now();
    const child = spawn(
      'codex',
      [
        'exec',
        '--dangerously-bypass-approvals-and-sandbox',
        '-m',
        MODEL,
        '-c',
        'model_reasoning_effort="medium"',
        prompt,
      ],
      { cwd: work, env, stdio: ['ignore', 'pipe', 'pipe'] },
    );

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
      write(path.join(outDir, `${arm}.log`), text);
      const tokens = extractTokens(text);
      const ans = extractJson(text);
      const meta = {
        target: 'complex',
        arm,
        model: MODEL,
        exit: code,
        secs,
        tokens,
        signal: signal || null,
        purity: purity(text),
        ans,
      };
      write(path.join(outDir, `${arm}.meta`), `${arm} exit=${code} secs=${secs}\n${tokens != null ? tokens + ':tokens used' : 'no-tokens'}\n`);
      write(path.join(outDir, `${arm}.ans.json`), JSON.stringify(ans, null, 2));
      write(path.join(outDir, `${arm}.run.json`), JSON.stringify(meta, null, 2));
      console.log(`DONE ${arm} exit=${code} ${secs}s tokens=${tokens}`);
      resolve(meta);
    });
  });
}

function scoreValue(key, got, expect) {
  if (Array.isArray(expect)) {
    if (!Array.isArray(got)) return false;
    const a = [...got].map(String).sort().join('\0');
    const b = [...expect].map(String).sort().join('\0');
    return a === b;
  }
  if (typeof expect === 'number') {
    const n = typeof got === 'number' ? got : Number(got);
    if (!Number.isFinite(n)) return false;
    return Math.abs(n - expect) < 0.5 || Math.abs(n - expect) / (Math.abs(expect) || 1) < 0.001;
  }
  return got === expect;
}

function scoreArm(truth, ans) {
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

function score() {
  const truth = safeJson(path.join(HOME_DIR, 'truth.json')) || loadTruth();
  const mcpRun = safeJson(path.join(HOME_DIR, 'out', 'mcp.run.json'));
  const useRun = safeJson(path.join(HOME_DIR, 'out', 'use.run.json'));
  const mcpAns = mcpRun?.ans || safeJson(path.join(HOME_DIR, 'out', 'mcp.ans.json'));
  const useAns = useRun?.ans || safeJson(path.join(HOME_DIR, 'out', 'use.ans.json'));
  const mcpS = scoreArm(truth, mcpAns);
  const useS = scoreArm(truth, useAns);

  const row = {
    target: 'complex',
    model: MODEL,
    tool_count: truth.tool_count,
    truth: {
      open_p1_count: truth.open_p1_count,
      breach_count: truth.breach_count,
      arr_at_risk: truth.arr_at_risk,
      top_account_at_risk: truth.top_account_at_risk,
      accounts_in_breach_sorted: truth.accounts_in_breach_sorted,
    },
    mcp: {
      tokens: mcpRun?.tokens ?? null,
      wall_s: mcpRun?.secs ?? null,
      score: mcpS.score,
      ok: mcpS.ok,
      total: mcpS.total,
      detail: mcpS.detail,
      ans: mcpAns,
      purity: mcpRun?.purity || null,
      exit: mcpRun?.exit ?? null,
    },
    use: {
      tokens: useRun?.tokens ?? null,
      wall_s: useRun?.secs ?? null,
      score: useS.score,
      ok: useS.ok,
      total: useS.total,
      detail: useS.detail,
      ans: useAns,
      purity: useRun?.purity || null,
      exit: useRun?.exit ?? null,
    },
  };

  // ratios
  if (row.mcp.tokens && row.use.tokens) {
    row.token_ratio_mcp_over_use = +(row.mcp.tokens / row.use.tokens).toFixed(2);
    row.token_savings_pct = +((1 - row.use.tokens / row.mcp.tokens) * 100).toFixed(1);
  }
  if (row.mcp.wall_s && row.use.wall_s) {
    row.wall_ratio_mcp_over_use = +(row.mcp.wall_s / row.use.wall_s).toFixed(2);
  }

  write(path.join(RESULTS, 'scored.json'), JSON.stringify(row, null, 2));

  const md = `# Complex MCP vs CDC skill ��� Codex A/B

**Model:** \`${MODEL}\`  
**Server:** acme-ops-complex (\`${truth.tool_count}\` tools, multi-hop SLA task)  
**When:** ${new Date().toISOString()}

## Task
Find all open P1 tickets whose first-response SLA is breached (Enterprise 30m / Growth 120m / Starter none), unique ARR at risk, related open eng issues via \`component_id\` (not subject heuristics). Paginated lists force multi-call.

## Ground truth
| key | value |
|-----|-------|
| open_p1_count | ${truth.open_p1_count} |
| breach_count | ${truth.breach_count} |
| arr_at_risk | ${truth.arr_at_risk} |
| top_account_at_risk | ${truth.top_account_at_risk} (${truth.top_account_arr}) |
| accounts_in_breach | ${truth.accounts_in_breach_sorted.join(', ')} |

## BEFORE — MCP on
| metric | value |
|--------|-------|
| tokens | ${row.mcp.tokens ?? 'n/a'} |
| wall (s) | ${row.mcp.wall_s ?? 'n/a'} |
| accuracy | ${row.mcp.score} |
| exit | ${row.mcp.exit} |
| purity | ${JSON.stringify(row.mcp.purity)} |

Answer keys correct: ${JSON.stringify(row.mcp.detail)}

## AFTER ��� CDC skill only (\`${SKILL_NAME}\`, MCP off)
| metric | value |
|--------|-------|
| tokens | ${row.use.tokens ?? 'n/a'} |
| wall (s) | ${row.use.wall_s ?? 'n/a'} |
| accuracy | ${row.use.score} |
| exit | ${row.use.exit} |
| purity | ${JSON.stringify(row.use.purity)} |

Answer keys correct: ${JSON.stringify(row.use.detail)}

## Delta
| | |
|--|--|
| token ratio (MCP/USE) | ${row.token_ratio_mcp_over_use ?? 'n/a'} |
| token savings | ${row.token_savings_pct != null ? row.token_savings_pct + '%' : 'n/a'} |
| wall ratio (MCP/USE) | ${row.wall_ratio_mcp_over_use ?? 'n/a'} |

## Files
- MCP log: \`homes/complex/out/mcp.log\`
- USE log: \`homes/complex/out/use.log\`
- scored: \`results/scored.json\`
- skill: \`skills/${SKILL_NAME}/\`
`;

  write(path.join(RESULTS, 'results-complex-ab.md'), md);
  console.log('--- SCORE ---');
  console.log('MCP', row.mcp.score, `tok=${row.mcp.tokens} wall=${row.mcp.wall_s}`);
  console.log('USE', row.use.score, `tok=${row.use.tokens} wall=${row.use.wall_s}`);
  console.log('ratio tokens MCP/USE', row.token_ratio_mcp_over_use, 'savings%', row.token_savings_pct);
  console.log('wrote', path.join(RESULTS, 'scored.json'));
  console.log('wrote', path.join(RESULTS, 'results-complex-ab.md'));
  return row;
}

async function main() {
  ensureDir(RESULTS);
  ensureDir(LOGS);
  console.log('complex A/B PHASE=', PHASE, 'MODEL=', MODEL);

  if (PHASE === 'setup' || PHASE === 'all') setup();
  if (PHASE === 'prebuild' || PHASE === 'all') {
    if (process.env.SKIP_PREBUILD === '1') console.log('skip prebuild');
    else prebuild();
  }
  if (PHASE === 'mcp' || PHASE === 'all') await runArm('mcp');
  if (PHASE === 'use' || PHASE === 'all') await runArm('use');
  if (PHASE === 'score' || PHASE === 'all') score();

  setTimeout(() => process.exit(0), 200).unref();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Compile MCP tool definitions into a CDC package (general --- no demo hardcoding).
//
// Input: tools/list dump or probe of any MCP server.
// Output: SKILL.md + CDC.md + stats.json
//   - filesystem-like servers → direct Node fs mode (no MCP spawn)
//   - HTTP base provided → fetch mode
//   - everything else --- short skill + mcp-call.js bridge
//
// Design goals (learned the hard way from A/B runs — see results-codex-luna-*.md):
//   1. SHORT skill preambles (low definition tax) — but not so short the agent
//      has to guess. Guessing = exploratory scripts = thrash = slow + expensive.
//   2. The bridge NEVER spawns a server per call. One session per script.
//      (Per-call spawn was the #1 wall-clock regression: npx cold start × N.)
//   3. CDC.md lines carry a truncated description — a few tokens per tool that
//      save whole exploratory round trips.
//   4. Recon-then-compute discipline with a canonical-source rule. The blanket
//      "one run, no thrash" rule caused a 2× double-count on sharded data.
//   5. NEVER bake example-specific paths, filenames, or task logic into templates.

const path = require('path');
const fs = require('fs');
const { estimateTokens } = require('./tokens');
const { paramsOf, envVarName, writePackage, writeImageSkill } = require('./schema-util');
const { snapshotFs } = require('./fs-snapshot');
const { buildQjs } = require('./q-template');

function normalizeTools(input) {
  if (!input) throw new Error('empty MCP tools input');
  if (Array.isArray(input)) return input;
  if (Array.isArray(input.tools)) return input.tools;
  if (Array.isArray(input.result?.tools)) return input.result.tools;
  if (input.name && (input.inputSchema || input.input_schema || input.description)) {
    return [input];
  }
  throw new Error(
    'Unrecognized MCP tools format. Expected an array of tools, or { tools: [...] }.',
  );
}

function tagOf(toolName) {
  const m = String(toolName).match(/^([a-zA-Z][a-zA-Z0-9]*)[_.]/);
  if (m) return m[1];
  const c = String(toolName).match(/^([a-z]+)(?=[A-Z])/);
  if (c && c[1].length >= 3) return c[1];
  return 'misc';
}

/** First sentence of a tool description, hard-capped. Empty string if none. */
function descOf(tool) {
  let d = String(tool.description || '').replace(/\s+/g, ' ').trim();
  if (!d) return '';
  const m = d.match(/^(.{12,}?[.!?])(?:\s|$)/);
  if (m) d = m[1];
  d = d.replace(/[.\s]+$/, '');
  if (d.length > 90) d = d.slice(0, 87) + '…';
  return d;
}

/** Compact signature WITH a one-line description.
 *  `list_directory(path*)` alone forces the agent to guess return shapes and
 *  thrash; ~10 extra tokens per tool buys first-try scripts. */
function toolLine(tool) {
  const schema = tool.inputSchema || tool.input_schema || { type: 'object', properties: {} };
  const params = paramsOf(schema);
  const shown = params.slice(0, 8);
  const paramStr = shown.length
    ? '(' + shown.join(', ') + (params.length > 8 ? ',...' : '') + ')'
    : '()';
  const desc = descOf(tool);
  return `${tool.name}${paramStr}${desc ? ' — ' + desc : ''}`;
}

/**
 * Detect local filesystem MCP servers generically.
 * Returns { isFs, root }. Root comes only from probe argv - never hardcoded.
 */
function detectFilesystemRoot(mcpCommand, mcpArgs, name, tools) {
  const args = Array.isArray(mcpArgs) ? mcpArgs.map(String) : [];
  const blob = [mcpCommand, ...args, name].filter(Boolean).join(' ').toLowerCase();
  const names = new Set((tools || []).map((t) => t.name));

  const looksLikeFsServer =
    /server-filesystem|@modelcontextprotocol\/server-filesystem/.test(blob) ||
    (name && /^filesystem$/i.test(String(name))) ||
    (names.has('list_directory') &&
      names.has('list_allowed_directories') &&
      (names.has('read_text_file') || names.has('read_file') || names.has('read_multiple_files')));

  if (!looksLikeFsServer) return { isFs: false, root: null };

  let root = null;
  for (let i = args.length - 1; i >= 0; i--) {
    const a = args[i];
    if (a.startsWith('/') || /^[A-Za-z]:[\\/]/.test(a)) {
      root = a;
      break;
    }
  }
  if (!root) {
    for (let i = args.length - 1; i >= 0; i--) {
      if (args[i].startsWith('-')) continue;
      if (args[i].includes('@')) continue;
      if (args[i].includes('/') || args[i].includes('\\')) {
        root = args[i];
        break;
      }
    }
  }
  return { isFs: true, root };
}

function groupTools(tools) {
  const byTag = new Map();
  for (const tool of tools) {
    const tag = tagOf(tool.name);
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag).push(toolLine(tool));
  }
  const tags = [...byTag.keys()].sort();
  return { byTag, tags };
}

function renderCdcIndex({ title, tools, byTag, tags, headerLines }) {
  let cdc = `# ${title}\n\n`;
  for (const line of headerLines) cdc += line + '\n';
  cdc += '\n';
  for (const tag of tags) {
    cdc += `## ${tag}\n`;
    for (const line of byTag.get(tag)) cdc += line + '\n';
    cdc += '\n';
  }
  cdc += '## _index\n';
  for (const n of tools.map((t) => t.name).sort()) cdc += n + '\n';
  return cdc;
}

// Shared discipline block. Every mode gets the same three correctness rules —
// they exist because their absence produced a wrong answer in live A/B runs.
function disciplineRules(extra = []) {
  const rules = [
    ...extra,
    'Unknown data layout? Run ONE tiny recon first (names/counts/sizes only, print ≤15 lines), THEN one compute script. Max 2 runs total.',
    'If several sources can contain the SAME records (full dump + page shards, raw + rollup, daily + monthly), pick ONE canonical source. NEVER aggregate overlapping sources.',
    'Sanity-check before printing: counts consistent with recon, no double counting, magnitudes plausible.',
    'Print ONLY the final answer as compact JSON. Never echo raw payloads into chat.',
  ];
  return rules.map((r, i) => `${i + 1}. ${r}`).join('\n');
}

/**
 * SHORT skill for local filesystem MCP -> direct Node fs.
 * General template: ROOT from probe path or CDC_FS_ROOT only.
 * No example files, no task-specific code, no MCP bridge.
 */
function buildDirectFsPackage({ name, root, tools, snapshot }) {
  const hasRoot = Boolean(root);
  const rootDisplay = hasRoot ? root : '$CDC_FS_ROOT';
  const { byTag, tags } = groupTools(tools);
  const hasSnap = Boolean(snapshot?.ok);

  const layoutSection = hasSnap
    ? [
        '## Data layout (captured at skill-build time)',
        '',
        '```',
        snapshot.skillBlock,
        '```',
        '',
        'Snapshot is authoritative — recon FORBIDDEN. Only if reality contradicts it: `node \'__SKILL_DIR__/q.js\' recon` once.',
      ]
    : [
        'No layout snapshot (root unavailable at build time). First run:',
        '`node \'__SKILL_DIR__/q.js\' recon` (bounded output), then ONE compute script. recon+compute ≤2 shells.',
      ];

  const skill = [
    '---',
    `name: ${name}-cdc`,
    `description: File ops under ${rootDisplay} via short Node fs scripts (CDC). Prefer fs; do not use MCP/npx. Use when the user asks about files in that root or ${name}-cdc.`,
    '---',
    '',
    `# ${name}-cdc`,
    '',
    `Root: \`${rootDisplay}\`${hasRoot ? '' : ' (set env CDC_FS_ROOT if empty)'}`,
    '',
    'Data work via **q.js** (bundled) in ONE inline script — no MCP, no npx, no script files:',
    '',
    '```bash',
    "node - <<'EOF'",
    "const q = require('__SKILL_DIR__/q.js');",
    "const rows = q.load('data.json');                 // json|ndjson|csv, relative to ROOT",
    "const ref = q.index(q.load('lookup.json'), 'id'); // key-coercing join: ref.get(r.ref_id)",
    "console.log(JSON.stringify({ metric: q.round2(q.sumBy(rows, 'total')) }));",
    'EOF',
    '```',
    '',
    'Also: q.files(dir), q.groupBy, q.assertNonEmpty. Rules:',
    hasSnap
      ? '1. Recon FORBIDDEN (snapshot authoritative). Happy path = ONE compute script. On ERROR: exactly 1 repair shell (fix paths/args) — never print null/guessed. Only if reality contradicts snapshot: `node q.js recon` once.'
      : '1. No snapshot: recon once then ONE compute script (≤2 shells). Happy path = 1 shell; on ERROR exactly 1 repair shell (fix paths/args) — never print null/guessed.',
    '2. NEVER aggregate overlapping sources (full file + its numbered shards); the snapshot marks duplicates.',
    '3. Empty/zero metric = bug: q.assertNonEmpty it, re-check snapshot field names/enum values.',
    '4. Stay under Root. Print ONLY final compact JSON. Multi-call = 1 shell; recon+compute ≤2.',
    'Skill body already loaded — never cat/sed/grep this skill\'s SKILL.md/SKILL.text.md/CDC.md via shell unless told to grep CDC.md for a missing signature.',
    '',
    ...layoutSection,
    '',
  ].join('\n');

  const cdcHeader = [
    `Root: ${rootDisplay}`,
    'Mode: direct Node fs via q.js (not MCP).',
    'MCP tool names below are a map only --- implement with q.js/fs.',
  ];
  if (hasSnap) {
    cdcHeader.push('', '## Data layout (full snapshot, build time)', '```', snapshot.cdcBlock, '```');
  }
  const cdc = renderCdcIndex({
    title: `${name}-cdc (direct fs)`,
    tools,
    byTag,
    tags,
    headerLines: cdcHeader,
  });

  return { skill, cdc, mode: 'direct-fs', root: rootDisplay };
}

/** SHORT skill for HTTP-mode (--http-base). */
function buildHttpPackage({ name, title, httpBase, envVar, tools }) {
  const { byTag, tags } = groupTools(tools);
  const skill = [
    '---',
    `name: ${name}-cdc`,
    `description: Call ${title} via short Node fetch scripts (CDC). Use for ${name}.`,
    '---',
    '',
    `# ${title}`,
    '',
    `Base URL: ${httpBase}`,
    '',
    `ONE Node script with fetch. Auth from env $${envVar} if needed — never hardcode secrets. Multi-call work = exactly 1 shell; recon+compute ≤2.`,
    '',
    'Rules:',
    disciplineRules([
      'Fetch only what you need; paginate where offered; do ALL filtering/aggregation in the script.',
    ]),
    '',
    'Endpoint/tool signatures: grep CDC.md — do not load the whole file.',
    'Skill body already loaded — never cat/sed/grep this skill\'s SKILL.md/SKILL.text.md/CDC.md via shell unless told to grep CDC.md for a missing signature.',
    '',
  ].join('\n');

  const cdc = renderCdcIndex({
    title: `${title} - CDC`,
    tools,
    byTag,
    tags,
    headerLines: [`HTTP: ${httpBase}`, `Auth env: ${envVar}`],
  });

  return { skill, cdc, mode: 'http' };
}

/**
 * SHORT skill for general MCP servers (bridge mode).
 * The bridge keeps ONE server session per script — per-call spawning was the
 * single biggest latency regression in live A/B runs.
 *
 * UX goal (mega-20 lesson): after convert, the agent must feel faster + cheaper
 * than connected MCP. That means:
 *   - Prefer CLI one-liners / --batch (no openSession boilerplate) for simple work
 *   - Only teach openSession/callPaged when tools actually paginate or need multi-step
 *   - Never put a fake callPaged example in every skill (agents thrash on minis)
 *   - Fat surfaces (nTools>12 or paging): hot path = ONE openSession script, names-only index
 */
/** Write/mutate tools must never be the callPaged pageTool example. */
function isWriteMutateTool(name) {
  const n = String(name || '');
  // API-post-search / post-query are reads even though they start with post.
  if (/post[-_]?search|post[-_]?query|post[-_]?list/i.test(n)) return false;
  if (/^(create_|update_|delete_|patch_|append_|write_|move_|insert_)/i.test(n)) return true;
  if (/\b(patch|update|create|delete|append|write|move|insert)[-_]/i.test(n)) return true;
  // Notion-style: API-patch-*, API-update-*, API-create-*, API-delete-*, API-post-page
  if (/API-(patch|update|create|delete|move)-/i.test(n)) return true;
  if (/API-post-(page|comment|data)/i.test(n)) return true;
  if (/API-update-page-markdown/i.test(n)) return true;
  return false;
}

function toolLooksPaginated(tool) {
  const name = String(tool.name || '');
  // Non-collection / meta tools must never be selected as pageTool examples.
  if (/^(server_info|health_check|ping|describe_)/i.test(name)) return false;
  if (/^get_reference/i.test(name)) return false;
  // Write / mutate tools are never the callPaged example — even if they accept
  // start_cursor (Notion API-patch-block-children). Live A/B thrash root cause.
  if (isWriteMutateTool(name)) return false;

  const schema = tool.inputSchema || tool.input_schema || {};
  const props = schema.properties || {};
  const keys = Object.keys(props).map((k) => k.toLowerCase());
  // Real list pagination: page/cursor/offset (+ optional page size).
  // Do NOT treat bare `limit` as pagination — almost every tool has limit
  // (tradingview top_gainers etc.) and that forced callPaged thrash in mega-20.
  const hasPage = keys.some((k) =>
    /^(page|page_number|pagenumber|cursor|offset|skip|after|next_token|continuation_token|start_cursor)$/.test(k),
  );
  const hasPageSize = keys.some((k) =>
    /^(per_page|page_size|pagesize|limit|count|take|size)$/.test(k),
  );
  if (hasPage) return true;
  // page_size alone without page is weak; require explicit pagination language
  const blob = `${name} ${tool.description || ''}`.toLowerCase();
  if (hasPageSize && /\bpaginat/.test(blob)) return true;
  return /\bpaginat/.test(blob) && /\b(list|search|find|query|all pages)\b/.test(blob);
}

function pageToolScore(name) {
  const n = String(name || '');
  let s = 0;
  // Primary work surfaces for multi-hop agents
  if (/post[-_]?search|search_/i.test(n) || /\bsearch\b/i.test(n)) s += 120;
  if (/query[-_]?data|query_/i.test(n) || /\bquery\b/i.test(n)) s += 80;
  if (/list_open_|list_.*open/i.test(n)) s += 100;
  if (/^(list_|search_|query_)/i.test(n)) s += 50;
  if (/get[-_].*children|list[-_].*children|block[-_]children/i.test(n)) s += 40;
  if (/list_/i.test(n)) s += 20;
  // Templates / admin lists are rarely the multi-hop work tool
  if (/template/i.test(n)) s -= 100;
  if (/users?$/i.test(n) && /list|get/i.test(n)) s -= 30;
  return s;
}

function firstPaginatedToolName(tools) {
  const cands = (tools || []).filter(toolLooksPaginated);
  if (!cands.length) return null;
  // Prefer open-list tools among paginated candidates (list_open_* / list_*open*).
  const openList = cands.filter((t) => /list_open_|list_.*open/i.test(String(t.name || '')));
  if (openList.length) {
    openList.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return openList[0].name;
  }
  // Prefer real collection tools (search/query/list); score to avoid templates.
  const listLike = cands.filter((t) =>
    /^(list_|search_|query_)/i.test(t.name) ||
    /post[-_]?search|post[-_]?query/i.test(t.name) ||
    /\b(search|list|query)\b/i.test(t.name) ||
    /children/i.test(t.name),
  );
  const pool = listLike.length ? listLike : cands;
  pool.sort((a, b) => {
    const ds = pageToolScore(b.name) - pageToolScore(a.name);
    if (ds) return ds;
    return String(a.name).localeCompare(String(b.name));
  });
  return pool[0].name;
}


/**
 * Hot-path evaluate / join helpers for multi-hop skills.
 * Surfaces evaluate_* and SLA/SLO evaluate tools + cheap get_*account joins.
 * get_* helpers are strict: only account-entity joins, never usage/fraud/runbook noise.
 */
function collectEvaluateHelpers(tools) {
  const list = tools || [];
  const evaluate = [];
  const joins = [];
  const seen = new Set();
  for (const t of list) {
    const n = String(t.name || '');
    if (!n || seen.has(n)) continue;
    const blob = n + ' ' + (t.description || '');
    if (/^evaluate_/i.test(n) || (/\bevaluate\b/i.test(blob) && /\b(sla|slo)\b/i.test(blob))) {
      evaluate.push(t);
      seen.add(n);
    }
  }
  // Account-entity joins only. Exclude get_usage_for_account, get_fraud_*, get_runbook, etc.
  const isAccountJoin = (n) =>
    /^get_(ticket|incident|billing_)?account/i.test(n) || /^get_.*_account$/i.test(n);
  for (const t of list) {
    const n = String(t.name || '');
    if (!n || seen.has(n)) continue;
    if (!isAccountJoin(n)) continue;
    // Extra noise guard: fraud/usage/runbook/signal never belong in join helpers
    if (/fraud|usage|runbook|signal|metric|quota/i.test(n)) continue;
    joins.push(t);
    seen.add(n);
    if (joins.length >= 4) break; // cap get helpers; evaluate_* are uncapped
  }
  return { evaluate, joins };
}

function sampleArgsForTool(tool) {
  const schema = tool.inputSchema || tool.input_schema || {};
  const props = schema.properties || {};
  const required = Array.isArray(schema.required) && schema.required.length
    ? schema.required
    : Object.keys(props).slice(0, 3);
  const args = {};
  for (const k of required.slice(0, 5)) {
    const p = props[k] || {};
    if (p.default !== undefined) args[k] = p.default;
    else if (Array.isArray(p.enum) && p.enum.length) args[k] = p.enum[0];
    else if (p.type === 'integer' || p.type === 'number') args[k] = 1;
    else if (p.type === 'boolean') args[k] = true;
    else if (p.type === 'array' || p.items) args[k] = [];
    else if (p.type === 'object' || p.properties) args[k] = {};
    else args[k] = 'x';
  }
  return args;
}

function buildMcpBridgePackage({ name, title, tools }) {
  const { byTag, tags } = groupTools(tools);
  const tagDir = tags.map((t) => `- ${t} (${byTag.get(t).length})`).join('\n');
  const nTools = (tools || []).length;
  const pageTool = firstPaginatedToolName(tools);
  const hasPaging = Boolean(pageTool);
  // "Simple" = small surface + no pagination. CLI/batch is enough; multi-step
  // scripts are pure overhead (mega-20 calc/todo/weather).
  const simple = nTools <= 12 && !hasPaging;

  const indexBody = tags
    .map((t) => `### ${t}\n` + byTag.get(t).join('\n'))
    .join('\n');
  // Hot path: never ship fat full-signature indexes (nova ~4k bytes).
  // Inline only for tiny non-paged surfaces where grepping CDC would cost a turn.
  const inlineIndex =
    nTools <= 12 &&
    !hasPaging &&
    estimateTokens(indexBody) <= 500;

  // Always ship tool NAMES in SKILL.md so agents can answer "what tools?"
  // without grepping CDC.md. For fat surfaces, keep list/search full and
  // compact the rest so hot skillTokens stay low (never rebill 48 signatures).
  const allNames = (tools || []).map((x) => x.name);
  const nameList = allNames.join(' ');
  const listToolNames = allNames.filter((n) => /^(list_|search_)/i.test(n));
  const listToolsHint = listToolNames.length
    ? `List tools: ${listToolNames.slice(0, 16).join(' ')}${listToolNames.length > 16 ? ' …' : ''}`
    : '';

  // Compact names-only section: when the full name list is still expensive,
  // show list/search fully + per-tag samples (full _index lives in CDC.md).
  let namesOnlyBody;
  if (estimateTokens(nameList) <= 280) {
    namesOnlyBody = nameList;
  } else {
    const byTagNames = new Map();
    for (const tool of tools || []) {
      const tag = tagOf(tool.name);
      if (!byTagNames.has(tag)) byTagNames.set(tag, []);
      byTagNames.get(tag).push(tool.name);
    }
    const parts = [];
    for (const tag of [...byTagNames.keys()].sort()) {
      const ns = byTagNames.get(tag);
      if (ns.every((n) => /^(list_|search_)/i.test(n)) || ns.length <= 6) {
        parts.push(`${tag}: ${ns.join(' ')}`);
      } else {
        parts.push(`${tag}(${ns.length}): ${ns.slice(0, 4).join(' ')} ...`);
      }
    }
    namesOnlyBody = parts.join('\n') + '\nFull names: CDC.md `_index`.';
  }

  const toolSection = inlineIndex
    ? ['## Tools', '', indexBody]
    : [
        '## Tools (names)',
        '',
        ...(listToolsHint ? [listToolsHint, ''] : []),
        namesOnlyBody,
        '',
        "Args on fail: `grep -A 12 \"^## <tool>\" '__SKILL_DIR__/CDC.md'` once.",
      ];

  // Prefer a real work tool over meta server_info for the example call slot.
  const exampleTool =
    (tools || []).find((t) => !/^(server_info|health_check|ping|describe_)/i.test(t.name))?.name ||
    (tools || [])[0]?.name ||
    'tool_name';

  // SPEED-FIRST hot path:
  //   simple  → CLI --batch only (no openSession boilerplate)
  //   !simple → ONE openSession script (+ short multi-step template in SKILL)
  // Full Multi-step lives in CDC.md; fat skills also get a short copy in SKILL.
  const descLine = simple
    ? `description: Fast CDC for ${title} (${nTools} tools). ONE shell: node mcp-call.js --batch '[{tool,args}...]'. No MCP schemas. Use ${name}-cdc skill.`
    : `description: Fast CDC for ${title} (${nTools} tools). Multi-hop: ONE node openSession script; max 1 shell. No MCP schemas. Use ${name}-cdc skill.`;

  const lines = [
    '---',
    `name: ${name}-cdc`,
    descLine,
    '---',
    '',
    `# ${title}`,
    '',
    '**No connected MCP.** Skill only. **ONE shell → compact JSON answer.**',
    '',
  ];

  if (simple) {
    lines.push(
      '## Call',
      '',
      '```bash',
      `node '__SKILL_DIR__/mcp-call.js' --batch '[{"tool":"${exampleTool}","args":{}}]'`,
      '```',
      '',
      `Single: \`node '__SKILL_DIR__/mcp-call.js' ${exampleTool} '{}'\``,
      '',
      'Daemon warm. Do **not** list tools first. Fill real args from Tools below — never invent names or placeholder values.',
      'CLI stdout is compacted; pass `--raw` before the tool name or with `--batch` for full output.',
      '',
      '## Rules',
      '',
      '1. Happy path = **1 shell** (one `--batch`/single, real args). On ERROR: exactly **1 repair shell** (fix args or introspect listed schema/list tools). Never print null/guessed after error. No openSession/CDC.md/tool listing. recon+compute ≤2 only when recon required.',
      '2. Bridge prints compact JSON (no indent). Print **ONLY** final answer keys once. Never dump raw tool results to chat.',
      '3. Wrong/empty: fix args from Tools below (counts as the 1 repair).',
      '4. **Never cat/sed/rg mcp-call.js** — black-box require only (CLI / `--batch` / `callTool`/`callTools`).',
      'Skill body already loaded — never cat/sed/grep this skill\'s SKILL.md/SKILL.text.md/CDC.md via shell unless told to grep CDC.md for a missing signature.',
      '',
    );
  } else {
    // Fat / paged / multi: primary is openSession+callPaged; --batch only for tiny probes.
    // Keep this template short (~8–12 lines) — full Multi-step stays in CDC.md.
    lines.push(
      '## Call (multi-hop: ONE node script, ONE shell)',
      '',
      '```bash',
      "node - <<'EOF'",
      "const { openSession" + (hasPaging ? ', callPaged' : '') + " } = require('__SKILL_DIR__/mcp-call.js');",
      '(async () => {',
      '  const s = await openSession();',
    );
    if (hasPaging) {
      lines.push(`  const rows = await callPaged(s, '${pageTool}', {}); // ALL pages`);
    }
    lines.push(
      `  const one = await s.call('${exampleTool}', {}); // join/filter in-process`,
      '  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed',
      '  console.log(JSON.stringify(/* answer keys only */));',
      '  s.close();',
      '})();',
      'EOF',
      '```',
      '',
      'Daemon warm. Prefer Tools / Evaluate helpers only — never invent tool names.',
      'CLI stdout is compacted; pass `--raw` before the tool name or with `--batch` for full output.',
      '',
      '## Rules',
      '',
      '1. Multi-hop happy path = **exactly 1 shell**: ONE node script (openSession; all calls; aggregate; print). On ERROR: exactly **1 repair shell** (fix args or introspect listed schema/list tools). Never print null/guessed after error. No multi-run openSession chains.',
      '2. `--batch` only for tiny independent probes. CLI never for bulk lists — rows must not enter chat. recon+compute ≤2 shells only if recon is required; simple multi-call = exactly 1.',
    );
    if (hasPaging) {
      lines.push(`3. Paginate with callPaged(\`${pageTool}\`) — never page 1 only. Prefer list/search tools for callPaged, never patch/update/create.`);
    } else {
      lines.push('3. Aggregate in-process; final line is compact answer JSON only.');
    }
    lines.push(
      '4. Names below; grep one tool in CDC.md only after a failed call (not a free extra shell for multi-hop).',
      '5. When using evaluate_* tools, read returned keys (is_breach / is_breached / breach) from the actual result object — do not invent field names.',
      '6. **Only call tool names listed under Tools / Evaluate helpers — never invent get_* tools.**',
      '7. **If evaluate_* already returns risk fields (mrr, arr, account_id, is_breach), use those — do not invent join tools.**',
      '8. **Never cat/sed/rg/read mcp-call.js source.** Black-box require only. Do not recon the bridge.',
      '9. **This SKILL.md is the hot path** — do not switch to optical images or SKILL.text.md unless SKILL.md is missing.',
      'Skill body already loaded — never cat/sed/grep this skill\'s SKILL.md/SKILL.text.md/CDC.md via shell unless told to grep CDC.md for a missing signature.',
      '',
    );

    // Hot-path evaluate / join helpers so agents use real field names (is_breach etc.)
    const { evaluate, joins } = collectEvaluateHelpers(tools);
    if (evaluate.length || joins.length) {
      lines.push('## Evaluate / join helpers', '');
      for (const t of evaluate) lines.push('- ' + toolLine(t));
      for (const t of joins) lines.push('- ' + toolLine(t));
      lines.push(
        '',
        'Use server field names from tool results (e.g. is_breach, mrr, arr). Do not invent boolean field names.',
        '',
      );
    }
  }

  lines.push(...toolSection, '');

  const skill = lines.join('\n');

  const cdcHeader = [
    `Source: MCP tools/list (${tools.length} tools)`,
    simple
      ? 'Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.'
      : 'Prefer: ONE openSession script that does ALL work then prints ONLY answer keys' +
        (hasPaging ? `; callPaged for ${pageTool}` : '') +
        '. --batch only for tiny independent probes.',
  ];

  if (!simple) {
    cdcHeader.push(
      '',
      '## Multi-step (primary for multi-hop)',
      '',
      '```bash',
      "node - <<'EOF'",
      "const { openSession" + (hasPaging ? ', callPaged' : '') + " } = require('__SKILL_DIR__/mcp-call.js');",
      '(async () => {',
      '  const s = await openSession();',
    );
    if (hasPaging) {
      cdcHeader.push(
        `  const rows = await callPaged(s, '${pageTool}', { /* filters */ }); // ALL pages`,
      );
    }
    cdcHeader.push(
      `  const one = await s.call('${exampleTool}', { /* real args */ });`,
      '  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed',
      '  // Answer helper: print JSON once; never dump tool results to chat.',
      '  console.log(JSON.stringify(/* compact answer only */));',
      '  s.close();',
      '})();',
      'EOF',
      '```',
    );
  }

  const cdc = renderCdcIndex({
    title: `${title} - CDC`,
    tools,
    byTag,
    tags,
    headerLines: cdcHeader,
  });

  return {
    skill,
    cdc,
    mode: 'mcp',
    skillTier: simple ? 'cli' : hasPaging ? 'paged' : 'multi',
    hasPaging,
    indexInlined: inlineIndex,
  };
}

function buildMcpCallHelper({ mcpCommand, mcpArgs, name }) {
  const bakedCmd = mcpCommand ? JSON.stringify(mcpCommand) : 'null';
  const bakedArgs = JSON.stringify(mcpArgs || []);
  return `#!/usr/bin/env node
// mcp-call.js --- stdio MCP bridge for CDC scripts (package: ${name}).
//
// KEY PROPERTIES:
//   1. One Session = ONE server process for any number of tool calls.
//   2. DAEMON (default): the server is kept warm in a detached background
//      process behind a unix socket. Repeat scripts skip cold start entirely
//      and SERVER STATE (browser pages, auth sessions) persists across
//      scripts — essential for stateful MCPs like playwright. Any daemon
//      failure falls back to a direct spawn, never breaks the call.
//
// API:    const { openSession, callTool, callTools } = require('.../mcp-call.js');
//         const s = await openSession(); await s.call(name, args); s.close();
//         (close() detaches; the warm daemon stays for the next script)
// CLI:    node mcp-call.js                        # list tool names
//         node mcp-call.js <tool> '<json-args>'   # single call
//         node mcp-call.js --batch '<json array>' # many calls, one session
//         node mcp-call.js daemon-stop | daemon-status
//         --raw     full uncompacted CLI stdout (before tool name or with --batch)
//         --pretty  or CDC_BRIDGE_PRETTY=1        # indented JSON (debug)
// Env:    CDC_MCP_DAEMON=0 (disable daemon)  CDC_MCP_TIMEOUT_MS
//         CDC_MCP_DAEMON_IDLE_MS (default 600000: daemon exits when idle)
// Note:   CLI stdout is compacted by default; openSession/callTool/callPaged return full values.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');
const crypto = require('crypto');

const CALL_TIMEOUT_MS = parseInt(process.env.CDC_MCP_TIMEOUT_MS || '60000', 10);

function wantPretty(argv) {
  return process.env.CDC_BRIDGE_PRETTY === '1' || argv.includes('--pretty');
}

function wantRaw(argv) {
  return argv.includes('--raw');
}

/** CLI-only compaction. Module API (openSession/callTool/callPaged) stays full. */
function printJson(value, { raw = false, pretty = false } = {}) {
  if (raw) {
    if (typeof value === 'string') {
      console.log(value);
      return;
    }
    console.log(pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value));
    return;
  }
  // compact: no indentation; long arrays and huge strings are truncated
  if (Array.isArray(value) && value.length > 8) {
    for (const item of value.slice(0, 3)) {
      let line = typeof item === 'string' ? item : JSON.stringify(item);
      if (line.length > 2000) line = line.slice(0, 2000) + '... ' + line.length + ' chars — use --raw';
      console.log(line);
    }
    console.log('... ' + value.length + ' items total — aggregate in a script, or use --raw');
    return;
  }
  let s = typeof value === 'string' ? value : JSON.stringify(value);
  if (s.length > 2000) {
    console.log(s.slice(0, 2000) + '... ' + s.length + ' chars — use --raw');
    return;
  }
  console.log(s);
}

function loadManifest() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'mcp-manifest.json'), 'utf8')); }
  catch { return {}; }
}

function resolveServer() {
  const man = loadManifest();
  const command = process.env.CDC_MCP_COMMAND || man.command || ${bakedCmd};
  const args = process.env.CDC_MCP_ARGS
    ? JSON.parse(process.env.CDC_MCP_ARGS)
    : (man.args && man.args.length ? man.args : ${bakedArgs});
  if (!command) {
    throw new Error('Set CDC_MCP_COMMAND or re-run: cdc from-mcp --probe <cmd> --name ${name}');
  }
  return { command, args };
}

function normalizeResult(result) {
  if (result && result.isError) {
    throw new Error((result.content || []).map((c) => c.text || '').join('\\n') || 'tool error');
  }
  if (result && result.structuredContent !== undefined) return result.structuredContent;
  if (result && result.content) {
    const joined = result.content.filter((c) => c.type === 'text').map((c) => c.text).join('\\n');
    try { return JSON.parse(joined); } catch { return joined; }
  }
  return result;
}

class Session {
  constructor(command, args) {
    this.command = command;
    this.args = args;
    this.nextId = 1;
    this.pending = new Map();
    this.buf = '';
    this.stderr = '';
    this.child = null;
    this.closed = false;
  }

  async start() {
    this.child = spawn(this.command, this.args, { stdio: ['pipe', 'pipe', 'pipe'], env: process.env });
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk) => this._onData(chunk));
    this.child.stderr.on('data', (c) => { this.stderr += c; });
    this.child.on('error', (e) => this._failAll(e));
    this.child.on('close', (code) => {
      if (!this.closed && this.pending.size) {
        this._failAll(new Error('MCP server exited ' + code + '. stderr: ' + this.stderr.slice(0, 400)));
      }
    });
    await this._request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'cdc-mcp-call', version: '2.0.0' },
    });
    this._send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    return this;
  }

  _onData(chunk) {
    this.buf += chunk;
    let idx;
    while ((idx = this.buf.indexOf('\\n')) !== -1) {
      const line = this.buf.slice(0, idx).trim();
      this.buf = this.buf.slice(idx + 1);
      if (!line || line.startsWith('Content-Length:')) continue;
      let msg;
      try { msg = JSON.parse(line); } catch {
        const i = line.indexOf('{');
        if (i === -1) continue;
        try { msg = JSON.parse(line.slice(i)); } catch { continue; }
      }
      if (msg.id != null && this.pending.has(msg.id)) {
        const { res, rej, timer } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        clearTimeout(timer);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      }
      // requests/notifications from the server (logging, pings) are ignored
    }
  }

  _failAll(err) {
    for (const { rej, timer } of this.pending.values()) {
      clearTimeout(timer);
      rej(err);
    }
    this.pending.clear();
  }

  _send(msg) {
    this.child.stdin.write(JSON.stringify(msg) + '\\n');
  }

  _request(method, params, timeoutMs = CALL_TIMEOUT_MS) {
    return new Promise((res, rej) => {
      const id = this.nextId++;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        rej(new Error(method + ' timed out after ' + timeoutMs + 'ms. stderr: ' + this.stderr.slice(0, 300)));
      }, timeoutMs);
      this.pending.set(id, { res, rej, timer });
      this._send({ jsonrpc: '2.0', id, method, params });
    });
  }

  async call(name, args = {}) {
    const result = await this._request('tools/call', { name, arguments: args });
    return normalizeResult(result);
  }

  async list() {
    const result = await this._request('tools/list', {});
    return result.tools || [];
  }

  close() {
    this.closed = true;
    try { this.child.stdin.end(); } catch {}
    const child = this.child;
    setTimeout(() => { try { child.kill('SIGTERM'); } catch {} }, 50).unref?.();
  }
}

// ---------- daemon: warm server + cross-script state behind a unix socket ----------

function socketPath() {
  const { command, args } = resolveServer();
  const h = crypto.createHash('sha1').update([command, ...args].join('\\u0000')).digest('hex').slice(0, 10);
  return path.join(os.tmpdir(), 'cdc-${name}-' + h + '.sock');
}

function tryConnect(sock, timeoutMs = 300) {
  return new Promise((resolve) => {
    const conn = net.createConnection(sock);
    const timer = setTimeout(() => { conn.destroy(); resolve(null); }, timeoutMs);
    conn.once('connect', () => { clearTimeout(timer); resolve(conn); });
    conn.once('error', () => { clearTimeout(timer); resolve(null); });
  });
}

/** Socket-backed session: same interface as Session; close() leaves the daemon warm. */
function socketSession(conn) {
  let buf = '', nextId = 1;
  const pending = new Map();
  conn.setEncoding('utf8');
  conn.on('data', (chunk) => {
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf('\\n')) !== -1) {
      const line = buf.slice(0, idx); buf = buf.slice(idx + 1);
      if (!line.trim()) continue;
      let msg; try { msg = JSON.parse(line); } catch { continue; }
      const p = pending.get(msg.id);
      if (!p) continue;
      pending.delete(msg.id);
      clearTimeout(p.timer);
      msg.ok ? p.res(msg.result) : p.rej(new Error(msg.error));
    }
  });
  conn.on('close', () => {
    for (const { rej, timer } of pending.values()) { clearTimeout(timer); rej(new Error('daemon connection closed')); }
    pending.clear();
  });
  const request = (payload) => new Promise((res, rej) => {
    const id = nextId++;
    const timer = setTimeout(() => { pending.delete(id); rej(new Error('daemon call timed out')); }, CALL_TIMEOUT_MS);
    pending.set(id, { res, rej, timer });
    conn.write(JSON.stringify({ id, ...payload }) + '\\n');
  });
  return {
    call: (name, args = {}) => request({ method: 'call', tool: name, args }),
    list: () => request({ method: 'list' }),
    stop: () => request({ method: 'stop' }),
    close: () => { try { conn.end(); } catch {} },
    viaDaemon: true,
  };
}

async function runDaemon() {
  const { command, args } = resolveServer();
  const session = await new Session(command, args).start();
  const sock = socketPath();
  try { fs.unlinkSync(sock); } catch {}
  const idleMs = parseInt(process.env.CDC_MCP_DAEMON_IDLE_MS || '600000', 10);
  let idleTimer;
  const bumpIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { try { session.close(); } catch {} process.exit(0); }, idleMs);
  };
  bumpIdle();
  const server = net.createServer((conn) => {
    let buf = '';
    conn.setEncoding('utf8');
    conn.on('data', (chunk) => {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf('\\n')) !== -1) {
        const line = buf.slice(0, idx); buf = buf.slice(idx + 1);
        if (!line.trim()) continue;
        bumpIdle();
        let req; try { req = JSON.parse(line); } catch { continue; }
        (async () => {
          try {
            if (req.method === 'stop') {
              conn.write(JSON.stringify({ id: req.id, ok: true, result: 'stopping' }) + '\\n');
              try { session.close(); } catch {}
              server.close();
              setTimeout(() => process.exit(0), 100);
              return;
            }
            const result = req.method === 'list'
              ? await session.list()
              : await session.call(req.tool, req.args || {});
            conn.write(JSON.stringify({ id: req.id, ok: true, result }) + '\\n');
          } catch (e) {
            try { conn.write(JSON.stringify({ id: req.id, ok: false, error: String(e.message || e) }) + '\\n'); } catch {}
          }
        })();
      }
    });
    conn.on('error', () => {});
  });
  server.listen(sock);
}

async function openSession() {
  if (process.env.CDC_MCP_DAEMON === '0') {
    const { command, args } = resolveServer();
    return new Session(command, args).start();
  }
  const sock = socketPath();
  let conn = await tryConnect(sock);
  if (!conn) {
    const child = spawn(process.execPath, [__filename, '__daemon__'], {
      detached: true,
      stdio: 'ignore',
      env: process.env,
    });
    child.unref();
    // server cold start (npx resolve + init) can take a while the first time
    for (let i = 0; i < 60 && !conn; i++) {
      await new Promise((r) => setTimeout(r, 250));
      conn = await tryConnect(sock);
    }
  }
  if (conn) return socketSession(conn);
  // daemon unavailable for any reason: degrade gracefully to direct spawn
  const { command, args } = resolveServer();
  return new Session(command, args).start();
}

/** One-shot convenience. For MULTIPLE calls use openSession() or callTools(). */
async function callTool(name, args = {}) {
  const s = await openSession();
  try { return await s.call(name, args); }
  finally { s.close(); }
}

/** Run many calls over a single session. calls: [{ tool, args }]
 *  Models often write MCP-style {"arguments":{...}} — accept the aliases
 *  instead of silently calling with {} (a live thrash cause). */
async function callTools(calls) {
  const s = await openSession();
  try {
    const out = [];
    for (const c of calls) out.push(await s.call(c.tool || c.name, c.args || c.arguments || c.input || {}));
    return out;
  } finally { s.close(); }
}

/** Fetch ALL pages of a list-style tool.
 *  Supports page-number APIs and cursor APIs (next_cursor -> start_cursor, e.g. Notion search).
 *  Does NOT inject page=1 on the first call — some APIs reject unknown page fields.
 *  Fetching only page 1 of a paginated tool was a live A/B failure mode. */
async function callPaged(session, tool, args = {}, opts = {}) {
  const maxPages = opts.maxPages || 500;
  const pageParam = opts.pageParam || 'page';
  const cursorIn = opts.cursorParam || 'start_cursor';
  const out = [];
  let cursor = args[cursorIn] || args.cursor || null;
  let page = args[pageParam] != null ? Number(args[pageParam]) : null;
  let mode = opts.mode || null; // 'page' | 'cursor' | null (auto)
  let prevFirst;

  for (let i = 0; i < maxPages; i++) {
    const callArgs = Object.assign({}, args);
    // strip pagination knobs; re-add only what this mode needs
    delete callArgs[pageParam];
    delete callArgs.page;
    delete callArgs.start_cursor;
    delete callArgs.cursor;

    if (mode === 'cursor' || (cursor && mode !== 'page')) {
      callArgs[cursorIn] = cursor;
      mode = 'cursor';
    } else if (mode === 'page' || page != null) {
      callArgs[pageParam] = page != null ? page : 1;
      mode = 'page';
    }
    // else: first call with bare args (no injected page) — required for Notion-style search

    let res = await session.call(tool, callArgs);

    // If we injected page and the API rejects it, retry once without page (cursor/raw path).
    if (
      res &&
      res.object === 'error' &&
      mode === 'page' &&
      i === 0 &&
      /page should be not present|unknown.*page|validation/i.test(String(res.message || res.code || ''))
    ) {
      mode = null;
      page = null;
      const bare = Object.assign({}, args);
      delete bare[pageParam];
      delete bare.page;
      res = await session.call(tool, bare);
    }

    const arr = Array.isArray(res) ? res
      : res && Array.isArray(res.data) ? res.data
      : res && Array.isArray(res.items) ? res.items
      : res && Array.isArray(res.results) ? res.results
      : null;
    if (!arr) return i === 0 ? res : out; // not a paginated list shape
    if (arr.length === 0) break;
    const first = JSON.stringify(arr[0]);
    if (first === prevFirst) break; // same page again: server ignored the page param
    prevFirst = first;
    out.push(...arr);

    // Cursor-style (Notion search / many Graph APIs)
    if (res && !Array.isArray(res) && res.next_cursor) {
      cursor = res.next_cursor;
      mode = 'cursor';
      continue;
    }
    if (res && !Array.isArray(res) && res.has_more === false) break;

    // Page-number style
    const total = res && !Array.isArray(res)
      ? (res.total_pages != null ? res.total_pages : res.totalPages)
      : null;
    if (total != null) {
      mode = 'page';
      page = (page != null ? page : 1) + 1;
      if (page > Number(total)) break;
      continue;
    }

    // If first call had no pagination hints and returned a batch, stop (single page).
    if (!mode && !(res && res.has_more)) break;

    // Ambiguous has_more without cursor: try page numbers next
    if (res && res.has_more) {
      mode = 'page';
      page = (page != null ? page : 1) + 1;
      continue;
    }
    break;
  }
  return out;
}

module.exports = { openSession, callTool, callTools, callPaged, Session };

if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    const raw = wantRaw(argv);
    const pretty = wantPretty(argv);
    const args = argv.filter((a) => a !== '--raw' && a !== '--pretty');
    try {
      if (args[0] === '__daemon__') {
        await runDaemon();
      } else if (args[0] === 'daemon-start') {
        const s = await openSession(); // spawns the daemon if not running
        const warm = s.viaDaemon === true;
        s.close();
        console.log(warm ? 'daemon warm: ' + socketPath() : 'daemon unavailable (ran direct)');
      } else if (args[0] === 'daemon-stop') {
        const conn = await tryConnect(socketPath());
        if (!conn) { console.log('no daemon running'); return; }
        const s = socketSession(conn);
        await s.stop().catch(() => {});
        s.close();
        console.log('daemon stopped');
      } else if (args[0] === 'daemon-status') {
        const conn = await tryConnect(socketPath());
        if (!conn) { console.log('no daemon running'); return; }
        conn.end();
        console.log('daemon running: ' + socketPath());
      } else if (!args.length) {
        const s = await openSession();
        const tools = await s.list();
        s.close();
        printJson(tools.map((t) => t.name), { raw, pretty });
      } else if (args[0] === '--batch') {
        // Partial results: one bad call must not discard the rest (module callTools unchanged).
        const calls = JSON.parse(args[1] || '[]');
        const s = await openSession();
        const results = [];
        let anyOk = false;
        try {
          for (const c of calls) {
            const tool = c.tool || c.name;
            try {
              results.push(await s.call(tool, c.args || c.arguments || c.input || {}));
              anyOk = true;
            } catch (e) {
              results.push({ ok: false, tool, error: String(e.message || e).slice(0, 200) });
            }
          }
        } finally { s.close(); }
        printJson(results, { raw, pretty });
        if (calls.length && !anyOk) process.exit(1);
      } else {
        const r = await callTool(args[0], args[1] ? JSON.parse(args[1]) : {});
        printJson(typeof r === 'string' ? r : r, { raw, pretty });
      }
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  })();
}
`;
}

/**
 * Compile any MCP tools dump into a CDC skill package.
 * Mode selection is automatic and general - not example-specific.
 */
function compileMCP({
  tools: toolsInput,
  name,
  outRoot = 'cdc',
  title,
  httpBase,
  mcpCommand,
  mcpArgs = [],
  imageMode, // 'auto' | 'text' | 'image' — env fallbacks in resolveImageMode
} = {}) {
  if (!name) throw new Error('compileMCP requires { name }');

  let raw;
  if (typeof toolsInput === 'string') {
    raw = toolsInput;
    toolsInput = JSON.parse(toolsInput);
  } else {
    raw = JSON.stringify(toolsInput, null, 2);
  }

  const tools = normalizeTools(toolsInput);
  if (!tools.length) throw new Error('No tools found in MCP dump');
  for (const t of tools) {
    if (!t?.name) throw new Error('Tool missing name: ' + JSON.stringify(t).slice(0, 120));
  }

  const displayTitle = title || name;
  const envVar = envVarName(name);
  const { isFs, root: detectedRoot } = detectFilesystemRoot(
    mcpCommand,
    mcpArgs,
    name,
    tools,
  );

  let skill;
  let cdc;
  let mode;
  let rootOut = null;
  let skillTier = null;
  let indexInlined = false;

  if (httpBase) {
    ({ skill, cdc, mode } = buildHttpPackage({
      name,
      title: displayTitle,
      httpBase,
      envVar,
      tools,
    }));
  } else if (isFs) {
    // Build-time layout snapshot: removes the recon turn at use time and
    // bakes in the field names / enum values / duplicate-shard warnings that
    // agents otherwise guess at (and get wrong).
    const snapshot = detectedRoot && fs.existsSync(detectedRoot) ? snapshotFs(detectedRoot) : null;
    ({ skill, cdc, mode, root: rootOut } = buildDirectFsPackage({
      name,
      root: detectedRoot,
      tools,
      snapshot,
    }));
    skillTier = 'direct-fs';
  } else {
    const bridge = buildMcpBridgePackage({
      name,
      title: displayTitle,
      tools,
    });
    skill = bridge.skill;
    cdc = bridge.cdc;
    mode = bridge.mode;
    skillTier = bridge.skillTier || 'multi';
    indexInlined = !!bridge.indexInlined;
  }

  const outDir = path.join(outRoot, name);

  const sourceTokens = estimateTokens(raw);
  const stats = {
    name,
    title: displayTitle,
    source: 'mcp',
    mode,
    skillTier: skillTier || mode,
    tools: tools.length,
    endpoints: tools.length,
    sourceBytes: Buffer.byteLength(raw),
    sourceTokens,
    mcpSchemaTokens: sourceTokens,
    cdcBytes: Buffer.byteLength(cdc),
    cdcTokens: estimateTokens(cdc),
    skillBytes: Buffer.byteLength(skill),
    skillTokens: estimateTokens(skill),
    generatedAt: new Date().toISOString(),
  };
  if (rootOut) stats.fsRoot = rootOut;
  // Hot-path telemetry for harness/product inject gating
  stats.indexInlined = !!indexInlined;
  stats.hotSkillTokens = stats.skillTokens;
  stats.compressionSourceToCdc = +(stats.sourceTokens / Math.max(1, stats.cdcTokens)).toFixed(1);
  stats.compressionSourceToSkill = +(stats.sourceTokens / Math.max(1, stats.skillTokens)).toFixed(1);
  stats.definitionTaxMcp = stats.mcpSchemaTokens;
  stats.definitionTaxCdc = stats.skillTokens;
  stats.definitionSavingsRatio = +(stats.definitionTaxMcp / Math.max(1, stats.definitionTaxCdc)).toFixed(1);


  writePackage(outDir, { cdc, skill, stats });

  // Optical skill (.cdc): auto-routed (lib/optical-pack.js). Bridge/http
  // surfaces only — direct-fs skills carry data snapshots that optical
  // packing can't represent, and their image arm scored 0 in mega40.
  if (mode === 'mcp' || mode === 'http') {
    try {
      const img = writeImageSkill(outDir, {
        name,
        title: displayTitle,
        skill,
        cdc,
        tools,
        mode: imageMode,
        indexInlined: !!indexInlined,
      });
      if (img) {
        stats.skillMode = img.skillMode;
        stats.skillModeReason = img.skillModeReason;
        stats.imagePrimary = !!img.imagePrimary;
        stats.imagePages = img.pages || 0;
        stats.imageEstVisionTokens = img.estVisionTokens;
        stats.imageTextEquivalentTokens = img.textEquivalentTokens;
        if (img.tiles != null) {
          stats.optical = {
            pages: img.pages, tiles: img.tiles, scale: img.scale, width: img.width,
            estVisionTokens: img.estVisionTokens, budgetMet: img.budgetMet,
          };
        }
        fs.writeFileSync(path.join(outDir, 'stats.json'), JSON.stringify(stats, null, 2));
      }
    } catch (e) {
      // non-fatal: text skill still valid
      stats.imageError = String(e.message || e);
    }
  } else {
    stats.skillMode = 'text';
    stats.skillModeReason = 'direct-fs data skill: optical n/a (snapshot + q.js are the skill body)';
    fs.writeFileSync(path.join(outDir, 'stats.json'), JSON.stringify(stats, null, 2));
  }


  if (mode === 'mcp') {
    fs.writeFileSync(
      path.join(outDir, 'mcp-call.js'),
      buildMcpCallHelper({ mcpCommand, mcpArgs, name }),
    );
    fs.writeFileSync(
      path.join(outDir, 'mcp-manifest.json'),
      JSON.stringify(
        {
          name,
          mode: 'mcp',
          command: mcpCommand || null,
          args: mcpArgs,
          envToken: envVar,
          tools: tools.length,
          note: 'Prefer an installed binary over npx -y to avoid network cold starts.',
        },
        null,
        2,
      ),
    );
  } else if (mode === 'direct-fs') {
    // No mcp-call.js - agents must use Node fs, not re-enter MCP.
    // Ship the query kit + live-recon tool instead.
    fs.writeFileSync(path.join(outDir, 'q.js'), buildQjs(detectedRoot));
    fs.copyFileSync(require.resolve('./fs-snapshot'), path.join(outDir, 'snapshot.js'));
    fs.writeFileSync(
      path.join(outDir, 'mcp-manifest.json'),
      JSON.stringify(
        {
          name,
          mode: 'direct-fs',
          root: detectedRoot,
          tools: tools.length,
          note: 'Use Node fs under root. Do not spawn MCP for normal queries.',
        },
        null,
        2,
      ),
    );
  }

  return { outDir, stats };
}

async function probeMcpServer(command, args = [], { timeoutMs = 15000 } = {}) {
  const { spawn } = require('child_process');
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let buf = '';
    let stderr = '';
    let nextId = 1;
    const pending = new Map();
    const timer = setTimeout(() => {
      try { child.kill('SIGTERM'); } catch {}
      reject(new Error(`MCP probe timed out after ${timeoutMs}ms. stderr: ${stderr.slice(0, 400)}`));
    }, timeoutMs);

    const send = (msg) => child.stdin.write(JSON.stringify(msg) + '\n');
    const request = (method, params) =>
      new Promise((res, rej) => {
        const id = nextId++;
        pending.set(id, { res, rej });
        send({ jsonrpc: '2.0', id, method, params });
      });

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line || line.startsWith('Content-Length:')) continue;
        let msg;
        try { msg = JSON.parse(line); } catch {
          const i = line.indexOf('{');
          if (i === -1) continue;
          try { msg = JSON.parse(line.slice(i)); } catch { continue; }
        }
        if (msg.id != null && pending.has(msg.id)) {
          const { res, rej } = pending.get(msg.id);
          pending.delete(msg.id);
          if (msg.error) rej(new Error(JSON.stringify(msg.error)));
          else res(msg.result);
        }
      }
    });
    child.stderr.on('data', (c) => { stderr += c; });
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });

    (async () => {
      try {
        await request('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'cdc-probe', version: '1.0.0' },
        });
        send({ jsonrpc: '2.0', method: 'notifications/initialized' });
        const result = await request('tools/list', {});
        clearTimeout(timer);
        try { child.kill('SIGTERM'); } catch {}
        resolve(result.tools || []);
      } catch (e) {
        clearTimeout(timer);
        try { child.kill('SIGTERM'); } catch {}
        reject(new Error(`${e.message}${stderr ? '\nstderr: ' + stderr.slice(0, 400) : ''}`));
      }
    })();
  });
}

module.exports = {
  compileMCP,
  normalizeTools,
  probeMcpServer,
  tagOf,
  toolLine,
  descOf,
  detectFilesystemRoot,
  toolLooksPaginated,
  firstPaginatedToolName,
  isWriteMutateTool,
  collectEvaluateHelpers,
};


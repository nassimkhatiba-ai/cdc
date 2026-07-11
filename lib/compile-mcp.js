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
const { paramsOf, envVarName, writePackage } = require('./schema-util');
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
        'If reality differs from this snapshot: `node __SKILL_DIR__/q.js recon`.',
      ]
    : [
        'No layout snapshot (root unavailable at build time). First run:',
        '`node __SKILL_DIR__/q.js recon` (bounded output), then ONE compute script.',
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
    '1. Trust the layout snapshot — ONE compute script, no recon run.',
    '2. NEVER aggregate overlapping sources (full file + its numbered shards); the snapshot marks duplicates.',
    '3. Empty/zero metric = bug: q.assertNonEmpty it, re-check snapshot field names/enum values.',
    '4. Stay under Root. Print ONLY final compact JSON. Max 2 runs.',
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
    `ONE Node script with fetch. Auth from env $${envVar} if needed — never hardcode secrets.`,
    '',
    'Rules:',
    disciplineRules([
      'Fetch only what you need; paginate where offered; do ALL filtering/aggregation in the script.',
    ]),
    '',
    'Endpoint/tool signatures: grep CDC.md — do not load the whole file.',
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
 */
function buildMcpBridgePackage({ name, title, tools }) {
  const { byTag, tags } = groupTools(tools);
  const firstTag = tags[0] || 'misc';
  const tagDir = tags.map((t) => `- ${t} (${byTag.get(t).length})`).join('\n');

  // Small/medium servers: inline the full signature index in SKILL.md.
  // Grep-into-CDC.md indirection saved tokens on 1000-endpoint APIs but COST
  // whole turns on a 24-tool server (see playwright A/B) — a few hundred
  // inline tokens are cheaper than one grep round trip.
  const indexBody = tags
    .map((t) => `### ${t}\n` + byTag.get(t).join('\n'))
    .join('\n');
  // Threshold calibrated from the playwright A/B: one grep round trip costs
  // more input tokens than a ~1k inline index, and inline can't thrash.
  const inlineIndex = estimateTokens(indexBody) <= 1000;

  const toolSection = inlineIndex
    ? ['## Tools', '', indexBody]
    : [
        'Tool signatures: grep CDC.md — do not read the whole file:',
        `\`grep -A 20 "^## ${firstTag}" __SKILL_DIR__/CDC.md\``,
        '',
        'Groups:',
        tagDir,
      ];

  const skill = [
    '---',
    `name: ${name}-cdc`,
    `description: Call ${title} via short Node scripts (CDC). Compact tool index; no full MCP schemas in context. Use for ${name}.`,
    '---',
    '',
    `# ${title}`,
    '',
    'Plain calls need NO script: `node __SKILL_DIR__/mcp-call.js <tool> \'<json-args>\'` · batch: `--batch \'[{"tool":"t","args":{}},...]\'`',
    '',
    'Multi-step / aggregation — ONE inline script (bash heredoc, never a script file):',
    '',
    '```bash',
    "node - <<'EOF'",
    "const { openSession, callPaged } = require('__SKILL_DIR__/mcp-call.js');",
    '(async () => {',
    '  const s = await openSession();',
    "  const rows = await callPaged(s, 'list_tool', { /* filters */ }); // fetches ALL pages",
    "  const one = await s.call('tool_name', { /* args */ });",
    '  console.log(JSON.stringify(answer)); // aggregate in code first',
    '  s.close();',
    '})();',
    'EOF',
    '```',
    '',
    'A background daemon keeps the server warm: repeat calls skip cold start and server STATE (browser pages, auth sessions) persists across scripts. `daemon-stop` ends it; env `CDC_MCP_DAEMON=0` disables.',
    '',
    'Rules:',
    '1. ONE session per script — never one per call.',
    '2. List tools paginate — use callPaged, never just page 1. Aggregate in code; print ONLY the final compact JSON in the EXACT requested shape.',
    '3. Tool prose is not an answer — extract the value. Named resource (id, owner/name)? Direct lookup, never global search.',
    '4. Empty/zero/implausible result = bug: re-check args against the signatures. Max 2 runs.',
    '',
    ...toolSection,
    '',
  ].join('\n');

  const cdc = renderCdcIndex({
    title: `${title} - CDC`,
    tools,
    byTag,
    tags,
    headerLines: [
      `Source: MCP tools/list (${tools.length} tools)`,
      'Use mcp-call.js openSession() from a script; print answer only.',
    ],
  });

  return { skill, cdc, mode: 'mcp' };
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
// Env:    CDC_MCP_DAEMON=0 (disable daemon)  CDC_MCP_TIMEOUT_MS
//         CDC_MCP_DAEMON_IDLE_MS (default 600000: daemon exits when idle)
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');
const crypto = require('crypto');

const CALL_TIMEOUT_MS = parseInt(process.env.CDC_MCP_TIMEOUT_MS || '60000', 10);

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

/** Run many calls over a single session. calls: [{ tool, args }] */
async function callTools(calls) {
  const s = await openSession();
  try {
    const out = [];
    for (const c of calls) out.push(await s.call(c.tool || c.name, c.args || {}));
    return out;
  } finally { s.close(); }
}

/** Fetch ALL pages of a list-style tool. Handles bare arrays and
 *  {data|items|results:[...]} wrappers with total_pages; stops on empty page,
 *  duplicate page (server ignored the page param), or maxPages.
 *  Fetching only page 1 of a paginated tool was a live A/B failure mode. */
async function callPaged(session, tool, args = {}, opts = {}) {
  const pageParam = opts.pageParam || 'page';
  const maxPages = opts.maxPages || 500;
  const out = [];
  let page = Number(args[pageParam] || 1);
  let prevFirst;
  for (let i = 0; i < maxPages; i++) {
    const res = await session.call(tool, Object.assign({}, args, { [pageParam]: page }));
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
    const total = res && !Array.isArray(res) ? (res.total_pages != null ? res.total_pages : res.totalPages) : null;
    if (total != null && page >= Number(total)) break;
    page += 1;
  }
  return out;
}

module.exports = { openSession, callTool, callTools, callPaged, Session };

if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    try {
      if (argv[0] === '__daemon__') {
        await runDaemon();
      } else if (argv[0] === 'daemon-start') {
        const s = await openSession(); // spawns the daemon if not running
        const warm = s.viaDaemon === true;
        s.close();
        console.log(warm ? 'daemon warm: ' + socketPath() : 'daemon unavailable (ran direct)');
      } else if (argv[0] === 'daemon-stop') {
        const conn = await tryConnect(socketPath());
        if (!conn) { console.log('no daemon running'); return; }
        const s = socketSession(conn);
        await s.stop().catch(() => {});
        s.close();
        console.log('daemon stopped');
      } else if (argv[0] === 'daemon-status') {
        const conn = await tryConnect(socketPath());
        if (!conn) { console.log('no daemon running'); return; }
        conn.end();
        console.log('daemon running: ' + socketPath());
      } else if (!argv.length) {
        const s = await openSession();
        const tools = await s.list();
        s.close();
        console.log(JSON.stringify(tools.map((t) => t.name), null, 2));
      } else if (argv[0] === '--batch') {
        const calls = JSON.parse(argv[1] || '[]');
        const results = await callTools(calls);
        console.log(JSON.stringify(results, null, 2));
      } else {
        const r = await callTool(argv[0], argv[1] ? JSON.parse(argv[1]) : {});
        console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 2));
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
  } else {
    ({ skill, cdc, mode } = buildMcpBridgePackage({
      name,
      title: displayTitle,
      tools,
    }));
  }

  const outDir = path.join(outRoot, name);

  const sourceTokens = estimateTokens(raw);
  const stats = {
    name,
    title: displayTitle,
    source: 'mcp',
    mode,
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
  stats.compressionSourceToCdc = +(stats.sourceTokens / Math.max(1, stats.cdcTokens)).toFixed(1);
  stats.compressionSourceToSkill = +(stats.sourceTokens / Math.max(1, stats.skillTokens)).toFixed(1);
  stats.definitionTaxMcp = stats.mcpSchemaTokens;
  stats.definitionTaxCdc = stats.skillTokens;
  stats.definitionSavingsRatio = +(stats.definitionTaxMcp / Math.max(1, stats.definitionTaxCdc)).toFixed(1);

  writePackage(outDir, { cdc, skill, stats });

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
};

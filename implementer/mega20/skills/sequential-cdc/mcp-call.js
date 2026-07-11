#!/usr/bin/env node
// mcp-call.js --- stdio MCP bridge for CDC scripts (package: sequential).
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
  const command = process.env.CDC_MCP_COMMAND || man.command || "/Users/nesbes/mcp-a;t/implementer/mega20/homes/sequential/sequential-mcp.sh";
  const args = process.env.CDC_MCP_ARGS
    ? JSON.parse(process.env.CDC_MCP_ARGS)
    : (man.args && man.args.length ? man.args : []);
  if (!command) {
    throw new Error('Set CDC_MCP_COMMAND or re-run: cdc from-mcp --probe <cmd> --name sequential');
  }
  return { command, args };
}

function normalizeResult(result) {
  if (result && result.isError) {
    throw new Error((result.content || []).map((c) => c.text || '').join('\n') || 'tool error');
  }
  if (result && result.structuredContent !== undefined) return result.structuredContent;
  if (result && result.content) {
    const joined = result.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
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
    while ((idx = this.buf.indexOf('\n')) !== -1) {
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
    this.child.stdin.write(JSON.stringify(msg) + '\n');
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
  const h = crypto.createHash('sha1').update([command, ...args].join('\u0000')).digest('hex').slice(0, 10);
  return path.join(os.tmpdir(), 'cdc-sequential-' + h + '.sock');
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
    while ((idx = buf.indexOf('\n')) !== -1) {
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
    conn.write(JSON.stringify({ id, ...payload }) + '\n');
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
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx); buf = buf.slice(idx + 1);
        if (!line.trim()) continue;
        bumpIdle();
        let req; try { req = JSON.parse(line); } catch { continue; }
        (async () => {
          try {
            if (req.method === 'stop') {
              conn.write(JSON.stringify({ id: req.id, ok: true, result: 'stopping' }) + '\n');
              try { session.close(); } catch {}
              server.close();
              setTimeout(() => process.exit(0), 100);
              return;
            }
            const result = req.method === 'list'
              ? await session.list()
              : await session.call(req.tool, req.args || {});
            conn.write(JSON.stringify({ id: req.id, ok: true, result }) + '\n');
          } catch (e) {
            try { conn.write(JSON.stringify({ id: req.id, ok: false, error: String(e.message || e) }) + '\n'); } catch {}
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

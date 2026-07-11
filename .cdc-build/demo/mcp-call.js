#!/usr/bin/env node
// mcp-call.js --- stdio MCP bridge for CDC scripts (package: demo).
//
// KEY PROPERTY: one Session = ONE server process for any number of tool calls.
// Never open a session per call — server cold start (especially `npx -y`)
// costs seconds each and was the dominant CDC latency cost before this design.
//
// API:    const { openSession, callTool, callTools } = require('.../mcp-call.js');
//         const s = await openSession(); await s.call(name, args); s.close();
// CLI:    node mcp-call.js                        # list tool names
//         node mcp-call.js <tool> '<json-args>'   # single call
//         node mcp-call.js --batch '<json array>' # many calls, one session
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CALL_TIMEOUT_MS = parseInt(process.env.CDC_MCP_TIMEOUT_MS || '60000', 10);

function loadManifest() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'mcp-manifest.json'), 'utf8')); }
  catch { return {}; }
}

function resolveServer() {
  const man = loadManifest();
  const command = process.env.CDC_MCP_COMMAND || man.command || null;
  const args = process.env.CDC_MCP_ARGS
    ? JSON.parse(process.env.CDC_MCP_ARGS)
    : (man.args && man.args.length ? man.args : []);
  if (!command) {
    throw new Error('Set CDC_MCP_COMMAND or re-run: cdc from-mcp --probe <cmd> --name demo');
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

async function openSession() {
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

module.exports = { openSession, callTool, callTools, Session };

if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    try {
      if (!argv.length) {
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

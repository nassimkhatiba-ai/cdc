#!/usr/bin/env node
// mcp-call.js --- stdio MCP client for CDC scripts (package: demo).
// Prefer a permanently installed server binary over `npx -y` (avoids network cold start).
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function rpc(command, args, method, params = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], env: process.env });
    let buf = '', stderr = '', nextId = 1;
    const pending = new Map();
    const send = (msg) => child.stdin.write(JSON.stringify(msg) + '\n');
    const request = (meth, pars) => new Promise((res, rej) => {
      const id = nextId++;
      pending.set(id, { res, rej });
      send({ jsonrpc: '2.0', id, method: meth, params: pars });
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
    child.on('error', reject);
    child.on('close', (code) => {
      if (pending.size) reject(new Error('MCP server exited ' + code + '. stderr: ' + stderr.slice(0, 400)));
    });
    (async () => {
      try {
        await request('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'cdc-mcp-call', version: '1.0.0' },
        });
        send({ jsonrpc: '2.0', method: 'notifications/initialized' });
        const result = await request(method, params);
        child.stdin.end();
        setTimeout(() => { try { child.kill('SIGTERM'); } catch {} }, 50);
        resolve(result);
      } catch (e) {
        try { child.kill('SIGTERM'); } catch {}
        reject(e);
      }
    })();
  });
}

async function listTools() {
  const { command, args } = resolveServer();
  const result = await rpc(command, args, 'tools/list', {});
  return result.tools || [];
}

async function callTool(name, args = {}) {
  const { command, args: serverArgs } = resolveServer();
  const result = await rpc(command, serverArgs, 'tools/call', { name, arguments: args });
  if (result && result.isError) {
    throw new Error((result.content || []).map((c) => c.text || '').join('\n') || 'tool error');
  }
  if (result && result.content) {
    const joined = result.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
    try { return JSON.parse(joined); } catch { return joined; }
  }
  return result;
}

module.exports = { callTool, listTools };

if (require.main === module) {
  const [toolName, argsJson] = process.argv.slice(2);
  if (!toolName) {
    listTools()
      .then((tools) => console.log(JSON.stringify(tools.map((t) => t.name), null, 2)))
      .catch((e) => { console.error(e.message); process.exit(1); });
  } else {
    callTool(toolName, argsJson ? JSON.parse(argsJson) : {})
      .then((r) => console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 2)))
      .catch((e) => { console.error(e.message); process.exit(1); });
  }
}

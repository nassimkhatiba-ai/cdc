// Compile MCP tool definitions into a CDC package.
//
// Input: tools/list dump (JSON array of tools, or { tools: [...] }, or
// full JSON-RPC result). Each tool:
//   { name, description?, inputSchema? | input_schema? }
//
// Output: SKILL.md + CDC.md + stats.json (+ mcp-call.js helper in MCP mode).
const { estimateTokens } = require('./tokens');
const { paramsOf, envVarName, writePackage } = require('./schema-util');

/**
 * Normalize various MCP tool dump shapes into a flat tools array.
 */
function normalizeTools(input) {
  if (!input) throw new Error('empty MCP tools input');
  if (Array.isArray(input)) return input;
  if (Array.isArray(input.tools)) return input.tools;
  if (Array.isArray(input.result?.tools)) return input.result.tools;
  if (input.name && (input.inputSchema || input.input_schema || input.description)) {
    return [input];
  }
  throw new Error(
    'Unrecognized MCP tools format. Expected an array of tools, or { tools: [...] }.\n' +
      'Dump tools with: cdc from-mcp --probe <command>  or paste a tools/list JSON.',
  );
}

/** Group tool names by first underscore/dot segment, else "misc". */
function tagOf(toolName) {
  const m = String(toolName).match(/^([a-zA-Z][a-zA-Z0-9]*)[_.]/);
  if (m) return m[1];
  const c = String(toolName).match(/^([a-z]+)(?=[A-Z])/);
  if (c && c[1].length >= 3) return c[1];
  return 'misc';
}

function toolLine(tool) {
  const schema = tool.inputSchema || tool.input_schema || { type: 'object', properties: {} };
  const params = paramsOf(schema);
  const paramStr = params.length ? '(' + params.join(', ') + ')' : '()';
  const desc = (tool.description || '').replace(/\s+/g, ' ').trim();
  const short = desc.length > 120 ? desc.slice(0, 117) + '...' : desc;
  return `${tool.name}${paramStr}${short ? ' — ' + short : ''}`;
}

function mcpScriptRules({ envVar, mode, httpBase }) {
  if (mode === 'http') {
    return `## How to call this API (CDC pattern)

This package was converted from an MCP server. Prefer **direct HTTP** when
possible (base URL below). Write ONE Node.js (18+) script per question.

Base URL: ${httpBase}

Rules:
1. Auth: send credentials from env \`$${envVar}\` (never hardcode).
2. Fetch only what you need; paginate in the script.
3. Do ALL filtering/aggregation/arithmetic IN THE SCRIPT — never in your head.
4. Print ONLY the final answer to stdout. Raw payloads never enter conversation.
5. On HTTP errors, print status + first 200 chars of body and stop.`;
  }

  return `## How to call these tools (CDC pattern)

This package was converted from an MCP server. Instead of loading every tool
schema into context and piping results through the model, write ONE Node.js
script that calls only the tools you need, filters/aggregates in-process, and
prints the final answer.

### Calling a tool from a script

A helper \`mcp-call.js\` ships next to this skill. From a script:

\`\`\`js
const { callTool } = require('./mcp-call.js');

const result = await callTool('tool_name', { arg: 'value' });
// result is already-parsed JSON (or text). Aggregate here, then:
console.log(JSON.stringify(answer));
\`\`\`

Rules:
1. Credentials live in the MCP server process / env — never hardcode secrets.
2. Call only the tools you need. Prefer bulk/list tools over N× get-one loops
   when available; still do aggregation IN THE SCRIPT.
3. Print ONLY the final answer to stdout. Never echo raw tool payloads into
   the conversation.
4. On errors, print the error message and stop.
5. One script per question — compose multi-tool workflows inside it.`;
}

/**
 * @param {object} opts
 * @param {object|array|string} opts.tools
 * @param {string} opts.name
 * @param {string} [opts.outRoot="cdc"]
 * @param {string} [opts.title]
 * @param {string} [opts.httpBase]
 * @param {string} [opts.mcpCommand]
 * @param {string[]} [opts.mcpArgs]
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

  const displayTitle = title || `${name} MCP`;
  const envVar = envVarName(name);
  const mode = httpBase ? 'http' : 'mcp';
  const byTag = new Map();

  for (const tool of tools) {
    const tag = tagOf(tool.name);
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag).push(toolLine(tool));
  }

  const tags = [...byTag.keys()].sort();
  const scriptRules = mcpScriptRules({ envVar, mode, httpBase });

  let cdc = `# ${displayTitle} — CDC (Code-Call Descriptor)\n\n`;
  cdc += `Source: MCP tools/list (${tools.length} tools)\n`;
  if (httpBase) cdc += `HTTP base: ${httpBase}\n`;
  cdc += `\n${scriptRules}\n\n`;
  cdc += `Params: \`*\` = required. Types shown only when non-string.\n`;

  for (const tag of tags) {
    cdc += `\n## ${tag}\n`;
    for (const line of byTag.get(tag)) cdc += line + '\n';
  }

  cdc += `\n## _index\n`;
  for (const t of tools.map((x) => x.name).sort()) cdc += t + '\n';

  const tagDir = tags.map((t) => `- ${t} (${byTag.get(t).length} tools)`).join('\n');
  const firstTag = tags[0] || 'misc';

  const skill = `---
name: ${name}-cdc
description: Call ${displayTitle} by writing sandboxed Node scripts (CDC pattern — compact tool index, no full MCP schemas in context). Use when the user asks to query, analyze, or automate anything involving ${displayTitle}. Read only the CDC.md sections you need.
---

# ${displayTitle} via CDC

Converted from MCP · ${tools.length} tools · progressive disclosure

${scriptRules}

## Finding tools (progressive disclosure — do NOT read all of CDC.md)

CDC.md holds one line per tool, grouped under \`## <tag>\` headings.
Grep for the tag or tool name you need:

\`\`\`
grep -A 40 "^## ${firstTag}" CDC.md | head -40
grep "list_" CDC.md
\`\`\`

Tool groups:
${tagDir}

## Why CDC instead of raw MCP?

MCP loads every tool schema into context and routes every payload through
the model. CDC keeps a small preamble in context and lets you grep the rest.
Aggregation happens in code, so token cost stays flat as data grows — and
arithmetic stays exact. Run \`cdc --stats\` to estimate the savings.
`;

  const path = require('path');
  const fs = require('fs');
  const outDir = path.join(outRoot, name);

  const sourceTokens = estimateTokens(raw);
  const stats = {
    name,
    title: displayTitle,
    source: 'mcp',
    mode,
    tools: tools.length,
    endpoints: tools.length,
    tags: tags.length,
    sourceBytes: Buffer.byteLength(raw),
    sourceTokens,
    mcpSchemaTokens: sourceTokens,
    cdcBytes: cdc.length,
    cdcTokens: estimateTokens(cdc),
    skillBytes: Buffer.byteLength(skill),
    skillTokens: estimateTokens(skill),
    generatedAt: new Date().toISOString(),
  };
  stats.compressionSourceToCdc = +(stats.sourceTokens / Math.max(1, stats.cdcTokens)).toFixed(1);
  stats.compressionSourceToSkill = +(stats.sourceTokens / Math.max(1, stats.skillTokens)).toFixed(1);
  stats.definitionTaxMcp = stats.mcpSchemaTokens;
  stats.definitionTaxCdc = stats.skillTokens;
  stats.definitionSavingsRatio = +(stats.definitionTaxMcp / Math.max(1, stats.definitionTaxCdc)).toFixed(1);

  writePackage(outDir, { cdc, skill, stats });

  if (mode === 'mcp') {
    fs.writeFileSync(path.join(outDir, 'mcp-call.js'), buildMcpCallHelper({ mcpCommand, mcpArgs, name }));
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
        },
        null,
        2,
      ),
    );
  }

  return { outDir, stats };
}

function buildMcpCallHelper({ mcpCommand, mcpArgs, name }) {
  const bakedCmd = mcpCommand ? JSON.stringify(mcpCommand) : 'null';
  const bakedArgs = JSON.stringify(mcpArgs || []);
  return `#!/usr/bin/env node
// mcp-call.js — tiny stdio MCP client for CDC scripts.
// Generated by cdc from-mcp for package "${name}".
//
//   const { callTool } = require('./mcp-call.js');
//   const data = await callTool('tool_name', { arg: 1 });
//
// CLI: node mcp-call.js tool_name '{"arg":1}'
//      node mcp-call.js              # list tool names

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'mcp-manifest.json'), 'utf8'));
  } catch {
    return {};
  }
}

function resolveServer() {
  const man = loadManifest();
  const command = process.env.CDC_MCP_COMMAND || man.command || ${bakedCmd};
  const args = process.env.CDC_MCP_ARGS
    ? JSON.parse(process.env.CDC_MCP_ARGS)
    : (man.args && man.args.length ? man.args : ${bakedArgs});
  if (!command) {
    throw new Error(
      'No MCP server command configured. Set CDC_MCP_COMMAND (and optional CDC_MCP_ARGS JSON array), ' +
        'or re-run: cdc from-mcp --probe <cmd> --name ${name}',
    );
  }
  return { command, args };
}

function rpc(command, args, method, params = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let buf = '';
    let stderr = '';
    let nextId = 1;
    const pending = new Map();

    const send = (msg) => {
      child.stdin.write(JSON.stringify(msg) + '\\n');
    };

    const request = (meth, pars) =>
      new Promise((res, rej) => {
        const id = nextId++;
        pending.set(id, { res, rej });
        send({ jsonrpc: '2.0', id, method: meth, params: pars });
      });

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf('\\n')) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        if (line.startsWith('Content-Length:')) continue;
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
      if (pending.size) {
        reject(new Error('MCP server exited ' + code + '. stderr: ' + stderr.slice(0, 400)));
      }
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
  const result = await rpc(command, serverArgs, 'tools/call', {
    name,
    arguments: args,
  });
  if (result && result.isError) {
    const msg = (result.content || []).map((c) => c.text || '').join('\\n');
    throw new Error(msg || 'tool error');
  }
  if (result && result.content) {
    const texts = result.content.filter((c) => c.type === 'text').map((c) => c.text);
    const joined = texts.join('\\n');
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
    const toolArgs = argsJson ? JSON.parse(argsJson) : {};
    callTool(toolName, toolArgs)
      .then((r) => console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 2)))
      .catch((e) => { console.error(e.message); process.exit(1); });
  }
}
`;
}

/**
 * Probe a stdio MCP server: spawn it, initialize, tools/list, return tools.
 */
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
};

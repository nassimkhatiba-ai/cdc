// Compile MCP tool definitions into a CDC package (general --- no demo hardcoding).
//
// Input: tools/list dump or probe of any MCP server.
// Output: SKILL.md + CDC.md + stats.json
//   - filesystem-like servers → direct Node fs mode (no MCP spawn)
//   - HTTP base provided → fetch mode
//   - everything else --- short skill + mcp-call.js bridge
//
// Design goals (public product - skills anyone installs must work):
//   1. SHORT skill preambles (low definition tax).
//   2. Prefer real code paths over re-entering MCP when possible.
//   3. NEVER bake example-specific paths, filenames, or task logic into templates.
//   4. Agent instructions: one short script, print answer only, no thrash.

const path = require('path');
const fs = require('fs');
const { estimateTokens } = require('./tokens');
const { paramsOf, envVarName, writePackage } = require('./schema-util');

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

/** Compact signature: name(params) - no long prose (keeps CDC.md greppable + cheap). */
function toolLine(tool) {
  const schema = tool.inputSchema || tool.input_schema || { type: 'object', properties: {} };
  const params = paramsOf(schema);
  const shown = params.slice(0, 8);
  const paramStr = shown.length
    ? '(' + shown.join(', ') + (params.length > 8 ? ',...' : '') + ')'
    : '()';
  return `${tool.name}${paramStr}`;
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

/**
 * SHORT skill for local filesystem MCP -> direct Node fs.
 * General template: ROOT from probe path or CDC_FS_ROOT only.
 * No example files, no task-specific code, no MCP bridge.
 */
function buildDirectFsPackage({ name, root, tools }) {
  const hasRoot = Boolean(root);
  const rootExpr = hasRoot ? JSON.stringify(root) : 'process.env.CDC_FS_ROOT';
  const rootDisplay = hasRoot ? root : '$CDC_FS_ROOT';
  const { byTag, tags } = groupTools(tools);

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
    'Use **Node fs/path** in ONE short script. Do **not** call the filesystem MCP or mcp-call.js.',
    '',
    '```js',
    "const fs = require('fs');",
    "const path = require('path');",
    `const ROOT = ${rootExpr};`,
    '// read / list / search / aggregate under ROOT only',
    '// console.log(JSON.stringify(answer));',
    '```',
    '',
    'Rules:',
    '1. Paths must stay under ROOT.',
    '2. Aggregate/filter in the script - print only the final answer.',
    '3. One short script, one run. No multi-step thrash, no dumping file bodies into chat.',
    '4. Prefer built-ins: readFileSync, readdirSync, statSync, writeFileSync.',
    '',
    'Tool name map (optional): see CDC.md',
    '',
  ].join('\n');

  const cdc = renderCdcIndex({
    title: `${name}-cdc (direct fs)`,
    tools,
    byTag,
    tags,
    headerLines: [
      `Root: ${rootDisplay}`,
      'Mode: direct Node fs (not MCP).',
      'MCP tool names below are a map only --- implement with fs.',
    ],
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
    `ONE Node script with fetch. Auth from env $${envVar} if needed.`,
    'Filter/aggregate in script. Print only the answer.',
    '',
    'Grep CDC.md for endpoints/tools. Do not load the whole file.',
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
 * mcp-call.js is the escape hatch - skill still pushes one script, print answer.
 */
function buildMcpBridgePackage({ name, title, tools }) {
  const { byTag, tags } = groupTools(tools);
  const firstTag = tags[0] || 'misc';
  const tagDir = tags.map((t) => `- ${t} (${byTag.get(t).length})`).join('\n');

  const skill = [
    '---',
    `name: ${name}-cdc`,
    `description: Call ${title} via short Node scripts (CDC). Compact tool index; no full MCP schemas in context. Use for ${name}.`,
    '---',
    '',
    `# ${title}`,
    '',
    'ONE Node script per question. Compose tools in code; print only the answer.',
    '',
    '```js',
    "const { callTool } = require('./mcp-call.js');",
    "// const data = await callTool('tool_name', { /* args */ });",
    '// filter/aggregate here',
    '// console.log(JSON.stringify(answer));',
    '```',
    '',
    'Rules:',
    '1. Call only tools you need. Aggregate in the script - never paste raw payloads into chat.',
    '2. One short script, one run. No exploratory thrash.',
    '3. Grep CDC.md for signatures (do not read the whole file).',
    '',
    `\`grep -A 15 "^## ${firstTag}" CDC.md\``,
    '',
    'Groups:',
    tagDir,
    '',
  ].join('\n');

  const cdc = renderCdcIndex({
    title: `${title} - CDC`,
    tools,
    byTag,
    tags,
    headerLines: [
      `Source: MCP tools/list (${tools.length} tools)`,
      'Use mcp-call.js from a script; print answer only.',
    ],
  });

  return { skill, cdc, mode: 'mcp' };
}

function buildMcpCallHelper({ mcpCommand, mcpArgs, name }) {
  const bakedCmd = mcpCommand ? JSON.stringify(mcpCommand) : 'null';
  const bakedArgs = JSON.stringify(mcpArgs || []);
  return `#!/usr/bin/env node
// mcp-call.js --- stdio MCP client for CDC scripts (package: ${name}).
// Prefer a permanently installed server binary over \`npx -y\` (avoids network cold start).
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function rpc(command, args, method, params = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], env: process.env });
    let buf = '', stderr = '', nextId = 1;
    const pending = new Map();
    const send = (msg) => child.stdin.write(JSON.stringify(msg) + '\\n');
    const request = (meth, pars) => new Promise((res, rej) => {
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
    throw new Error((result.content || []).map((c) => c.text || '').join('\\n') || 'tool error');
  }
  if (result && result.content) {
    const joined = result.content.filter((c) => c.type === 'text').map((c) => c.text).join('\\n');
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
    ({ skill, cdc, mode, root: rootOut } = buildDirectFsPackage({
      name,
      root: detectedRoot,
      tools,
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
  detectFilesystemRoot,
};

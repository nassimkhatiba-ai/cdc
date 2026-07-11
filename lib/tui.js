// Interactive TUI for building CDC skills (zero deps, Node 18+).

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { compileMCP, probeMcpServer } = require('./compile-mcp');
const { compileOpenAPI } = require('./compile-openapi');
const { collectStats } = require('./stats');
const { buildConvertWin } = require('./convert-win');
const { skillFolderName } = require('./install-targets');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function c(name, s) {
  if (!process.stdout.isTTY) return s;
  return (C[name] || '') + s + C.reset;
}

function banner() {
  console.log('');
  console.log(c('bold', '  CDC') + c('dim', '  - convert MCP / OpenAPI into Agent Skills'));
  console.log(c('dim', '  Skills stay tiny. Disable the MCP after convert to feel the win.'));
  console.log('');
}

function createRl() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, q, def) {
  const hint = def !== undefined && def !== '' ? ` [${def}]` : '';
  return new Promise((resolve) => {
    rl.question(c('cyan', `  ${q}${hint}: `), (ans) => {
      const v = (ans || '').trim();
      resolve(v || def || '');
    });
  });
}

function yn(v) {
  return /^(y|yes)$/i.test(String(v || '').trim());
}

function splitArgs(raw) {
  if (!raw) return [];
  // simple shell-ish split (quotes)
  const out = [];
  let cur = '';
  let q = null;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (q) {
      if (ch === q) q = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      q = ch;
    } else if (/\s/.test(ch)) {
      if (cur) {
        out.push(cur);
        cur = '';
      }
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

async function pick(rl, title, options) {
  console.log(c('bold', `  ${title}`));
  options.forEach((o, i) => {
    console.log(`    ${c('cyan', String(i + 1))}. ${o.label}${o.hint ? c('dim', '  - ' + o.hint) : ''}`);
  });
  while (true) {
    const ans = await ask(rl, 'choice', '1');
    const n = parseInt(ans, 10);
    if (n >= 1 && n <= options.length) return options[n - 1];
    const byKey = options.find((o) => o.key === ans || String(o.label).toLowerCase().startsWith(String(ans).toLowerCase()));
    if (byKey) return byKey;
    console.log(c('red', '  pick a number from the list'));
  }
}

function defaultSkillsDir() {
  return path.join(require('os').homedir(), '.claude', 'skills');
}

function installPackage(srcDir, name) {
  const skillsDir = defaultSkillsDir();
  const destName = name.endsWith('-cdc') ? name : `${name}-cdc`;
  const dest = path.join(skillsDir, destName);
  fs.mkdirSync(skillsDir, { recursive: true });
  fs.cpSync(srcDir, dest, { recursive: true });
  return dest;
}

function prewarmDaemon(skillDir) {
  try {
    const bridge = path.join(skillDir, 'mcp-call.js');
    if (!fs.existsSync(bridge)) return false;
    const { spawn } = require('child_process');
    spawn(process.execPath, [bridge, 'daemon-start'], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    return true;
  } catch {
    return false;
  }
}

function printResult(outDir, stats, installedTo, warmed) {
  const win = buildConvertWin(stats, {
    installed: installedTo ? [installedTo] : [],
    warmed: !!warmed,
    skillName: skillFolderName(stats.name),
  });
  console.log('');
  console.log(c('green', '  ok  skill ready'));
  console.log(win.text);
}

async function flowMcpProbe(rl, outRoot) {
  console.log('');
  console.log(c('dim', '  Spawn a stdio MCP server, call tools/list, build a skill.'));
  console.log(c('dim', '  Example command:  npx'));
  console.log(c('dim', '  Example args:     -y @modelcontextprotocol/server-github'));
  console.log('');

  const command = await ask(rl, 'MCP command', 'npx');
  const argsRaw = await ask(
    rl,
    'args (space-separated)',
    '-y @modelcontextprotocol/server-github',
  );
  const args = splitArgs(argsRaw);
  const name = await ask(rl, 'skill name', 'github');
  const title = await ask(rl, 'display title (optional)', '');

  console.log('');
  console.log(c('yellow', `  probing  ${command} ${args.join(' ')} ...`));
  let tools;
  try {
    tools = await probeMcpServer(command, args, { timeoutMs: 20000 });
  } catch (e) {
    console.log(c('red', `  probe failed: ${e.message}`));
    console.log(c('dim', '  tip: try a tools.json dump instead, or check the command.'));
    return null;
  }
  console.log(c('green', `  found ${tools.length} tools`));

  return compileMCP({
    tools,
    name,
    outRoot,
    title: title || undefined,
    mcpCommand: command,
    mcpArgs: args,
  });
}

async function flowMcpFile(rl, outRoot) {
  console.log('');
  console.log(c('dim', '  Path to a tools/list JSON dump (array or { tools: [...] }).'));
  console.log(c('dim', `  Sample:  ${path.join('examples', 'sample-mcp-tools.json')}`));
  console.log('');

  let file;
  while (true) {
    file = await ask(rl, 'tools.json path', 'examples/sample-mcp-tools.json');
    const abs = path.resolve(file);
    if (fs.existsSync(abs)) {
      file = abs;
      break;
    }
    console.log(c('red', `  not found: ${abs}`));
    if (rl.closed) return null;
  }

  const fallback = path.basename(file, path.extname(file)).replace(/[^a-z0-9_-]/gi, '-') || 'mcp';
  const name = await ask(rl, 'skill name', fallback);
  const title = await ask(rl, 'display title (optional)', '');
  const command = await ask(rl, 'MCP command to bake in (optional)', '');
  const argsRaw = command ? await ask(rl, 'MCP args (space-separated)', '') : '';
  const args = splitArgs(argsRaw);

  const tools = JSON.parse(fs.readFileSync(file, 'utf8'));
  return compileMCP({
    tools,
    name,
    outRoot,
    title: title || undefined,
    mcpCommand: command || null,
    mcpArgs: args,
  });
}

async function flowOpenApi(rl, outRoot) {
  console.log('');
  console.log(c('dim', '  OpenAPI 3.x JSON - local path or https URL.'));
  console.log(c('dim', '  Example: https://petstore3.swagger.io/api/v3/openapi.json'));
  console.log('');

  const src = await ask(
    rl,
    'spec path or URL',
    'https://petstore3.swagger.io/api/v3/openapi.json',
  );
  const name = await ask(rl, 'skill name', 'api');
  const baseUrl = await ask(rl, 'base URL override (optional)', '');

  console.log('');
  console.log(c('yellow', '  compiling OpenAPI ...'));
  return compileOpenAPI({
    src,
    name,
    outRoot,
    baseUrl: baseUrl || undefined,
  });
}

/**
 * Run the interactive skill builder.
 * @param {{ outRoot?: string }} opts
 */
async function runTui(opts = {}) {
  const force = process.env.CDC_TUI_FORCE === '1';
  if (!process.stdin.isTTY && !force) {
    console.error('cdc tui needs an interactive terminal. Use:');
    console.error('  cdc from-mcp <tools.json> --name <name>');
    console.error('  cdc make <openapi> --name <name>');
    process.exit(1);
  }

  const outRoot = opts.outRoot || 'cdc';
  banner();

  const rl = createRl();
  try {
    const source = await pick(rl, 'What are you converting?', [
      {
        key: 'probe',
        label: 'Live MCP server  (probe tools/list)',
        hint: 'spawn stdio server -> convert -> skill',
      },
      {
        key: 'file',
        label: 'MCP tools.json dump',
        hint: 'paste/export of tools/list',
      },
      {
        key: 'openapi',
        label: 'OpenAPI spec',
        hint: 'URL or local .json',
      },
      {
        key: 'sample',
        label: 'Try the sample (no network)',
        hint: 'examples/sample-mcp-tools.json',
      },
    ]);

    let result = null;
    if (source.key === 'probe') result = await flowMcpProbe(rl, outRoot);
    else if (source.key === 'file') result = await flowMcpFile(rl, outRoot);
    else if (source.key === 'openapi') result = await flowOpenApi(rl, outRoot);
    else if (source.key === 'sample') {
      const tools = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'examples', 'sample-mcp-tools.json'), 'utf8'),
      );
      result = compileMCP({ tools, name: 'demo', outRoot, title: 'Demo MCP' });
    }

    if (!result) {
      console.log(c('dim', '  aborted.'));
      return;
    }

    const { outDir, stats } = result;

    console.log('');
    const doInstall = yn(await ask(rl, 'install into Claude Code skills now? (y/n)', 'y'));
    let installedTo = null;
    let warmed = false;
    if (doInstall) {
      installedTo = installPackage(outDir, stats.name);
      if (stats.mode === 'mcp') {
        warmed = prewarmDaemon(installedTo);
      }
    }

    printResult(outDir, stats, installedTo, warmed);

    const doStats = yn(await ask(rl, 'show estimated MCP savings? (y/n)', 'y'));
    if (doStats) {
      const { report } = collectStats({
        statsFile: path.join(outDir, 'stats.json'),
        paper: false,
      });
      console.log(report);
    }

    console.log(c('dim', '  tip: disable the MCP server of the same name, then try the skill.'));
    console.log(c('dim', '  run  cdc  again anytime, or  cdc --stats --paper'));
    console.log('');
  } catch (e) {
    console.error(c('red', `  error: ${e.message || e}`));
    throw e;
  } finally {
    rl.close();
  }
}

module.exports = { runTui, banner };

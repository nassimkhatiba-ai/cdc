// Simple interactive TUI for building a CDC skill.
// Zero deps - Node readline only.

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { compileMCP, probeMcpServer } = require('./compile-mcp');
const { compileOpenAPI } = require('./compile-openapi');
const { collectStats } = require('./stats');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function c(color, s) {
  return `${C[color] || ''}${s}${C.reset}`;
}

function banner() {
  console.log('');
  console.log(c('cyan', '  +------------------------------------------+'));
  console.log(c('cyan', '  |') + c('bold', '   CDC  -  make a Claude Code skill       ') + c('cyan', '|'));
  console.log(c('cyan', '  |') + c('dim', '   MCP/OpenAPI -> skill (not an MCP load) ') + c('cyan', '|'));
  console.log(c('cyan', '  +------------------------------------------+'));
  console.log('');
  console.log(c('dim', '  Instead of connecting an MCP server (schemas + payloads'));
  console.log(c('dim', '  dumped into context), CDC installs a tiny skill folder.'));
  console.log(c('dim', '  Claude Code loads the skill -> greps tools -> writes a script.'));
  console.log('');
}

function createRl() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: !!process.stdin.isTTY,
  });
}

function ask(rl, question, def) {
  const hint = def !== undefined && def !== '' ? c('dim', ` [${def}]`) : '';
  return new Promise((resolve) => {
    if (rl.closed) {
      resolve(def !== undefined ? def : '');
      return;
    }
    const onClose = () => resolve(def !== undefined ? def : '');
    rl.once('close', onClose);
    rl.question(`  ${c('cyan', '>')} ${question}${hint}: `, (ans) => {
      rl.removeListener('close', onClose);
      const v = String(ans || '').trim();
      resolve(v === '' && def !== undefined ? def : v);
    });
  });
}

async function pick(rl, title, options) {
  console.log(`  ${c('bold', title)}`);
  options.forEach((opt, i) => {
    console.log(`    ${c('yellow', String(i + 1) + '.')} ${opt.label}`);
    if (opt.hint) console.log(`       ${c('dim', opt.hint)}`);
  });
  console.log('');
  while (true) {
    const ans = await ask(rl, 'choice', '1');
    const n = parseInt(ans, 10);
    if (n >= 1 && n <= options.length) return options[n - 1];
    const byKey = options.find(
      (o) => o.key === ans || o.label.toLowerCase().startsWith(String(ans).toLowerCase()),
    );
    if (byKey) return byKey;
    if (!ans || ans === '1') return options[0];
    console.log(c('red', '  pick a number from the list'));
  }
}

function yn(v, def = true) {
  if (v === '' || v === undefined || v === null) return def;
  return /^(y|yes|1|true)$/i.test(String(v));
}

function splitArgs(raw) {
  if (!raw) return [];
  const m = raw.match(/(?:[^\s"]+|"[^"]*")+/g);
  if (!m) return [];
  return m.map((s) => s.replace(/^"|"$/g, ''));
}

function defaultSkillsDir() {
  return (
    process.env.CDC_SKILLS_DIR ||
    path.join(process.env.HOME || process.env.USERPROFILE || '.', '.claude', 'skills')
  );
}

function installPackage(srcDir, name) {
  const skillsDir = defaultSkillsDir();
  const destName = name.endsWith('-cdc') ? name : `${name}-cdc`;
  const dest = path.join(skillsDir, destName);
  fs.mkdirSync(skillsDir, { recursive: true });
  fs.cpSync(srcDir, dest, { recursive: true });
  return dest;
}

function printResult(outDir, stats, installedTo) {
  console.log('');
  console.log(c('green', '  ok  skill ready'));
  console.log(`    ${c('dim', 'path')}      ${outDir}`);
  console.log(`    ${c('dim', 'skill')}     ${stats.skillTokens} tokens upfront`);
  console.log(`    ${c('dim', 'index')}     ${stats.cdcTokens} tokens (grep lazily)`);
  console.log(`    ${c('dim', 'tools')}     ${stats.tools || stats.endpoints}`);
  if (stats.compressionSourceToSkill || stats.compressionSpecToSkill) {
    const x = stats.compressionSourceToSkill || stats.compressionSpecToSkill;
    console.log(`    ${c('dim', 'compress')}  ${x}x vs full source`);
  }
  if (installedTo) {
    console.log(`    ${c('dim', 'installed')} ${installedTo}`);
    console.log('');
    console.log(c('bold', '  In Claude Code:'));
    console.log(c('dim', `    "Using the ${path.basename(installedTo)} skill, ..."`));
    console.log(c('dim', '    Loads as a skill - not as a connected MCP server.'));
  } else {
    console.log('');
    console.log(c('dim', `  Install later:  cdc install ${stats.name}`));
  }
  console.log('');
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
    if (doInstall) {
      installedTo = installPackage(outDir, stats.name);
    }

    printResult(outDir, stats, installedTo);

    const doStats = yn(await ask(rl, 'show estimated MCP savings? (y/n)', 'y'));
    if (doStats) {
      const { report } = collectStats({
        statsFile: path.join(outDir, 'stats.json'),
        paper: false,
      });
      console.log(report);
    }

    console.log(c('dim', '  tip: run  cdc  again anytime, or  cdc --stats --paper'));
    console.log('');
  } catch (e) {
    console.error(c('red', `  error: ${e.message || e}`));
    throw e;
  } finally {
    rl.close();
  }
}

module.exports = { runTui, banner };

#!/usr/bin/env node
// create-cdc-skill.js - used by the cdc-skill-creator skill.
// Converts MCP tools (or OpenAPI) into Agent Skills for Claude Code and Codex.
//
// Usage:
//   node create-cdc-skill.js from-mcp --name <name> [--file tools.json] [--stdin]
//       [--command CMD] [--arg A]... [--title T] [--http-base URL]
//       [--skills-dir DIR] [--no-install] [--out DIR]
//
//   node create-cdc-skill.js from-mcp --name <name> --probe <cmd> [--arg A]...
//
//   node create-cdc-skill.js from-openapi --name <name> --spec <url-or-path>
//       [--base-url URL] [--skills-dir DIR] [--no-install]
//
//   node create-cdc-skill.js stats [--package name] [--skills-dir DIR] [--paper]
//
// Zero deps. Node 18+.

const fs = require('fs');
const path = require('path');
const { compileMCP, probeMcpServer } = require('./lib/compile-mcp');
const { compileOpenAPI } = require('./lib/compile-openapi');
const { collectStats } = require('./lib/stats');

// Flags that ALWAYS take a value — their value is consumed verbatim even when
// it starts with "--" (e.g. `--arg --headless` for probing @playwright/mcp).
const VALUE_FLAGS = new Set([
  'arg', 'probe', 'name', 'file', 'spec', 'out', 'title', 'http-base',
  'skills-dir', 'target', 'command', 'base-url', 'skill-name', 'package',
  'root', 'tools',
]);

function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      let key = a.slice(2);
      let val;
      const eq = key.indexOf('=');
      if (eq !== -1) {
        val = key.slice(eq + 1);
        key = key.slice(0, eq);
      } else if (VALUE_FLAGS.has(key)) {
        val = argv[++i];
        if (val === undefined) {
          console.error(`--${key} requires a value`);
          process.exit(1);
        }
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('--')) {
          val = next;
          i++;
        }
      }
      if (val === undefined) {
        args.flags[key] = true;
      } else if (key === 'arg') {
        if (!Array.isArray(args.flags.arg)) args.flags.arg = [];
        args.flags.arg.push(val);
      } else {
        args.flags[key] = val;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function flag(flags, name, def) {
  return flags[name] === undefined ? def : flags[name];
}

const {
  resolveSkillsDirs,
  installToDirs,
  skillFolderName,
} = require('./lib/install-targets');

function installPackage(srcDir, name, { skillsDir, target } = {}) {
  const dirs = resolveSkillsDirs({ skillsDir, target });
  const folder = skillFolderName(name);
  return installToDirs(srcDir, folder, dirs);
}

// Compact single line by default: this output lands in an agent's context on
// every conversion — pretty-printing it just burns the caller's tokens.
let VERBOSE = false;
function printJson(obj) {
  console.log(VERBOSE ? JSON.stringify(obj, null, 2) : JSON.stringify(obj));
}

// "Convert my <name> MCP" with zero exploration: pull command/args from the
// user's existing Claude Code / Codex MCP config and probe it.
async function cmdFromConfig(args) {
  const { findMcpServers } = require('./lib/mcp-config');
  const query = flag(args.flags, 'name') || args._[0];
  const servers = findMcpServers(query);
  if (!query || !servers.length || servers.length > 1) {
    const all = findMcpServers();
    printJson({
      ok: false,
      error: !query
        ? 'pass --name <configured-server-name>'
        : servers.length
          ? `ambiguous name "${query}" — pass the exact name`
          : `no configured MCP server matches "${query}"`,
      configured: all.map((s) => ({ name: s.name, source: s.source })),
    });
    process.exit(query && !servers.length ? 1 : 2);
  }
  const s = servers[0];
  process.stderr.write(`found "${s.name}" in ${s.source}: ${s.command} ${s.args.join(' ')}\n`);
  args.flags.name = flag(args.flags, 'skill-name', s.name);
  args.flags.probe = s.command;
  args.flags.arg = s.args;
  await cmdFromMcp(args);
}

async function cmdFromMcp(args) {
  const name = flag(args.flags, 'name');
  if (!name) {
    console.error('error: --name is required');
    process.exit(1);
  }

  const outRoot = flag(args.flags, 'out', path.join(process.cwd(), '.cdc-build'));
  const title = flag(args.flags, 'title');
  const httpBase = flag(args.flags, 'http-base');
  const probeCmd = flag(args.flags, 'probe');
  const mcpArgs = Array.isArray(args.flags.arg)
    ? args.flags.arg
    : args.flags.arg
      ? [args.flags.arg]
      : [];
  let mcpCommand = flag(args.flags, 'command') || null;

  let tools;
  if (probeCmd) {
    mcpCommand = probeCmd;
    process.stderr.write(`probing: ${mcpCommand} ${mcpArgs.join(' ')}\n`);
    tools = await probeMcpServer(mcpCommand, mcpArgs, { timeoutMs: 20000 });
    process.stderr.write(`found ${tools.length} tools\n`);
  } else if (args.flags.stdin || flag(args.flags, 'file') === '-') {
    const raw = fs.readFileSync(0, 'utf8');
    tools = JSON.parse(raw);
  } else if (args.flags.file) {
    const raw = fs.readFileSync(path.resolve(args.flags.file), 'utf8');
    tools = JSON.parse(raw);
  } else if (args._[0]) {
    const raw = fs.readFileSync(path.resolve(args._[0]), 'utf8');
    tools = JSON.parse(raw);
  } else {
    console.error('error: provide --file tools.json, --stdin, or --probe <cmd>');
    process.exit(1);
  }

  const { outDir, stats } = compileMCP({
    tools,
    name,
    outRoot,
    title,
    httpBase,
    mcpCommand,
    mcpArgs,
  });

  let installed = [];
  if (!args.flags['no-install']) {
    installed = installPackage(outDir, stats.name, {
      skillsDir: flag(args.flags, 'skills-dir'),
      target: flag(args.flags, 'target'),
    });
  }

  const skillName = skillFolderName(stats.name);
  printJson({
    ok: true,
    mode: stats.mode || 'mcp',
    name: stats.name,
    skillName,
    tools: stats.tools,
    skillTokens: stats.skillTokens,
    cdcTokens: stats.cdcTokens,
    sourceTokens: stats.sourceTokens,
    compression: stats.compressionSourceToSkill,
    definitionSavingsRatio: stats.definitionSavingsRatio,
    outDir,
    installed,
    howToUse: installed.length
      ? `In Claude Code or Codex: "Using the ${skillName} skill, ..."`
      : `Install with: cdc install ${stats.name} --target both`,
    note: 'Installed as an Agent Skill (Claude Code + Codex) - not as a connected MCP server.',
  });
}

async function cmdFromOpenApi(args) {
  const name = flag(args.flags, 'name');
  const src = flag(args.flags, 'spec') || args._[0];
  if (!name || !src) {
    console.error('error: --name and --spec (or positional path/url) required');
    process.exit(1);
  }

  const outRoot = flag(args.flags, 'out', path.join(process.cwd(), '.cdc-build'));
  const { outDir, stats } = await compileOpenAPI({
    src,
    name,
    outRoot,
    baseUrl: flag(args.flags, 'base-url'),
  });

  let installed = [];
  if (!args.flags['no-install']) {
    installed = installPackage(outDir, stats.name, {
      skillsDir: flag(args.flags, 'skills-dir'),
      target: flag(args.flags, 'target'),
    });
  }

  const skillName = skillFolderName(stats.name);
  printJson({
    ok: true,
    mode: 'openapi',
    name: stats.name,
    skillName,
    tools: stats.endpoints,
    skillTokens: stats.skillTokens,
    cdcTokens: stats.cdcTokens,
    sourceTokens: stats.sourceTokens || stats.specTokens,
    compression: stats.compressionSourceToSkill || stats.compressionSpecToSkill,
    outDir,
    installed,
    howToUse: installed.length
      ? `In Claude Code or Codex: "Using the ${skillName} skill, ..."`
      : `Install with: cdc install ${stats.name} --target both`,
    note: 'Installed as an Agent Skill (Claude Code + Codex) - not as a connected MCP server.',
  });
}

function cmdStats(args) {
  const dirs = resolveSkillsDirs({
    skillsDir: flag(args.flags, 'skills-dir'),
    target: flag(args.flags, 'target'),
  });
  const skillsDir = dirs[0];
  const pkg = flag(args.flags, 'package');
  let statsFile;
  let root = flag(args.flags, 'root', skillsDir);

  if (pkg) {
    const candidates = [
      path.resolve(pkg),
      path.join(skillsDir, pkg),
      path.join(skillsDir, pkg.endsWith('-cdc') ? pkg : `${pkg}-cdc`),
      path.join('cdc', pkg),
    ];
    for (const c of candidates) {
      if (fs.existsSync(path.join(c, 'stats.json'))) {
        statsFile = path.join(c, 'stats.json');
        break;
      }
    }
    if (!statsFile) {
      console.error(`error: package not found: ${pkg}`);
      process.exit(1);
    }
  }

  const { results, report } = collectStats({
    root,
    statsFile,
    toolsFile: flag(args.flags, 'tools'),
    paper: !!args.flags.paper,
  });

  if (args.flags.json) {
    printJson({ results });
  } else {
    console.log(report);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv[0] === 'help' || argv[0] === '--help') {
    console.log(`create-cdc-skill - convert MCP/OpenAPI into a Claude Code skill

  node create-cdc-skill.js from-config --name X        # X = server name in
      ~/.claude.json, .mcp.json, or ~/.codex/config.toml (PREFERRED)
  node create-cdc-skill.js from-mcp --name X --file tools.json
  node create-cdc-skill.js from-mcp --name X --stdin < tools.json
  node create-cdc-skill.js from-mcp --name X --probe npx --arg -y --arg "@scope/pkg"
  node create-cdc-skill.js from-openapi --name X --spec https://.../openapi.json
  node create-cdc-skill.js stats --package X --paper

Default: installs into Claude Code + Codex skill dirs (auto-detect).
Output: one JSON line (add --verbose for pretty).
Flags: --no-install  --skills-dir DIR  --target claude|codex|both|auto
       --out DIR  --title T  --http-base URL  --skill-name N (from-config)
`);
    process.exit(0);
  }

  const args = parseArgs(argv);
  VERBOSE = !!args.flags.verbose;
  const cmd = args._.shift();

  if (cmd === 'from-config' || cmd === 'config') await cmdFromConfig(args);
  else if (cmd === 'from-mcp' || cmd === 'mcp') await cmdFromMcp(args);
  else if (cmd === 'from-openapi' || cmd === 'openapi' || cmd === 'make') await cmdFromOpenApi(args);
  else if (cmd === 'stats') cmdStats(args);
  else {
    console.error(`unknown command: ${cmd}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: e.message || String(e) }));
  process.exit(1);
});

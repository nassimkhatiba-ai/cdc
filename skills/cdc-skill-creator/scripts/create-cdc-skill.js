#!/usr/bin/env node
// create-cdc-skill.js — used by the cdc-skill-creator Claude Code skill.
// Converts MCP tools (or OpenAPI) into an installed Claude Code skill.
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

function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        args.flags[key] = true;
      } else {
        if (key === 'arg') {
          if (!Array.isArray(args.flags.arg)) args.flags.arg = [];
          args.flags.arg.push(next);
        } else {
          args.flags[key] = next;
        }
        i++;
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

function defaultSkillsDir() {
  return (
    process.env.CDC_SKILLS_DIR ||
    path.join(process.env.HOME || process.env.USERPROFILE || '.', '.claude', 'skills')
  );
}

function installPackage(srcDir, name, skillsDir) {
  const destName = name.endsWith('-cdc') ? name : `${name}-cdc`;
  const dest = path.join(skillsDir, destName);
  fs.mkdirSync(skillsDir, { recursive: true });
  fs.cpSync(srcDir, dest, { recursive: true });
  return dest;
}

function printJson(obj) {
  console.log(JSON.stringify(obj, null, 2));
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

  let installed = null;
  if (!args.flags['no-install']) {
    const skillsDir = flag(args.flags, 'skills-dir', defaultSkillsDir());
    installed = installPackage(outDir, stats.name, skillsDir);
  }

  printJson({
    ok: true,
    mode: 'mcp',
    name: stats.name,
    skillName: `${stats.name}-cdc`,
    tools: stats.tools,
    skillTokens: stats.skillTokens,
    cdcTokens: stats.cdcTokens,
    sourceTokens: stats.sourceTokens,
    compression: stats.compressionSourceToSkill,
    definitionSavingsRatio: stats.definitionSavingsRatio,
    outDir,
    installed,
    howToUse: installed
      ? `In Claude Code: "Using the ${path.basename(installed)} skill, ..."`
      : `Install with: cdc install ${stats.name}`,
    note: 'Installed as a Claude Code skill — not as a connected MCP server.',
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

  let installed = null;
  if (!args.flags['no-install']) {
    const skillsDir = flag(args.flags, 'skills-dir', defaultSkillsDir());
    installed = installPackage(outDir, stats.name, skillsDir);
  }

  printJson({
    ok: true,
    mode: 'openapi',
    name: stats.name,
    skillName: `${stats.name}-cdc`,
    tools: stats.endpoints,
    skillTokens: stats.skillTokens,
    cdcTokens: stats.cdcTokens,
    sourceTokens: stats.sourceTokens || stats.specTokens,
    compression: stats.compressionSourceToSkill || stats.compressionSpecToSkill,
    outDir,
    installed,
    howToUse: installed
      ? `In Claude Code: "Using the ${path.basename(installed)} skill, ..."`
      : `Install with: cdc install ${stats.name}`,
    note: 'Installed as a Claude Code skill — not as a connected MCP server.',
  });
}

function cmdStats(args) {
  const skillsDir = flag(args.flags, 'skills-dir', defaultSkillsDir());
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

  node create-cdc-skill.js from-mcp --name X --file tools.json
  node create-cdc-skill.js from-mcp --name X --stdin < tools.json
  node create-cdc-skill.js from-mcp --name X --probe npx --arg -y --arg "@scope/pkg"
  node create-cdc-skill.js from-openapi --name X --spec https://.../openapi.json
  node create-cdc-skill.js stats --package X --paper

Default: installs into ~/.claude/skills/<name>-cdc
Flags: --no-install  --skills-dir DIR  --out DIR  --title T  --http-base URL
`);
    process.exit(0);
  }

  const args = parseArgs(argv);
  const cmd = args._.shift();

  if (cmd === 'from-mcp' || cmd === 'mcp') await cmdFromMcp(args);
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

#!/usr/bin/env node
// cdc — Code-Call Descriptor CLI
//
//   cdc                            interactive TUI (make a skill)
//   cdc tui | cdc new              same
//   cdc make <openapi> --name X    OpenAPI -> Claude Code skill
//   cdc from-mcp ...               MCP tools/list -> Claude Code skill
//   cdc install <pkg>              copy into ~/.claude/skills/
//   cdc --stats                    estimate MCP token/cost savings
//
// Zero runtime deps. Node 18+.

const fs = require('fs');
const path = require('path');
const { compileOpenAPI } = require('../lib/compile-openapi');
const { compileMCP, probeMcpServer } = require('../lib/compile-mcp');
const { collectStats } = require('../lib/stats');
const { runTui } = require('../lib/tui');

const VERSION = require('../package.json').version;

function usage(code = 0) {
  const text = `
cdc v${VERSION} — Code-Call Descriptor toolkit

Turn MCP servers / OpenAPI specs into Claude Code *skills*
(not MCP connections). Claude greps a tiny index and writes scripts;
schemas and raw payloads never flood the context window.

USAGE
  cdc | cdc tui | cdc new
      Interactive TUI — pick a source, build + install a skill.

  cdc from-mcp <tools.json> --name <name> [--out cdc] [--title T]
             [--http-base URL] [--command CMD] [--arg A]...
      Convert an MCP tools/list dump into a skill package.

  cdc from-mcp --probe <command> [--arg A]... --name <name> [--out cdc]
      Spawn a stdio MCP server, call tools/list, convert to a skill.

  cdc make <spec-url-or-path> --name <name> [--out cdc] [--base-url URL]
      Compile an OpenAPI 3.x JSON spec into a skill package.

  cdc install <package-dir-or-name> [--skills-dir DIR]
      Install as a Claude Code skill (default: ~/.claude/skills/<name>-cdc).
      Claude loads this as a skill — not as a connected MCP server.

  cdc stats | cdc --stats [options]
      Estimate how many tokens/dollars the MCP pattern would have cost.

      --paper  --root <dir>  --package <dir>  --tools <json>
      --sessions N  --tasks N  --mcp-trips N  --payload-tokens N
      --price-in N  --price-out N  --json

  cdc install-creator
      Install the cdc-skill-creator Claude Code skill
      (so you can convert MCPs by chatting with Claude).

  cdc list [--root cdc]
  cdc help | cdc --help
  cdc version | cdc --version

QUICK START
  cdc                                          # TUI
  cdc from-mcp tools.json --name myserver
  cdc install myserver
  cdc --stats --paper

Docs: README.md · Paper: PAPER.md
`.trim();
  console.log(text);
  process.exit(code);
}

// ---------- tiny argv parser ----------
function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      args._.push(...argv.slice(i + 1));
      break;
    }
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
    } else if (a.startsWith('-') && a.length === 2) {
      const map = { h: 'help', v: 'version', j: 'json' };
      const key = map[a[1]] || a[1];
      args.flags[key] = true;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function flag(flags, name, def) {
  return flags[name] === undefined ? def : flags[name];
}

function num(flags, name, def) {
  if (flags[name] === undefined) return def;
  const n = Number(flags[name]);
  if (Number.isNaN(n)) throw new Error(`--${name} must be a number`);
  return n;
}

// ---------- commands ----------
async function cmdMake(args) {
  const src = args._[0];
  const name = flag(args.flags, 'name');
  if (!src || !name) {
    console.error('usage: cdc make <spec-url-or-path> --name <name> [--out cdc] [--base-url URL]');
    process.exit(1);
  }
  const { outDir, stats } = await compileOpenAPI({
    src,
    name,
    outRoot: flag(args.flags, 'out', 'cdc'),
    baseUrl: flag(args.flags, 'base-url'),
  });
  printCompileResult(outDir, stats);
}

async function cmdFromMcp(args) {
  const name = flag(args.flags, 'name');
  if (!name) {
    console.error('usage: cdc from-mcp <tools.json|--probe CMD> --name <name>');
    process.exit(1);
  }

  const outRoot = flag(args.flags, 'out', 'cdc');
  const title = flag(args.flags, 'title');
  const httpBase = flag(args.flags, 'http-base');
  const probeCmd = flag(args.flags, 'probe');
  const mcpArgs = Array.isArray(args.flags.arg)
    ? args.flags.arg
    : args.flags.arg
      ? [args.flags.arg]
      : [];

  let tools;
  let mcpCommand = flag(args.flags, 'command') || null;

  if (probeCmd) {
    mcpCommand = probeCmd;
    process.stderr.write(`Probing MCP server: ${mcpCommand} ${mcpArgs.join(' ')}\n`);
    tools = await probeMcpServer(mcpCommand, mcpArgs);
    process.stderr.write(`Found ${tools.length} tools.\n`);
  } else {
    const src = args._[0];
    if (!src) {
      console.error('Provide tools.json path or --probe <command>');
      process.exit(1);
    }
    const raw =
      src === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(path.resolve(src), 'utf8');
    tools = JSON.parse(raw);
  }

  if (!mcpCommand && args.flags.command) mcpCommand = args.flags.command;

  const { outDir, stats } = compileMCP({
    tools,
    name,
    outRoot,
    title,
    httpBase,
    mcpCommand,
    mcpArgs,
  });
  printCompileResult(outDir, stats);
}

function printCompileResult(outDir, stats) {
  console.log(`\nWrote CDC skill package -> ${outDir}/`);
  console.log(`  SKILL.md   ${stats.skillTokens} tokens (upfront context)`);
  console.log(`  CDC.md     ${stats.cdcTokens} tokens (grep lazily)`);
  console.log(`  tools      ${stats.tools || stats.endpoints}`);
  if (stats.sourceTokens) {
    console.log(
      `  compress   source ${stats.sourceTokens.toLocaleString()} tok -> skill ${stats.skillTokens} tok  (${stats.compressionSourceToSkill || stats.compressionSpecToSkill}x)`,
    );
  }
  if (stats.definitionSavingsRatio) {
    console.log(
      `  def tax    MCP schemas ~${stats.definitionTaxMcp} tok vs skill ${stats.definitionTaxCdc} tok  (${stats.definitionSavingsRatio}x)`,
    );
  }
  console.log(`\nThis installs as a Claude Code skill (not an MCP connection).`);
  console.log(`  cdc install ${stats.name}`);
  console.log(`  cdc --stats --root ${path.dirname(outDir)}`);
  console.log('');
}

function defaultSkillsDir() {
  return (
    process.env.CDC_SKILLS_DIR ||
    path.join(process.env.HOME || process.env.USERPROFILE || '.', '.claude', 'skills')
  );
}

function resolvePackage(nameOrPath, root = 'cdc') {
  const candidates = [
    path.resolve(nameOrPath),
    path.resolve(root, nameOrPath),
    path.resolve(nameOrPath.replace(/-cdc$/, '')),
    path.resolve(root, nameOrPath.replace(/-cdc$/, '')),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'SKILL.md'))) return c;
  }
  return null;
}

function cmdInstall(args) {
  const nameOrPath = args._[0];
  if (!nameOrPath) {
    console.error('usage: cdc install <package-dir-or-name> [--skills-dir DIR]');
    process.exit(1);
  }
  const root = flag(args.flags, 'root', 'cdc');
  const src = resolvePackage(nameOrPath, root);
  if (!src) {
    console.error(`Package not found: ${nameOrPath}`);
    process.exit(1);
  }
  const skillsDir = flag(args.flags, 'skills-dir', defaultSkillsDir());
  const base = path.basename(src);
  const destName = base.endsWith('-cdc') ? base : `${base}-cdc`;
  const dest = path.join(skillsDir, destName);

  fs.mkdirSync(skillsDir, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });

  console.log(`Installed skill ${src} -> ${dest}`);
  console.log(`Claude Code loads this as a skill — not as a connected MCP server.`);
  console.log(`Skill name: ${destName}`);
  if (fs.existsSync(path.join(dest, 'mcp-manifest.json'))) {
    const man = JSON.parse(fs.readFileSync(path.join(dest, 'mcp-manifest.json'), 'utf8'));
    if (!man.command) {
      console.log(`\nNote: set CDC_MCP_COMMAND so scripts can reach the MCP server, e.g.:`);
      console.log(`  export CDC_MCP_COMMAND=npx`);
      console.log(`  export CDC_MCP_ARGS='["-y","@modelcontextprotocol/server-github"]'`);
    }
  }
}

function cmdStats(args) {
  const scenario = {
    sessions: num(args.flags, 'sessions', 1),
    tasksPerSession: num(args.flags, 'tasks', 5),
    mcpRoundTripsPerTask: num(args.flags, 'mcp-trips', 15),
    mcpPayloadTokensPerRoundTrip: num(args.flags, 'payload-tokens', 2800),
    cdcRoundTripsPerTask: num(args.flags, 'cdc-trips', 2),
  };
  const prices = {
    priceIn: num(args.flags, 'price-in', 3),
    priceOut: num(args.flags, 'price-out', 15),
  };

  let statsFile;
  if (args.flags.package) {
    const pkg = resolvePackage(args.flags.package, flag(args.flags, 'root', 'cdc'));
    if (!pkg) {
      console.error(`Package not found: ${args.flags.package}`);
      process.exit(1);
    }
    statsFile = path.join(pkg, 'stats.json');
  }

  const { results, report } = collectStats({
    root: flag(args.flags, 'root', 'cdc'),
    statsFile,
    toolsFile: flag(args.flags, 'tools'),
    paper: !!args.flags.paper,
    scenario,
    prices,
  });

  if (args.flags.json) {
    console.log(JSON.stringify({ results }, null, 2));
  } else {
    console.log(report);
  }
}

function cmdList(args) {
  const root = flag(args.flags, 'root', 'cdc');
  const { findPackages } = require('../lib/stats');
  const pkgs = findPackages(root);
  if (!pkgs.length) {
    console.log(`No CDC packages under ${path.resolve(root)}`);
    return;
  }
  console.log(`CDC skill packages in ${path.resolve(root)}:\n`);
  for (const p of pkgs) {
    const s = JSON.parse(fs.readFileSync(path.join(p, 'stats.json'), 'utf8'));
    const comp = s.compressionSourceToSkill || s.compressionSpecToSkill || '?';
    console.log(
      `  ${s.name.padEnd(16)} ${(s.tools || s.endpoints || 0).toString().padStart(5)} tools  skill=${String(s.skillTokens).padStart(5)} tok  compress=${comp}x  [${s.source || '?'}]`,
    );
  }
  console.log('');
}


function cmdInstallCreator() {
  const src = path.join(__dirname, '..', 'skills', 'cdc-skill-creator');
  if (!fs.existsSync(path.join(src, 'SKILL.md'))) {
    console.error('cdc-skill-creator not found in this checkout:', src);
    process.exit(1);
  }
  const dest = path.join(defaultSkillsDir(), 'cdc-skill-creator');
  fs.mkdirSync(defaultSkillsDir(), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`Installed creator skill -> ${dest}`);
  console.log('');
  console.log('In Claude Code, say:');
  console.log('  "Convert my GitHub MCP into a CDC skill"');
  console.log('  "Use cdc-skill-creator on tools.json"');
  console.log('');
  console.log('Generated skills load as skills — not as connected MCP servers.');
}

// ---------- main ----------
async function main() {
  const argv = process.argv.slice(2);

  // no args + TTY → interactive skill builder
  if (!argv.length) {
    if (process.stdin.isTTY) {
      await runTui({ outRoot: 'cdc' });
      return;
    }
    usage(0);
  }

  const args = parseArgs(argv);

  if (args.flags.help) usage(0);
  if (args.flags.version) {
    console.log(VERSION);
    process.exit(0);
  }
  if (args.flags.stats) {
    cmdStats(args);
    return;
  }

  const cmd = args._.shift();
  switch (cmd) {
    case 'tui':
    case 'new':
    case 'init':
    case 'wizard':
      await runTui({ outRoot: flag(args.flags, 'out', 'cdc') });
      break;
    case 'make':
      await cmdMake(args);
      break;
    case 'from-mcp':
    case 'from_mcp':
    case 'mcp':
      await cmdFromMcp(args);
      break;
    case 'install':
      cmdInstall(args);
      break;
    case 'install-creator':
    case 'install-skill-creator':
      cmdInstallCreator();
      break;
    case 'stats':
      cmdStats(args);
      break;
    case 'list':
    case 'ls':
      cmdList(args);
      break;
    case 'help':
      usage(0);
      break;
    case 'version':
      console.log(VERSION);
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      usage(1);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

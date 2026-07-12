#!/usr/bin/env node
// Smoke tests for the cdc CLI and compilers. No network required.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const cdcBin = path.join(root, 'bin', 'cdc.js');
const tmp = path.join(root, 'test', '.tmp-out');

function run(args, opts = {}) {
  return spawnSync(process.execPath, [cdcBin, ...args], {
    encoding: 'utf8',
    cwd: root,
    ...opts,
  });
}

function clean() {
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
}

/** Full skill body: SKILL.text.md when image-primary, else SKILL.md */
function skillBody(dir) {
  const text = path.join(dir, 'SKILL.text.md');
  if (fs.existsSync(text)) return fs.readFileSync(text, 'utf8');
  return fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
}

let passed = 0;
function ok(label) {
  passed += 1;
  console.log(`  ok  ${label}`);
}

clean();
console.log('cdc smoke tests\n');

// --- from-mcp ---
{
  const r = run([
    'from-mcp',
    'examples/sample-mcp-tools.json',
    '--name',
    'demo',
    '--out',
    tmp,
    '--title',
    'Demo MCP',
    '--mode',
    'text', // these assertions test the text template; router tested separately
  ]);
  assert.strictEqual(r.status, 0, r.stderr || r.stdout);
  assert.ok(fs.existsSync(path.join(tmp, 'demo', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(tmp, 'demo', 'CDC.md')));
  assert.ok(fs.existsSync(path.join(tmp, 'demo', 'stats.json')));
  assert.ok(fs.existsSync(path.join(tmp, 'demo', 'mcp-call.js')));
  // image skill is MAIN: emit .cdc.png + pointer SKILL.md
  assert.ok(
    fs.existsSync(path.join(tmp, 'demo', 'demo.cdc.png')) ||
      fs.existsSync(path.join(tmp, 'demo', 'image-meta.json')),
    'image skill artifacts',
  );
  const stats = JSON.parse(fs.readFileSync(path.join(tmp, 'demo', 'stats.json'), 'utf8'));
  assert.strictEqual(stats.source, 'mcp');
  assert.strictEqual(stats.mode, 'mcp');
  assert.strictEqual(stats.tools, 12);
  assert.ok(stats.skillTokens < stats.sourceTokens);
  assert.ok(stats.skillTokens < 1100, 'bridge skill must stay short');
  if (stats.imagePrimary) {
    assert.ok(fs.existsSync(path.join(tmp, 'demo', 'SKILL.text.md')), 'image primary keeps text body');
  }
  const skill = skillBody(path.join(tmp, 'demo'));
  assert.ok(skill.includes('## Tools') || skill.includes('grep CDC.md'), 'tool index available');
  assert.ok(skill.includes('daemon') || skill.includes('Daemon') || skill.includes('Warm daemon'), 'bridge skill documents the warm daemon');
  assert.ok(
    skill.includes('Call (do this first)') || skill.includes('Fast path') || skill.includes('--batch'),
    'bridge skill teaches CLI/batch fast path',
  );
  // callPaged only when the server has paginated list tools (sample does)
  if (stats.skillTier === 'paged' || skill.includes('callPaged')) {
    assert.ok(skill.includes('callPaged'), 'paged tier teaches callPaged');
  }
  assert.ok(stats.skillTier === 'paged' || stats.skillTier === 'cli' || stats.skillTier === 'multi');
  assert.ok(!skill.includes('orders.json'), 'no demo hardcoding in general MCP skill');
  assert.ok(r.stdout.includes('convert win') || r.stdout.includes('skill') || r.stdout.includes('SKILL'));
  assert.ok(
    r.stdout.includes('Disable') || r.stdout.includes('disable') || r.stdout.includes('MCP'),
    'convert output tells user about MCP disable',
  );
  ok('from-mcp compiles sample tools (general bridge, short)');
}

// --- optical packer + auto router ---
{
  const { compileMCP } = require('../lib/compile-mcp');
  const mkTool = (n, desc) => ({
    name: n,
    description: desc || 'Does a thing with several parameters and options.',
    inputSchema: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'integer' } }, required: ['a'] },
  });

  // tiny surface -> text primary, no image files rendered
  const tiny = compileMCP({
    tools: [mkTool('t_one'), mkTool('t_two'), mkTool('t_three')],
    name: 'optiny', outRoot: tmp, imageMode: 'auto',
  });
  assert.strictEqual(tiny.stats.skillMode, 'text', 'tiny surface routes text: ' + tiny.stats.skillModeReason);
  assert.ok(!fs.existsSync(path.join(tmp, 'optiny', 'optiny.cdc.png')), 'no vision floor paid for tiny skills');
  const tinySkill = fs.readFileSync(path.join(tmp, 'optiny', 'SKILL.md'), 'utf8');
  assert.ok(tinySkill.includes('t_one'), 'tiny keeps normal text skill');

  // fat surface -> optical pages as sidecar; SKILL.md stays full TEXT (hot path).
  // Product fix: never replace SKILL.md with a vision pointer (Codex thrash root cause).
  const fatTools = [];
  for (let i = 0; i < 40; i++) fatTools.push(mkTool('svc_tool_' + i, 'Tool number ' + i + ' retrieves operational records and joins them against reference data for reporting purposes.'));
  const fat = compileMCP({ tools: fatTools, name: 'opfat', outRoot: tmp, imageMode: 'auto' });
  assert.strictEqual(fat.stats.skillMode, 'image', 'fat surface routes image: ' + fat.stats.skillModeReason);
  assert.ok(fs.existsSync(path.join(tmp, 'opfat', 'opfat.cdc.png')), 'image pages written');
  assert.ok(!fat.stats.imagePrimary, 'text is always installed hot path (imagePrimary false)');
  const fatSkill = fs.readFileSync(path.join(tmp, 'opfat', 'SKILL.md'), 'utf8');
  assert.ok(fatSkill.includes('svc_tool_0') || fatSkill.includes('--batch') || fatSkill.includes('openSession'), 'SKILL.md is full text hot path, not optical pointer');
  assert.ok(!fatSkill.includes('optical skill') || fatSkill.includes('No connected MCP'), 'SKILL.md must not be vision-only pointer');
  assert.ok(fs.existsSync(path.join(tmp, 'opfat', 'SKILL.optical.md')) || !fs.existsSync(path.join(tmp, 'opfat', 'SKILL.text.md')), 'optical is sidecar (SKILL.optical.md), not SKILL.text.md primary swap');
  const meta = JSON.parse(fs.readFileSync(path.join(tmp, 'opfat', 'image-meta.json'), 'utf8'));
  assert.ok(meta.tiles >= 1 && meta.estVisionTokens >= 255, 'pack metrics present');
  assert.ok(meta.estVisionTokens < meta.textEquivalentTokens, 'image must beat text-equiv when routed image');
  assert.ok(meta.pageDims.every((p) => !p.downscaled), 'pages must survive provider resize untouched');
  assert.ok(meta.opticalSidecar || meta.imagePrimary === false, 'optical is sidecar; text primary');

  // forced modes override the router
  const forced = compileMCP({ tools: fatTools, name: 'opforce', outRoot: tmp, imageMode: 'text' });
  assert.strictEqual(forced.stats.skillMode, 'text');
  ok('optical packer + auto router (tiny->text, fat->image-sidecar, forced modes)');
}

// --- callPaged helper: full pagination without a live server ---
{
  const bridge = require(path.join(tmp, 'demo', 'mcp-call.js'));
  const pages = {
    1: { data: [{ id: 1 }, { id: 2 }], total_pages: 3 },
    2: { data: [{ id: 3 }, { id: 4 }], total_pages: 3 },
    3: { data: [{ id: 5 }], total_pages: 3 },
  };
  // First call may omit page (Notion-safe: no forced page=1). Treat missing page as page 1.
  const fake = {
    call: async (tool, args) => pages[args.page != null ? args.page : 1],
  };
  bridge.callPaged(fake, 'list_x', {}).then((rows) => {
    assert.strictEqual(rows.length, 5, 'collects every page');
    // server that ignores the page param must not loop or double-count
    const stuck = { call: async () => [{ id: 9 }, { id: 10 }] };
    return bridge.callPaged(stuck, 'list_y', {});
  }).then((rows) => {
    assert.strictEqual(rows.length, 2, 'duplicate-page guard stops repeats');
    // non-paginated shapes pass through untouched
    const scalar = { call: async () => ({ value: 42 }) };
    return bridge.callPaged(scalar, 'get_z', {});
  }).then((res) => {
    assert.strictEqual(res.value, 42, 'non-list result passes through');
    ok('callPaged paginates, guards, passes through');
  }).catch((e) => { console.error(e); process.exit(1); });
}

// --- filesystem MCP -> direct-fs (general, no task hardcode) ---
{
  const { compileMCP, detectFilesystemRoot } = require('../lib/compile-mcp');
  const tools = [
    {
      name: 'list_directory',
      inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
    },
    {
      name: 'list_allowed_directories',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'read_text_file',
      inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
    },
    {
      name: 'write_file',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' }, content: { type: 'string' } },
      },
    },
  ];
  const det = detectFilesystemRoot(
    'npx',
    ['-y', '@modelcontextprotocol/server-filesystem', '/any/user/root'],
    'filesystem',
    tools,
  );
  assert.strictEqual(det.isFs, true);
  assert.strictEqual(det.root, '/any/user/root');

  const { outDir, stats } = compileMCP({
    tools,
    name: 'filesystem',
    outRoot: tmp,
    mcpCommand: 'npx',
    mcpArgs: ['-y', '@modelcontextprotocol/server-filesystem', '/any/user/root'],
  });
  assert.strictEqual(stats.mode, 'direct-fs');
  assert.ok(stats.skillTokens < 800, 'direct-fs skill must be short: ' + stats.skillTokens);
  assert.ok(!fs.existsSync(path.join(outDir, 'mcp-call.js')), 'direct-fs must not ship mcp-call.js');
  const skill = skillBody(outDir);
  assert.ok(skill.includes('/any/user/root'));
  assert.ok(skill.includes('q.js'), 'direct-fs skill ships the q.js query kit');
  assert.ok(fs.existsSync(path.join(outDir, 'q.js')), 'q.js written');
  assert.ok(fs.existsSync(path.join(outDir, 'snapshot.js')), 'snapshot.js written');
  assert.ok(!skill.includes('orders.json'));
  assert.ok(!skill.includes('orders/'));
  assert.ok(!skill.includes('deliverd'));
  assert.ok(!skill.includes('totalRevenue'));
  assert.ok(!/npx -y/.test(skill));
  // non-fs name with fs tools still detected by tool set
  const det2 = detectFilesystemRoot(null, [], 'myfiles', tools);
  assert.strictEqual(det2.isFs, true);
  ok('filesystem MCP -> direct-fs general template (no hardcode, no bridge)');
}

// --- install replaces dest (no stale mcp-call.js) ---
{
  const skillDir = path.join(tmp, 'skills-home');
  const pkg = path.join(tmp, 'filesystem');
  // poison previous install
  const poison = path.join(skillDir, 'filesystem-cdc');
  fs.mkdirSync(poison, { recursive: true });
  fs.writeFileSync(path.join(poison, 'mcp-call.js'), 'STALE');
  fs.writeFileSync(path.join(poison, 'SKILL.md'), 'old');
  const r = run(['install', 'filesystem', '--root', tmp, '--skills-dir', skillDir]);
  assert.strictEqual(r.status, 0, r.stderr || r.stdout);
  assert.ok(!fs.existsSync(path.join(skillDir, 'filesystem-cdc', 'mcp-call.js')), 'stale mcp-call removed');
  assert.ok(fs.existsSync(path.join(skillDir, 'filesystem-cdc', 'SKILL.md')));
  const skill = skillBody(path.join(skillDir, 'filesystem-cdc'));
  assert.ok(skill.includes('direct') || skill.includes('fs'));
  ok('install clean-replaces skill dir');
}

// --- stats ---
{
  const r = run(['--stats', '--root', tmp, '--paper']);
  assert.strictEqual(r.status, 0, r.stderr || r.stdout);
  assert.ok(r.stdout.includes('estimated savings') || r.stdout.includes('You would have saved'));
  assert.ok(r.stdout.includes('Demo MCP') || r.stdout.includes('demo'));
  ok('cdc --stats --paper reports savings');
}

// --- stats json ---
{
  const r = run(['stats', '--root', tmp, '--json']);
  assert.strictEqual(r.status, 0, r.stderr);
  const j = JSON.parse(r.stdout);
  assert.ok(j.results.length >= 1);
  assert.ok(j.results[0].savings.tokensSaved > 0);
  ok('cdc stats --json');
}

// --- stats from tools dump ---
{
  const r = run(['--stats', '--tools', 'examples/sample-mcp-tools.json']);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('saved') || r.stdout.includes('Billed input'));
  ok('cdc --stats --tools');
}

// --- list ---
{
  const r = run(['list', '--root', tmp]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('demo'));
  ok('cdc list');
}

// --- openapi mini ---
{
  const mini = {
    openapi: '3.0.0',
    info: { title: 'Mini API', version: '1.0.0' },
    servers: [{ url: 'https://api.example.com' }],
    paths: {
      '/widgets': {
        get: {
          tags: ['widgets'],
          summary: 'List widgets',
          parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }],
          responses: {
            '200': {
              description: 'ok',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: { id: { type: 'integer' }, name: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  const specPath = path.join(tmp, 'mini.json');
  fs.writeFileSync(specPath, JSON.stringify(mini));
  const r = run(['make', specPath, '--name', 'mini', '--out', tmp]);
  assert.strictEqual(r.status, 0, r.stderr || r.stdout);
  const skill = skillBody(path.join(tmp, 'mini'));
  assert.ok(skill.includes('Mini API'));
  assert.ok(skill.includes('https://api.example.com'));
  ok('cdc make compiles mini OpenAPI');
}

// --- compile-mcp unit ---
{
  const { compileMCP, normalizeTools, tagOf, toolLooksPaginated } = require('../lib/compile-mcp');
  assert.strictEqual(tagOf('github_list_repos'), 'github');
  assert.strictEqual(tagOf('list_users'), 'list');
  const tools = normalizeTools({ tools: [{ name: 'a', inputSchema: { type: 'object' } }] });
  assert.strictEqual(tools.length, 1);
  const { stats } = compileMCP({
    tools: [
      {
        name: 'foo_bar',
        description: 'does foo',
        inputSchema: {
          type: 'object',
          properties: { x: { type: 'integer' } },
          required: ['x'],
        },
      },
    ],
    name: 'unit',
    outRoot: tmp,
  });
  assert.strictEqual(stats.tools, 1);
  assert.strictEqual(stats.mode, 'mcp');
  assert.strictEqual(stats.skillTier, 'cli', 'tiny surface is CLI tier');
  const skill = skillBody(path.join(tmp, 'unit'));
  assert.ok(skill.includes('Fast path') || skill.includes('Call (do this first)') || skill.includes('--batch'));
  assert.ok(!skill.includes('callPaged'), 'cli tier must not teach callPaged');
  assert.ok(!skill.includes('## Multi-step'), 'cli tier omits multi-step openSession block');
  assert.ok(stats.skillTokens < 700, 'cli skill stays tiny: ' + stats.skillTokens);
  // v2 optical semantics: a 1-tool surface must route TEXT under auto —
  // tiny skills never pay the vision floor (was: image emitted by default).
  assert.strictEqual(stats.skillMode, 'text', 'tiny surface stays text under auto');
  assert.ok(!stats.imagePrimary, 'no image primary for tiny surface');

  // bare limit is NOT pagination
  assert.strictEqual(
    toolLooksPaginated({
      name: 'top_gainers',
      description: 'top gainers',
      inputSchema: { type: 'object', properties: { limit: { type: 'integer' } } },
    }),
    false,
  );
  assert.strictEqual(
    toolLooksPaginated({
      name: 'list_users',
      description: 'List users. Use page to paginate.',
      inputSchema: {
        type: 'object',
        properties: { page: { type: 'integer' }, per_page: { type: 'integer' } },
      },
    }),
    true,
  );
  ok('compile-mcp unit helpers + cli tier');
}

// --- convert-win messaging ---
{
  const { buildConvertWin } = require('../lib/convert-win');
  const win = buildConvertWin(
    {
      name: 'github',
      tools: 90,
      skillTokens: 800,
      sourceTokens: 40000,
      definitionSavingsRatio: 50,
      skillTier: 'multi',
      mode: 'mcp',
    },
    { installed: ['/tmp/github-cdc'], warmed: true },
  );
  assert.ok(win.userNotice.includes('Disable') || win.userNotice.includes('disable'));
  assert.ok(win.text.includes('convert win'));
  assert.ok(win.howToUse.includes('OFF') || win.nextStep.includes('Disable'));
  const small = buildConvertWin({
    name: 'calc',
    tools: 2,
    skillTokens: 320,
    sourceTokens: 150,
    definitionSavingsRatio: 0.5,
    skillTier: 'cli',
  });
  assert.ok(small.userNotice.includes('CLI') || small.headline.includes('CLI'));
  ok('convert-win messaging');
}

// --- tui non-tty exits cleanly ---
{
  const r = run(['tui'], { input: '' });
  // non-tty should exit 1 with a helpful message
  assert.notStrictEqual(r.status, 0);
  assert.ok(
    (r.stderr + r.stdout).includes('interactive') || (r.stderr + r.stdout).includes('from-mcp'),
  );
  ok('cdc tui rejects non-tty');
}

// --- tui module exports ---
{
  const { runTui, banner } = require('../lib/tui');
  assert.strictEqual(typeof runTui, 'function');
  assert.strictEqual(typeof banner, 'function');
  ok('tui module exports');
}

// --- help / version ---
{
  const h = run(['help']);
  assert.strictEqual(h.status, 0);
  assert.ok(h.stdout.includes('from-mcp'));
  assert.ok(h.stdout.includes('tui') || h.stdout.includes('skill'));
  const v = run(['--version']);
  assert.strictEqual(v.status, 0);
  assert.ok(/\d+\.\d+\.\d+/.test(v.stdout.trim()));
  ok('help and version');
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${passed} passed`);

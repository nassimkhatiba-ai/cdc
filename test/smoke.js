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
  ]);
  assert.strictEqual(r.status, 0, r.stderr || r.stdout);
  assert.ok(fs.existsSync(path.join(tmp, 'demo', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(tmp, 'demo', 'CDC.md')));
  assert.ok(fs.existsSync(path.join(tmp, 'demo', 'stats.json')));
  assert.ok(fs.existsSync(path.join(tmp, 'demo', 'mcp-call.js')));
  const stats = JSON.parse(fs.readFileSync(path.join(tmp, 'demo', 'stats.json'), 'utf8'));
  assert.strictEqual(stats.source, 'mcp');
  assert.strictEqual(stats.mode, 'mcp');
  assert.strictEqual(stats.tools, 12);
  assert.ok(stats.skillTokens < stats.sourceTokens);
  assert.ok(stats.skillTokens < 600, 'bridge skill must stay short');
  const skill = fs.readFileSync(path.join(tmp, 'demo', 'SKILL.md'), 'utf8');
  assert.ok(!skill.includes('orders.json'), 'no demo hardcoding in general MCP skill');
  assert.ok(r.stdout.includes('skill') || r.stdout.includes('SKILL'));
  ok('from-mcp compiles sample tools (general bridge, short)');
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
  assert.ok(stats.skillTokens < 450, 'direct-fs skill must be short: ' + stats.skillTokens);
  assert.ok(!fs.existsSync(path.join(outDir, 'mcp-call.js')), 'direct-fs must not ship mcp-call.js');
  const skill = fs.readFileSync(path.join(outDir, 'SKILL.md'), 'utf8');
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
  const skill = fs.readFileSync(path.join(skillDir, 'filesystem-cdc', 'SKILL.md'), 'utf8');
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
  const skill = fs.readFileSync(path.join(tmp, 'mini', 'SKILL.md'), 'utf8');
  assert.ok(skill.includes('Mini API'));
  assert.ok(skill.includes('https://api.example.com'));
  ok('cdc make compiles mini OpenAPI');
}

// --- compile-mcp unit ---
{
  const { compileMCP, normalizeTools, tagOf } = require('../lib/compile-mcp');
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
  ok('compile-mcp unit helpers');
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

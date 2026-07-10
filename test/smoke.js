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
  assert.strictEqual(stats.tools, 12);
  assert.ok(stats.skillTokens < stats.sourceTokens);
  assert.ok(r.stdout.includes('skill') || r.stdout.includes('SKILL'));
  ok('from-mcp compiles sample tools');
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

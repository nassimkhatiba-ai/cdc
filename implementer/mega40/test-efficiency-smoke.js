#!/usr/bin/env node
/**
 * In-repo efficiency smoke (no Codex).
 * - compile tiny skill via lib/compile-mcp
 * - assert printJson in mcp-call, no fake a:1 placeholders
 * - chooseSkillMode tiny -> text
 * - run-mega40.js exists and contains CDC_REASONING / buildTextSkillInject
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const os = require('os');

const MEGA = __dirname;
const REPO = path.resolve(MEGA, '../..');

const { compileMCP } = require(path.join(REPO, 'lib/compile-mcp.js'));
const { chooseSkillMode } = require(path.join(REPO, 'lib/optical-pack.js'));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cdc-eff-smoke-'));
let passed = 0;
function ok(label) {
  passed += 1;
  console.log('  ok  ' + label);
}

function skillBody(dir) {
  const text = path.join(dir, 'SKILL.text.md');
  if (fs.existsSync(text)) return fs.readFileSync(text, 'utf8');
  return fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
}

console.log('efficiency smoke');
console.log('repo=' + REPO);
console.log('tmp=' + tmp);

// --- tiny skill compile ---
{
  const tools = [
    {
      name: 'add',
      description: 'Add two numbers',
      inputSchema: {
        type: 'object',
        properties: { a: { type: 'number' }, b: { type: 'number' } },
        required: ['a', 'b'],
      },
    },
    {
      name: 'mul',
      description: 'Multiply two numbers',
      inputSchema: {
        type: 'object',
        properties: { a: { type: 'number' }, b: { type: 'number' } },
        required: ['a', 'b'],
      },
    },
  ];
  const { outDir, stats } = compileMCP({
    tools,
    name: 'tiny-smoke',
    title: 'tiny-smoke',
    outRoot: tmp,
    mcpCommand: 'node',
    mcpArgs: ['-e', 'console.log("noop")'],
    imageMode: 'auto',
  });
  assert.ok(stats, 'compile returns stats');
  assert.strictEqual(stats.skillMode, 'text', 'tiny routes text: ' + (stats.skillModeReason || ''));

  const skill = skillBody(outDir);
  assert.ok(!/"a"\s*:\s*1/.test(skill), 'no fake "a":1 in skill body');
  assert.ok(!/"b"\s*:\s*1/.test(skill), 'no fake "b":1 in skill body');

  const bridge = fs.readFileSync(path.join(outDir, 'mcp-call.js'), 'utf8');
  assert.ok(bridge.includes('function printJson') || bridge.includes('printJson'), 'printJson in mcp-call.js');
  assert.ok(
    /pretty\s*\?\s*JSON\.stringify\(value,\s*null,\s*2\)\s*:\s*JSON\.stringify\(value\)/.test(bridge) ||
      bridge.includes('JSON.stringify(value)'),
    'printJson compact default present',
  );
  ok('tiny skill: text mode, printJson, no fake a:1');
}

// --- chooseSkillMode tiny -> text ---
{
  const tiny = chooseSkillMode({
    force: null,
    estVisionTokens: 800,
    textEquivalentTokens: 400,
    toolCount: 4,
  });
  assert.strictEqual(tiny.mode, 'text', 'tiny toolCount -> text: ' + tiny.reason);
  ok('chooseSkillMode tiny->text');
}

// --- run-mega40 surfaces ---
{
  const megaPath = path.join(MEGA, 'run-mega40.js');
  assert.ok(fs.existsSync(megaPath), 'run-mega40.js path exists: ' + megaPath);
  const src = fs.readFileSync(megaPath, 'utf8');
  assert.ok(src.includes('CDC_REASONING'), 'CDC_REASONING present');
  assert.ok(src.includes('buildTextSkillInject'), 'buildTextSkillInject present');
  ok('run-mega40.js: CDC_REASONING + buildTextSkillInject');
}

try {
  fs.rmSync(tmp, { recursive: true, force: true });
} catch {}

console.log('\n' + passed + ' passed');
console.log('efficiency smoke OK');
process.exit(0);

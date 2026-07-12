#!/usr/bin/env node
/**
 * Re-extract tokens/ans from existing mega40 arm logs after ANSI-tolerant fix.
 * Updates <arm>.run.json + <arm>.ans.json only when existing tokens is null
 * and re-extracted tokens is a number.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const { extractTokens, extractJson } = require('../mega40/run-mega40.js');

const HOMES = path.resolve(__dirname, '../mega40/homes');
const ARMS = ['mcp', 'text', 'image'];

function preferKeysFor(home) {
  const sk = path.join(home, 'score_keys.json');
  try {
    const keys = JSON.parse(fs.readFileSync(sk, 'utf8'));
    if (Array.isArray(keys) && keys.length) return keys;
  } catch {}
  try {
    const truth = JSON.parse(fs.readFileSync(path.join(home, 'truth.json'), 'utf8'));
    if (truth && typeof truth === 'object') return Object.keys(truth);
  } catch {}
  return null;
}

let updated = 0;
for (const id of fs.readdirSync(HOMES).sort()) {
  const home = path.join(HOMES, id);
  const outDir = path.join(home, 'out');
  if (!fs.statSync(home).isDirectory() || !fs.existsSync(outDir)) continue;

  const preferKeys = preferKeysFor(home);

  for (const arm of ARMS) {
    const logPath = path.join(outDir, arm + '.log');
    const runPath = path.join(outDir, arm + '.run.json');
    if (!fs.existsSync(logPath) || !fs.existsSync(runPath)) continue;

    let run;
    try {
      run = JSON.parse(fs.readFileSync(runPath, 'utf8'));
    } catch {
      continue;
    }
    if (run.tokens != null) continue;

    const text = fs.readFileSync(logPath, 'utf8');
    const tokens = extractTokens(text);
    if (typeof tokens !== 'number' || Number.isNaN(tokens)) continue;

    const ans = extractJson(text, preferKeys);
    run.tokens = tokens;
    run.ans = ans;
    fs.writeFileSync(runPath, JSON.stringify(run, null, 2) + '\n');
    fs.writeFileSync(path.join(outDir, arm + '.ans.json'), JSON.stringify(ans, null, 2) + '\n');
    console.log('updated ' + path.relative(process.cwd(), runPath) + ' tokens=' + tokens);
    updated++;
  }
}
console.log('reextract done, updated=' + updated);

#!/usr/bin/env node
// q.js — tiny data toolkit for CDC scripts. Zero deps. Node 18+.
// API: q.ROOT, q.load(p), q.files(dir), q.index(rows,key), q.sumBy, q.groupBy,
//      q.round2, q.assertNonEmpty
// CLI: node q.js recon [dir]   — live layout snapshot (bounded)
//      node q.js head <file> [n] — first n records/lines (default 3)
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CDC_FS_ROOT || process.cwd();

function abs(p) { return path.isAbsolute(p) ? p : path.join(ROOT, p); }

/** Load a data file: .json (array, or object wrapping one array), .ndjson, .csv/.tsv. */
function load(p) {
  p = abs(p);
  const raw = fs.readFileSync(p, 'utf8');
  const ext = path.extname(p).toLowerCase();
  if (ext === '.csv' || ext === '.tsv') return parseCsv(raw, ext === '.tsv' ? '\t' : ',');
  if (ext === '.ndjson') return raw.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const j = JSON.parse(raw);
  if (Array.isArray(j)) return j;
  if (j && typeof j === 'object') {
    const arrays = Object.values(j).filter(Array.isArray);
    if (arrays.length === 1) return arrays[0];
  }
  return j;
}

function parseCsv(raw, sep) {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = splitCsvLine(lines[0], sep);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, sep);
    const row = {};
    header.forEach((h, i) => {
      const v = cells[i];
      row[h] = v !== '' && v !== undefined && !isNaN(Number(v)) ? Number(v) : v;
    });
    return row;
  });
}

function splitCsvLine(line, sep) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === sep) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function files(dir) { return fs.readdirSync(abs(dir)).sort(); }

/** Key-coercing index: q.index(products,'id').get(order.product_id) always
 *  matches regardless of number/string key types. */
function index(rows, key) {
  const m = new Map();
  for (const r of rows) m.set(String(r[key]), r);
  return { get: (k) => m.get(String(k)), has: (k) => m.has(String(k)), size: m.size, map: m };
}

function sumBy(rows, f) {
  const fn = typeof f === 'function' ? f : (r) => r[f];
  let s = 0;
  for (const r of rows) s += Number(fn(r)) || 0;
  return s;
}

function groupBy(rows, f) {
  const fn = typeof f === 'function' ? f : (r) => r[f];
  const m = new Map();
  for (const r of rows) {
    const k = String(fn(r));
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}

function round2(n) { return Math.round(n * 100) / 100; }

/** A metric that comes out empty/zero is a bug until proven otherwise. */
function assertNonEmpty(x, label = 'result') {
  const n = x == null ? 0 : Array.isArray(x) ? x.length : (x.size ?? Number(x) ?? 0);
  if (!n) {
    throw new Error(
      label + ' is empty/zero — probable field-name, value, or join-key mismatch. ' +
      'Re-check the layout snapshot (field names, enum values); q.index coerces key types.'
    );
  }
  return x;
}

module.exports = { ROOT, load, files, index, sumBy, groupBy, round2, assertNonEmpty };

if (require.main === module) {
  const [cmd, arg, n] = process.argv.slice(2);
  if (cmd === 'recon') {
    const { snapshotFs } = require(path.join(__dirname, 'snapshot.js'));
    const s = snapshotFs(arg ? abs(arg) : ROOT);
    console.log(s.ok ? s.cdcBlock : 'root not found');
  } else if (cmd === 'head' && arg) {
    const d = load(arg);
    console.log(JSON.stringify(Array.isArray(d) ? d.slice(0, Number(n) || 3) : d, null, 1).slice(0, 2000));
  } else {
    console.log('usage: node q.js recon [dir] | node q.js head <file> [n]');
  }
}

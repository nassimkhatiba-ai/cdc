#!/usr/bin/env node
/**
 * After mega40 PHASE=all, write results-mega40-optical-v2.md comparing
 * MCP / text / image (forced optical pack) and an auto-routed aggregate.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const MEGA = __dirname;
const ROOT = path.resolve(MEGA, '../..');
const TARGETS = JSON.parse(fs.readFileSync(path.join(MEGA, 'targets.json'), 'utf8'));
const RESULTS = path.join(MEGA, 'results');
const MODEL = process.env.CODEX_MODEL || 'gpt-5.6-sol';

function safeJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function scoreValue(key, got, expect, ans) {
  if (key.endsWith('_min')) {
    const base = key.replace(/_min$/, '');
    const n = ans && (ans[base] != null ? ans[base] : ans[key]);
    if (typeof expect === 'number') {
      if (typeof n === 'number') return n >= expect;
      if (typeof got === 'boolean') return got === true;
      if (typeof got === 'number') return got >= expect;
    }
    return false;
  }
  if (Array.isArray(expect)) {
    if (!Array.isArray(got)) return false;
    return [...got].map(String).sort().join('\0') === [...expect].map(String).sort().join('\0');
  }
  if (typeof expect === 'number') {
    const n = typeof got === 'number' ? got : Number(got);
    if (!Number.isFinite(n)) return false;
    return Math.abs(n - expect) < 0.05 || Math.abs(n - expect) / (Math.abs(expect) || 1) < 0.002;
  }
  if (typeof expect === 'boolean') return got === expect;
  return got === expect;
}

function scoreArm(t, ans) {
  const keys = t.score_keys || Object.keys(t.truth);
  let ok = 0;
  const detail = {};
  for (const k of keys) {
    let got = ans ? ans[k] : undefined;
    if (k === 'tool_count_min' && ans && ans.tool_count != null) got = ans.tool_count;
    if (k === 'file_count_min' && ans && ans.file_count != null) got = ans.file_count;
    if (k === 'thought_steps_min' && ans && ans.thought_steps != null) got = ans.thought_steps;
    if (k === 'allowed_count_min' && ans && ans.allowed_count != null) got = ans.allowed_count;
    const good = scoreValue(k, got, t.truth[k], ans);
    detail[k] = good;
    if (good) ok++;
  }
  return { ok, total: keys.length, detail, score: ok + '/' + keys.length };
}

function loadPackMeta(skill) {
  const p = path.join(MEGA, 'skills-image', skill, 'image-meta.json');
  return safeJson(p);
}

function wouldAutoRouteImage(meta, t) {
  // Prefer logged router decision if present
  if (meta) {
    if (meta.imagePrimary === true) return true;
    if (meta.imagePrimary === false) return false;
    if (meta.route === 'image' || meta.decision === 'image') return true;
    if (meta.route === 'text' || meta.decision === 'text') return false;
  }
  // Fallback: no pages => text
  if (!meta || !meta.pages) return false;
  return !!meta.imagePrimary;
}

const rows = [];
for (const t of TARGETS) {
  const home = path.join(MEGA, 'homes', t.id);
  const row = { target: t.id, skill: t.skill, arms: {}, pack: loadPackMeta(t.skill) };
  for (const arm of ['mcp', 'text', 'image']) {
    const run = safeJson(path.join(home, 'out', arm + '.run.json'));
    if (!run) continue;
    const s = scoreArm(t, run.ans);
    row.arms[arm] = {
      tokens: run.tokens, wall: run.secs, exit: run.exit,
      score: s.score, ok: s.ok, total: s.total, detail: s.detail,
    };
  }
  // auto pick: use image arm tokens if pack would be image-primary, else text
  const useImage = wouldAutoRouteImage(row.pack, t);
  const pick = useImage ? row.arms.image : row.arms.text;
  row.auto = pick
    ? { mode: useImage ? 'image' : 'text', tokens: pick.tokens, wall: pick.wall, score: pick.score, ok: pick.ok, total: pick.total }
    : null;
  rows.push(row);
}

function agg(armKey) {
  const withTok = rows.filter((r) => r.arms[armKey] && r.arms[armKey].tokens != null);
  const withScore = rows.filter((r) => r.arms[armKey]);
  const tokSum = withTok.reduce((s, r) => s + r.arms[armKey].tokens, 0);
  const wallSum = withTok.reduce((s, r) => s + (r.arms[armKey].wall || 0), 0);
  const okSum = withScore.reduce((s, r) => s + (r.arms[armKey].ok || 0), 0);
  const totSum = withScore.reduce((s, r) => s + (r.arms[armKey].total || 0), 0);
  return {
    n: withScore.length,
    n_tok: withTok.length,
    tokens_avg: withTok.length ? Math.round(tokSum / withTok.length) : null,
    wall_avg: withTok.length ? +(wallSum / withTok.length).toFixed(1) : null,
    accuracy: totSum ? okSum + '/' + totSum : null,
    accuracy_pct: totSum ? +((100 * okSum) / totSum).toFixed(1) : null,
    tokens_sum: tokSum,
  };
}

function aggAuto() {
  const withTok = rows.filter((r) => r.auto && r.auto.tokens != null);
  const withScore = rows.filter((r) => r.auto);
  const tokSum = withTok.reduce((s, r) => s + r.auto.tokens, 0);
  const wallSum = withTok.reduce((s, r) => s + (r.auto.wall || 0), 0);
  const okSum = withScore.reduce((s, r) => s + (r.auto.ok || 0), 0);
  const totSum = withScore.reduce((s, r) => s + (r.auto.total || 0), 0);
  const nImage = withScore.filter((r) => r.auto.mode === 'image').length;
  return {
    n: withScore.length,
    n_tok: withTok.length,
    n_image: nImage,
    n_text: withScore.length - nImage,
    tokens_avg: withTok.length ? Math.round(tokSum / withTok.length) : null,
    wall_avg: withTok.length ? +(wallSum / withTok.length).toFixed(1) : null,
    accuracy: totSum ? okSum + '/' + totSum : null,
    accuracy_pct: totSum ? +((100 * okSum) / totSum).toFixed(1) : null,
    tokens_sum: tokSum,
  };
}

const sums = { mcp: agg('mcp'), text: agg('text'), image: agg('image'), auto: aggAuto() };
const dash = (v) => (v == null ? '-' : v);

const md = `# mega40 optical v2 full suite

**Model:** \`${MODEL}\`  
**When:** ${new Date().toISOString()}  
**Targets:** ${rows.length}  
**Image arm:** forced optical pack (\`--mode image\`, tile-budgeted dense DSL)  
**Auto column:** post-hoc pick text vs image using pack \`imagePrimary\` (convert-time router)

## Aggregate

| arm | n | avg tokens | avg wall (s) | accuracy |
|-----|---|------------|--------------|----------|
| MCP | ${sums.mcp.n} | ${dash(sums.mcp.tokens_avg)} | ${dash(sums.mcp.wall_avg)} | ${dash(sums.mcp.accuracy)} (${dash(sums.mcp.accuracy_pct)}%) |
| text CDC | ${sums.text.n} | ${dash(sums.text.tokens_avg)} | ${dash(sums.text.wall_avg)} | ${dash(sums.text.accuracy)} (${dash(sums.text.accuracy_pct)}%) |
| image optical v2 | ${sums.image.n} | ${dash(sums.image.tokens_avg)} | ${dash(sums.image.wall_avg)} | ${dash(sums.image.accuracy)} (${dash(sums.image.accuracy_pct)}%) |
| **auto (routed)** | ${sums.auto.n} | ${dash(sums.auto.tokens_avg)} | ${dash(sums.auto.wall_avg)} | ${dash(sums.auto.accuracy)} (${dash(sums.auto.accuracy_pct)}%) |

Auto mix: ${sums.auto.n_image} image / ${sums.auto.n_text} text.

### Ratios (avg tokens)
| | |
|--|--|
| MCP / text | ${sums.mcp.tokens_avg && sums.text.tokens_avg ? (sums.mcp.tokens_avg / sums.text.tokens_avg).toFixed(2) : 'n/a'} |
| MCP / image | ${sums.mcp.tokens_avg && sums.image.tokens_avg ? (sums.mcp.tokens_avg / sums.image.tokens_avg).toFixed(2) : 'n/a'} |
| text / image | ${sums.text.tokens_avg && sums.image.tokens_avg ? (sums.text.tokens_avg / sums.image.tokens_avg).toFixed(2) : 'n/a'} |
| MCP / auto | ${sums.mcp.tokens_avg && sums.auto.tokens_avg ? (sums.mcp.tokens_avg / sums.auto.tokens_avg).toFixed(2) : 'n/a'} |
| auto vs text savings | ${sums.text.tokens_avg && sums.auto.tokens_avg ? ((1 - sums.auto.tokens_avg / sums.text.tokens_avg) * 100).toFixed(1) + '%' : 'n/a'} |

## Per-target

| target | mcp | text | image | auto | mcp score | text score | image score | pack vision | pages |
|--------|----:|-----:|------:|------|-----------|------------|-------------|------------:|------:|
${rows.map((r) => {
  const m = r.arms.mcp, tx = r.arms.text, im = r.arms.image, a = r.auto, p = r.pack;
  return `| ${r.target} | ${dash(m && m.tokens)} | ${dash(tx && tx.tokens)} | ${dash(im && im.tokens)} | ${a ? a.mode + ' ' + dash(a.tokens) : '-'} | ${dash(m && m.score)} | ${dash(tx && tx.score)} | ${dash(im && im.score)} | ${dash(p && p.approxVisionTokens)} | ${dash(p && p.pages)} |`;
}).join('\n')}

## Hard multi-system

${['complex', 'nova'].map((id) => {
  const r = rows.find((x) => x.target === id);
  if (!r) return '- ' + id + ': missing';
  const f = (arm) => r.arms[arm] ? r.arms[arm].tokens + ' tok / ' + r.arms[arm].wall + 's / ' + r.arms[arm].score : 'n/a';
  return '- **' + id + '**: MCP ' + f('mcp') + ' · text ' + f('text') + ' · image ' + f('image') + ' · auto ' + (r.auto ? r.auto.mode + ' ' + r.auto.tokens : 'n/a');
}).join('\n')}

## Notes

- Optical packer: \`lib/optical-pack.js\` (tile budget, dense DSL, width ~504).
- Forced image arm measures packer quality; auto column is the product default story.
- Re-run: \`CODEX_MODEL=gpt-5.6-sol PHASE=all PARALLEL=2 node implementer/mega40/run-mega40.js\`
- Then: \`node implementer/mega40/score-optical-v2-report.js\`

## Files
- scored raw: \`implementer/mega40/results/scored.json\`
- this report: \`implementer/mega40/results/results-mega40-optical-v2.md\`
`;

fs.mkdirSync(RESULTS, { recursive: true });
fs.writeFileSync(path.join(RESULTS, 'results-mega40-optical-v2.md'), md);
fs.writeFileSync(path.join(ROOT, 'results-mega40-optical-v2.md'), md);
fs.writeFileSync(path.join(RESULTS, 'optical-v2-summary.json'), JSON.stringify({ when: new Date().toISOString(), model: MODEL, sums, rows }, null, 2));
console.log(JSON.stringify(sums, null, 2));
console.log('wrote', path.join(RESULTS, 'results-mega40-optical-v2.md'));

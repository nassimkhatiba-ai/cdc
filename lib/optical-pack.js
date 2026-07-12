// optical-pack — tile-budgeted, content-compressed optical skill packer.
//
// Replaces "screenshot of SKILL.md" with a packer optimized for billed
// vision cost:
//
//   1. CONTENT: a machine-dense DSL built from tool definitions (names,
//      param skeletons, hard rules, traps) — not prose markdown. Roughly
//      halves chars before a single pixel is rendered.
//   2. GEOMETRY: pages sized to survive provider preprocessing UNCHANGED.
//      Assumed provider model (documented, configurable):
//        - image auto-resized to fit 2048x2048, then shortest side capped
//          at 768 (OpenAI-style detail:high pipeline)
//        - billed per 512px tile of the RESIZED image: BASE + PER_TILE*tiles
//      The old packer rendered 1228x3600 pages: provider shrank them to
//      ~698x2048 (glyphs 12px -> ~6.8px = blur = accuracy loss) and billed
//      2x4 tiles anyway. We render width 504 (1 tile col, crisp) and height
//      <= 2040 (<= 4 tile rows), so what we rasterize is what the model sees.
//   3. DENSITY LADDER: scale 2 (12px glyphs) first; scale 1 (6px) only when
//      it wins tokens AND the caller allows it (minScale knob) — tiny fonts
//      are an accuracy gamble that must stay opt-in-able.
//   4. METRICS: every pack writes tiles / est vision tokens / text-token
//      equivalent / compression ratio / whether the tile budget was met.
//
// Also home of the AUTO ROUTER: image is primary only when its estimated
// vision cost beats the text-equivalent information cost with margin.
// Tiny skills must never pay the vision floor (mega40: text ~3.4k vs
// image ~7k on stringops/hash/queue/cache).
'use strict';

const fs = require('fs');
const path = require('path');
const { linesToPng, wrapLines } = require('./cdc-image');
const { estimateTokens } = require('./tokens');

// ---------- provider billing model (assumptions; tune per provider) ----------
const PROVIDER = {
  tile: 512,
  base: 85,
  perTile: 170,
  fitLong: 2048,   // images are shrunk to fit this square first
  shortCap: 768,   // then shortest side capped here
};

function providerVisionTokens(w, h, P = PROVIDER) {
  let s = Math.min(1, P.fitLong / Math.max(w, h));
  let w2 = Math.round(w * s), h2 = Math.round(h * s);
  const short = Math.min(w2, h2);
  if (short > P.shortCap) {
    const s2 = P.shortCap / short;
    w2 = Math.round(w2 * s2);
    h2 = Math.round(h2 * s2);
  }
  const tiles = Math.ceil(w2 / P.tile) * Math.ceil(h2 / P.tile);
  return { tokens: P.base + P.perTile * tiles, tiles, w2, h2, downscaled: w2 !== w || h2 !== h };
}

// ---------- content compression: tool defs -> dense DSL ----------
function sigOf(tool) {
  const schema = tool.inputSchema || tool.input_schema || {};
  const props = schema.properties || {};
  const required = new Set(schema.required || []);
  const parts = Object.entries(props).slice(0, 9).map(([k, p]) => {
    p = p || {};
    let hint = '';
    if (p.enum) hint = ':' + p.enum.slice(0, 5).join('|');
    else if (p.type === 'array' || p.items) hint = ':[]';
    else if (p.type === 'object' || p.properties) hint = ':{}';
    else if (p.type && p.type !== 'string') hint = ':' + (Array.isArray(p.type) ? p.type[0] : p.type);
    return k + (required.has(k) ? '*' : '') + hint;
  });
  const extra = Object.keys(props).length - 9;
  return '(' + parts.join(',') + (extra > 0 ? ',+' + extra : '') + ')';
}

function tinyDesc(tool, max = 40) {
  let d = String(tool.description || '').replace(/\s+/g, ' ').trim();
  if (!d) return '';
  const m = d.match(/^(.{8,}?[.!?])(?:\s|$)/);
  if (m) d = m[1];
  d = d
    .replace(/^(Returns?|Gets?|Retrieves?|Lists?|Fetch(?:es)?|Use this tool to|This tool)\s+(the|a|an)?\s*/i, (s) => s.match(/^(Returns?|Gets?|Retrieves?|Lists?|Fetch(?:es)?)/i) ? s.match(/^\w+/)[0] + ' ' : '')
    .replace(/[.\s]+$/, '');
  if (d.length > max) d = d.slice(0, max - 1) + '…';
  return d;
}

function tagOfName(n) {
  const m = String(n).match(/^([a-zA-Z][a-zA-Z0-9]*)[_.]/);
  return m ? m[1] : 'misc';
}

/**
 * Dense skill body. Every line earns its pixels: header, bridge invocation,
 * compressed rules, traps, then one line per tool grouped by prefix.
 */
function compactBody({ name, title, tools, extraLines = [] }) {
  const L = [];
  L.push(`CDC OPTICAL SKILL ${name} - ${title || name} - ${tools ? tools.length : 0} tools. This image IS the skill body.`);
  L.push(`BRIDGE node $SKILL/mcp-call.js ($SKILL = this skill folder):`);
  L.push(`  one-off: <tool> '<json-args>'   batch: --batch '[{"tool":"t","args":{}}]'`);
  L.push(`  scripts: const {openSession,callPaged}=require('$SKILL/mcp-call.js'); s=await openSession(); s.call(t,args); s.close()`);
  L.push('RULES 1 session/script | lists paginate: callPaged = ALL pages, never page 1 | named resource: direct lookup, never search |');
  L.push('  extract values from tool prose | print ONLY final compact JSON, exact requested shape | empty/0 = bug | max 2 runs');
  for (const x of extraLines) L.push(x);
  if (tools && tools.length) {
    L.push('TOOLS  name(param, * = required, :type)  desc');
    const byTag = new Map();
    for (const t of tools) {
      const tag = tagOfName(t.name);
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag).push(t);
    }
    for (const tag of [...byTag.keys()].sort()) {
      const group = byTag.get(tag);
      L.push(`>${tag}`);
      for (const t of group) {
        const d = tinyDesc(t);
        L.push(` ${t.name}${sigOf(t)}${d ? ' ' + d : ''}`);
      }
    }
  }
  return L.join('\n');
}

/** Fallback compaction for callers without raw tool defs: strip markdown chrome. */
function compactMarkdown(md) {
  return String(md)
    .replace(/^---[\s\S]*?---\n/, '')
    .replace(/^```.*$/gm, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/^\s*$\n/gm, '')
    .trim();
}

// ---------- tile-aware pagination ----------
const GLYPH_W = 6;  // 5px glyph + 1px gap, at scale 1
const GLYPH_H = 8;  // 7px glyph + 1px gap, at scale 1

/** The bitmap font is ASCII-only; anything else renders as '?'. Map common
 *  typographic characters down instead of corrupting the page. */
function asciiSanitize(text) {
  return String(text)
    .replace(/[»›]/g, '>')
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/[·•]/g, '|')
    .replace(/⚠/g, '!')
    .replace(/[✔✓]/g, 'OK')
    .replace(/×/g, 'x')
    .replace(/[^\x20-\x7E\n]/g, '?');
}

function layout(text, { scale, width, pad, maxPageHeight }) {
  text = asciiSanitize(text);
  const cellW = GLYPH_W * scale;
  const cellH = GLYPH_H * scale;
  const cols = Math.floor((width - pad * 2) / cellW);
  const linesPerPage = Math.floor((maxPageHeight - pad * 2) / cellH);
  const lines = wrapLines(text, cols);
  const pages = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  return { cols, linesPerPage, pages, cellH };
}

/**
 * Choose geometry: try ladder configs, estimate REAL billed tokens per page
 * (short last pages bill fewer tile rows), pick the cheapest allowed.
 */
function planOptical(text, opts = {}) {
  const pad = opts.pad != null ? opts.pad : 8;
  const maxPageHeight = opts.maxPageHeight || 2040;
  // Default 2: a live legibility probe showed 6px glyphs corrupt tool names
  // (g/q, y/u confusion) — exactness matters more than the last 2x density.
  // CDC_OPTICAL_MIN_SCALE=1 opts into the dense rung.
  const minScale = opts.minScale || parseInt(process.env.CDC_OPTICAL_MIN_SCALE || '2', 10);
  const tileBudget = opts.tileBudget || parseInt(process.env.CDC_OPTICAL_TILE_BUDGET || '12', 10);
  const P = opts.provider || PROVIDER;

  const ladder = [
    { scale: 2, width: 504 },  // crisp 12px glyphs, 1 tile col
    { scale: 2, width: 760 },  // crisp, 2 tile cols (fewer pages for wide lines)
    { scale: 1, width: 504 },  // dense 6px glyphs, 1 tile col — highest compression
  ].filter((c) => c.scale >= minScale);

  const plans = ladder.map((cfg) => {
    const l = layout(text, { ...cfg, pad, maxPageHeight });
    let tokens = 0, tiles = 0;
    const pageDims = l.pages.map((pageLines) => {
      const h = pageLines.length * l.cellH + pad * 2;
      const est = providerVisionTokens(cfg.width, h, P);
      tokens += est.tokens;
      tiles += est.tiles;
      return { w: cfg.width, h, tiles: est.tiles, downscaled: est.downscaled };
    });
    return { ...cfg, pad, maxPageHeight, cols: l.cols, pages: l.pages.length, pageDims, estVisionTokens: tokens, tiles };
  });

  plans.sort((a, b) => a.estVisionTokens - b.estVisionTokens || b.scale - a.scale);
  const plan = plans[0];
  plan.budgetMet = plan.tiles <= tileBudget;
  plan.tileBudget = tileBudget;
  plan.alternatives = plans.slice(1).map((p) => ({ scale: p.scale, width: p.width, pages: p.pages, estVisionTokens: p.estVisionTokens }));
  return plan;
}

/** Render + write pages per plan. Returns meta with full pack metrics. */
function writeOptical(outBase, text, opts = {}) {
  const plan = planOptical(text, opts);
  const l = layout(text, plan);
  const cdcPath = outBase.endsWith('.cdc') ? outBase : outBase + '.cdc';
  fs.mkdirSync(path.dirname(cdcPath) || '.', { recursive: true });

  // Remove stale extra pages from previous (bigger) builds — a leftover
  // page-002 once got attached alongside a fresh single-page build.
  const dir = path.dirname(cdcPath);
  const stem = path.basename(cdcPath, '.cdc');
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith(stem + '.page-') && f.endsWith('.cdc.png')) {
      try { fs.unlinkSync(path.join(dir, f)); } catch {}
    }
  }

  const pngPaths = [];
  l.pages.forEach((pageLines, idx) => {
    const n = idx + 1;
    const header = l.pages.length > 1 ? [`[optical skill page ${n}/${l.pages.length}]`] : [];
    const rendered = linesToPng([...header, ...pageLines], {
      scale: plan.scale,
      maxCols: plan.cols,
      pad: plan.pad,
      lineGap: GLYPH_H - 7, // renderer uses (7 + lineGap); our cell is GLYPH_H
    });
    if (n === 1) {
      fs.writeFileSync(cdcPath, rendered.png);
      const alias = cdcPath.replace(/\.cdc$/, '.cdc.png');
      fs.writeFileSync(alias, rendered.png);
      pngPaths.push(alias);
    } else {
      const extra = cdcPath.replace(/\.cdc$/, `.page-${String(n).padStart(3, '0')}.cdc.png`);
      fs.writeFileSync(extra, rendered.png);
      pngPaths.push(extra);
    }
  });

  const approxTextTokens = estimateTokens(text);
  const meta = {
    format: 'cdc-optical-skill',
    version: 2,
    cdc: cdcPath,
    pageFiles: pngPaths,
    pages: l.pages.length,
    width: plan.width,
    scale: plan.scale,
    cols: plan.cols,
    pageDims: plan.pageDims,
    tiles: plan.tiles,
    tileBudget: plan.tileBudget,
    budgetMet: plan.budgetMet,
    estVisionTokens: plan.estVisionTokens,
    sourceChars: text.length,
    approxTextTokens,
    visionVsTextRatio: +(plan.estVisionTokens / Math.max(1, approxTextTokens)).toFixed(2),
    provider: opts.provider || PROVIDER,
    providerNote: 'assumes fit-2048 then shortest-side-768 resize, 512px tiles, base+perTile billing; pages sized to avoid any resize',
    alternatives: plan.alternatives,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(cdcPath + '.json', JSON.stringify(meta, null, 2));
  return meta;
}

// ---------- auto router ----------
/**
 * Decide the primary skill mode.
 * textEquivalentTokens: what the text path pays for the SAME information the
 * image carries (skill body + tool index when the index is not inlined).
 *
 * Defaults are text-primary: image only when the surface is fat enough that
 * pack vision + session prior clearly beats text (mega40 auto over-routed at
 * minTools=8 / margin=0.85 and lost on suite aggregate).
 * turnPrior=600: vision re-bills across turns; 400 still under-penalized image.
 */
function chooseSkillMode({ force, estVisionTokens, textEquivalentTokens, toolCount }) {
  const margin = parseFloat(process.env.CDC_OPTICAL_MARGIN || '0.70');
  const minTools = parseInt(process.env.CDC_OPTICAL_MIN_TOOLS || '20', 10);
  // Flat session prior: vision attaches re-bill across turns; pack-only est
  // understates live cost vs text skill sed/load.
  const turnPrior = parseInt(process.env.CDC_OPTICAL_TURN_PRIOR || '600', 10);
  const pointerTokens = 160; // hot-path SKILL.md the agent always reads
  if (force === 'text') return { mode: 'text', reason: 'forced text' };
  if (force === 'image') return { mode: 'image', reason: 'forced image' };
  if (toolCount < minTools) {
    return { mode: 'text', reason: `tiny surface (${toolCount} tools < ${minTools}): vision floor not worth it` };
  }
  const visionCost = estVisionTokens + pointerTokens + turnPrior;
  if (visionCost < textEquivalentTokens * margin) {
    return {
      mode: 'image',
      reason: `optical ${estVisionTokens}+${pointerTokens} ptr+${turnPrior} prior < ${textEquivalentTokens} text-equiv × ${margin}`,
    };
  }
  return {
    mode: 'text',
    reason: `optical ${estVisionTokens}+${pointerTokens} ptr+${turnPrior} prior not < ${textEquivalentTokens} text-equiv × ${margin}`,
  };
}

module.exports = {
  PROVIDER,
  providerVisionTokens,
  compactBody,
  compactMarkdown,
  planOptical,
  writeOptical,
  chooseSkillMode,
};

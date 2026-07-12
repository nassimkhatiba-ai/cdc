#!/usr/bin/env node
/**
 * CDC-auto aggregate over mega40 scored.json
 * IMAGE arm for: playwright, tradingview, complex, nova (4 targets)
 * TEXT arm for the other 36 (chromedevtools ��� text)
 * Also reports textOnly totals (all 40 on text arm) for reference.
 */
const fs = require('fs');
const path = require('path');

const SCORED = path.join(__dirname, '../mega40/results/scored.json');
const OUT = path.join(__dirname, 'aggregate.json');

const IMAGE_TARGETS = new Set([
  'playwright',
  'tradingview',
  'complex',
  'nova',
]);

const scored = JSON.parse(fs.readFileSync(SCORED, 'utf8'));

function tok(v) {
  if (v == null || Number.isNaN(Number(v))) return null;
  return Number(v);
}

function scoreFrac(arm) {
  if (!arm || !arm.total) return 0;
  return (arm.ok || 0) / arm.total;
}

function scoreStr(arm) {
  if (!arm) return null;
  return arm.score != null ? arm.score : `${arm.ok || 0}/${arm.total || 0}`;
}

const failures = [];
const rows = [];

let mcpTotal = 0;
let autoTotal = 0;
let mcpScoreSum = 0;
let autoScoreSum = 0;
let mcpWallSum = 0;
let autoWallSum = 0;
let n = 0;

let textOnlyTotal = 0;
let textOnlyScoreSum = 0;
let textOnlyWallSum = 0;

for (const row of scored) {
  const id = row.target;
  const autoArm = IMAGE_TARGETS.has(id) ? 'image' : 'text';
  const mcpArm = row.arms?.mcp || {};
  const chosen = row.arms?.[autoArm] || {};
  const textArm = row.arms?.text || {};

  const mcpTok = tok(mcpArm.tokens);
  const autoTok = tok(chosen.tokens);
  const textTok = tok(textArm.tokens);
  const mcpWall = tok(mcpArm.wall) || 0;
  const autoWall = tok(chosen.wall) || 0;
  const textWall = tok(textArm.wall) || 0;

  if (mcpTok == null) failures.push({ id, arm: 'mcp', reason: 'null/0 tokens', exit: mcpArm.exit });
  if (autoTok == null) failures.push({ id, arm: autoArm, reason: 'null/0 tokens', exit: chosen.exit });
  if (textTok == null) failures.push({ id, arm: 'textOnly', reason: 'null/0 tokens', exit: textArm.exit });

  const mcpTokN = mcpTok || 0;
  const autoTokN = autoTok || 0;
  const textTokN = textTok || 0;

  mcpTotal += mcpTokN;
  autoTotal += autoTokN;
  textOnlyTotal += textTokN;
  mcpScoreSum += scoreFrac(mcpArm);
  autoScoreSum += scoreFrac(chosen);
  textOnlyScoreSum += scoreFrac(textArm);
  mcpWallSum += mcpWall;
  autoWallSum += autoWall;
  textOnlyWallSum += textWall;
  n += 1;

  const gainPct = autoTokN > 0 ? (mcpTokN / autoTokN - 1) * 100 : null;
  rows.push({
    id,
    mcpTok: mcpTok,
    autoArm,
    autoTok: autoTok,
    mcpScore: scoreStr(mcpArm),
    autoScore: scoreStr(chosen),
    mcpScoreFrac: scoreFrac(mcpArm),
    autoScoreFrac: scoreFrac(chosen),
    mcpWall,
    autoWall,
    gainPct,
  });
}

const mcpAvg = n ? mcpTotal / n : 0;
const autoAvg = n ? autoTotal / n : 0;
const efficiencyGainPct = autoTotal > 0 ? (mcpTotal / autoTotal - 1) * 100 : null;
const textOnlyAvg = n ? textOnlyTotal / n : 0;
const textOnlyEfficiencyGainPct = textOnlyTotal > 0 ? (mcpTotal / textOnlyTotal - 1) * 100 : null;

const byGain = [...rows].filter((r) => r.gainPct != null).sort((a, b) => b.gainPct - a.gainPct);
const largestGains = byGain.slice(0, 10);
const smallestGains = byGain.slice(-10).reverse();

const aggregate = {
  n,
  imageTargets: [...IMAGE_TARGETS],
  mcpTotal,
  mcpAvg,
  autoTotal,
  autoAvg,
  efficiencyGainPct,
  accuracy: {
    mcpScoreSum,
    autoScoreSum,
    mcpAvgFrac: n ? mcpScoreSum / n : 0,
    autoAvgFrac: n ? autoScoreSum / n : 0,
    // summed score fractions (as requested)
    mcp: mcpScoreSum,
    auto: autoScoreSum,
  },
  wall: {
    mcpAvgSec: n ? mcpWallSum / n : 0,
    autoAvgSec: n ? autoWallSum / n : 0,
    textOnlyAvgSec: n ? textOnlyWallSum / n : 0,
  },
  textOnly: {
    total: textOnlyTotal,
    avg: textOnlyAvg,
    efficiencyGainPct: textOnlyEfficiencyGainPct,
    scoreSum: textOnlyScoreSum,
    avgFrac: n ? textOnlyScoreSum / n : 0,
  },
  targets: rows.map(({ id, mcpTok, autoArm, autoTok, mcpScore, autoScore, mcpScoreFrac, autoScoreFrac }) => ({
    id, mcpTok, autoArm, autoTok, mcpScore, autoScore, mcpScoreFrac, autoScoreFrac,
  })),
  largestGains: largestGains.map((r) => ({ id: r.id, gainPct: r.gainPct, mcpTok: r.mcpTok, autoTok: r.autoTok, autoArm: r.autoArm })),
  smallestGains: smallestGains.map((r) => ({ id: r.id, gainPct: r.gainPct, mcpTok: r.mcpTok, autoTok: r.autoTok, autoArm: r.autoArm })),
  failures,
};

fs.writeFileSync(OUT, JSON.stringify(aggregate, null, 2));

// Print totals + efficiencyGainPct + accuracy + wall + gain extremes
console.log(JSON.stringify({
  mcpTotal: aggregate.mcpTotal,
  mcpAvg: aggregate.mcpAvg,
  autoTotal: aggregate.autoTotal,
  autoAvg: aggregate.autoAvg,
  efficiencyGainPct: aggregate.efficiencyGainPct,
  accuracy: {
    mcpScoreSum: aggregate.accuracy.mcpScoreSum,
    autoScoreSum: aggregate.accuracy.autoScoreSum,
    mcpAvgFrac: aggregate.accuracy.mcpAvgFrac,
    autoAvgFrac: aggregate.accuracy.autoAvgFrac,
  },
  wall: aggregate.wall,
  textOnly: aggregate.textOnly,
  largestGains: aggregate.largestGains,
  smallestGains: aggregate.smallestGains,
  failures: aggregate.failures,
}, null, 2));

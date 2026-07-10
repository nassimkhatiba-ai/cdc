// Savings estimator: how much would you have spent under MCP vs CDC?
//
// Models three taxes from the CDC paper:
//   1. Definition tax  - tool schemas loaded upfront every session
//   2. Payload tax     - raw results routed through context
//   3. Round-trip tax  - billed input = sum of growing context per call
//
// Default scenario numbers are calibrated to the paper's mock e-commerce
// suite (see PAPER.md / results.md). Users can override via flags.
const fs = require('fs');
const path = require('path');
const { estimateTokens } = require('./tokens');

const DEFAULT_PRICE_IN = 3; // $ per MTok input
const DEFAULT_PRICE_OUT = 15; // $ per MTok output

const DEFAULT_SCENARIO = {
  sessions: 1,
  tasksPerSession: 5,
  mcpRoundTripsPerTask: 15, // 75/5 from results.md
  mcpPayloadTokensPerRoundTrip: 2800,
  cdcRoundTripsPerTask: 2, // 10/5
  cdcStdoutTokensPerTask: 40,
  cdcScriptTokensPerTask: 180,
};

function loadStatsJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
}

function findPackages(root) {
  const abs = path.resolve(root);
  if (!fs.existsSync(abs)) return [];
  const st = fs.statSync(abs);
  if (st.isDirectory() && fs.existsSync(path.join(abs, 'stats.json'))) {
    return [abs];
  }
  if (st.isDirectory()) {
    return fs
      .readdirSync(abs)
      .map((n) => path.join(abs, n))
      .filter((p) => fs.existsSync(path.join(p, 'stats.json')));
  }
  return [];
}

function scaleSide(side, sc) {
  const tasks = sc.sessions * sc.tasksPerSession;
  return {
    billed: tasks * side.billedPerTask,
    out: tasks * side.outPerTask,
    trips: tasks * side.tripsPerTask,
    maxCtx: side.finalCtxPerTask,
  };
}

/**
 * Estimate MCP vs CDC cost for one package's definition tax + a usage scenario.
 */
function estimatePackage(stats, scenario = {}, prices = {}) {
  const sc = { ...DEFAULT_SCENARIO, ...scenario };
  const priceIn = prices.priceIn ?? DEFAULT_PRICE_IN;
  const priceOut = prices.priceOut ?? DEFAULT_PRICE_OUT;

  const mcpDef =
    stats.mcpSchemaTokens ||
    stats.sourceTokens ||
    stats.specTokens ||
    (stats.tools || stats.endpoints || 10) * 450;

  const cdcDef = stats.skillTokens || 500;

  const mcpTrips = sc.mcpRoundTripsPerTask;
  const mcpPayload = sc.mcpPayloadTokensPerRoundTrip;
  let mcpBilledPerTask = 0;
  let mcpCtx = mcpDef;
  for (let i = 0; i < mcpTrips; i++) {
    mcpBilledPerTask += mcpCtx;
    mcpCtx += mcpPayload + 80;
  }
  const mcpOutPerTask = mcpTrips * 60;

  const cdcTrips = sc.cdcRoundTripsPerTask;
  let cdcBilledPerTask = 0;
  let cdcCtx = cdcDef + (stats.cdcTokens ? Math.min(stats.cdcTokens, 800) : 200);
  for (let i = 0; i < cdcTrips; i++) {
    cdcBilledPerTask += cdcCtx;
    cdcCtx += sc.cdcScriptTokensPerTask + sc.cdcStdoutTokensPerTask;
  }
  const cdcOutPerTask = cdcTrips * sc.cdcScriptTokensPerTask;

  const mcp = scaleSide(
    {
      billedPerTask: mcpBilledPerTask,
      outPerTask: mcpOutPerTask,
      tripsPerTask: mcpTrips,
      finalCtxPerTask: mcpCtx,
    },
    sc,
  );

  const cdc = scaleSide(
    {
      billedPerTask: cdcBilledPerTask,
      outPerTask: cdcOutPerTask,
      tripsPerTask: cdcTrips,
      finalCtxPerTask: cdcCtx,
    },
    sc,
  );

  const cost = (billed, out) => (billed / 1e6) * priceIn + (out / 1e6) * priceOut;

  return {
    name: stats.name || 'package',
    title: stats.title || stats.name,
    source: stats.source || 'unknown',
    tools: stats.tools || stats.endpoints || 0,
    scenario: sc,
    prices: { priceIn, priceOut },
    mcp: {
      definitionTokens: Math.round(mcpDef),
      billedInputTokens: Math.round(mcp.billed),
      outputTokens: Math.round(mcp.out),
      roundTrips: mcp.trips,
      maxContextTokens: Math.round(mcp.maxCtx),
      costUsd: +cost(mcp.billed, mcp.out).toFixed(4),
    },
    cdc: {
      definitionTokens: Math.round(cdcDef),
      billedInputTokens: Math.round(cdc.billed),
      outputTokens: Math.round(cdc.out),
      roundTrips: cdc.trips,
      maxContextTokens: Math.round(cdc.maxCtx),
      costUsd: +cost(cdc.billed, cdc.out).toFixed(4),
      skillTokens: stats.skillTokens,
      cdcTokens: stats.cdcTokens,
      compression: stats.compressionSourceToSkill || stats.compressionSpecToSkill,
    },
    savings: {
      billedInputRatio: +(mcp.billed / Math.max(1, cdc.billed)).toFixed(1),
      contextRatio: +(mcp.maxCtx / Math.max(1, cdc.maxCtx)).toFixed(1),
      costRatio: +(cost(mcp.billed, mcp.out) / Math.max(1e-9, cost(cdc.billed, cdc.out))).toFixed(1),
      tokensSaved: Math.round(mcp.billed - cdc.billed),
      usdSaved: +(cost(mcp.billed, mcp.out) - cost(cdc.billed, cdc.out)).toFixed(4),
      definitionRatio: +(mcpDef / Math.max(1, cdcDef)).toFixed(1),
    },
  };
}

function estimateFromToolsJson(toolsInput, scenario, prices) {
  const raw = typeof toolsInput === 'string' ? toolsInput : JSON.stringify(toolsInput, null, 2);
  let tools = toolsInput;
  if (typeof tools === 'string') tools = JSON.parse(tools);
  if (tools.tools) tools = tools.tools;
  if (tools.result?.tools) tools = tools.result.tools;
  const n = Array.isArray(tools) ? tools.length : 1;
  const sourceTokens = estimateTokens(raw);
  const skillTokens = 420 + n * 6;
  const cdcTokens = Math.round(sourceTokens * 0.15);
  return estimatePackage(
    {
      name: 'tools-dump',
      title: 'MCP tools dump',
      source: 'mcp',
      tools: n,
      sourceTokens,
      mcpSchemaTokens: sourceTokens,
      skillTokens,
      cdcTokens,
    },
    scenario,
    prices,
  );
}

function paperHeadlines() {
  return {
    simulated: {
      label: 'Simulated suite (2,000 orders, 5 tasks)',
      mcp: { billedInput: 7673993, context: 720960, costUsd: 23.06, roundTrips: 75 },
      cdc: { billedInput: 4127, context: 3179, costUsd: 0.039, roundTrips: 10 },
      ratios: { billed: 1859.5, context: 226.8, cost: 586 },
    },
    live: {
      label: 'Live claude-opus-4-6 (400 orders, 3 tasks)',
      mcp: { billedInput: 146291, correct: '2/3', wallSec: 329 },
      cdc: { billedInput: 931, correct: '3/3', wallSec: 56 },
      ratios: { billed: 157, wall: 5.8 },
    },
    github: {
      label: 'GitHub OpenAPI -> CDC',
      specBytes: 12734947,
      endpoints: 1196,
      skillTokens: 909,
      compression: 3502,
    },
  };
}

function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}

function row(label, a, b, c) {
  return `  ${label.padEnd(16)} ${String(a).padStart(14)}  ${String(b).padStart(14)}  ${String(c).padStart(10)}`;
}

function formatStatsReport(results, { paper = false } = {}) {
  const lines = [];
  lines.push('');
  lines.push('==============================================================');
  lines.push('  CDC -- estimated savings vs MCP interaction pattern');
  lines.push('==============================================================');
  lines.push('');

  if (paper) {
    const p = paperHeadlines();
    lines.push('From the CDC paper (reproducible benchmarks in this repo):');
    lines.push('');
    lines.push(`  ${p.simulated.label}`);
    lines.push(`    MCP billed input : ${fmt(p.simulated.mcp.billedInput)} tokens  ($${p.simulated.mcp.costUsd})`);
    lines.push(`    CDC billed input : ${fmt(p.simulated.cdc.billedInput)} tokens  ($${p.simulated.cdc.costUsd})`);
    lines.push(`    -> ${p.simulated.ratios.billed}x fewer input tokens, ${p.simulated.ratios.cost}x cheaper`);
    lines.push('');
    lines.push(`  ${p.live.label}`);
    lines.push(`    MCP ${fmt(p.live.mcp.billedInput)} tok, ${p.live.mcp.correct} correct, ${p.live.mcp.wallSec}s`);
    lines.push(`    CDC ${fmt(p.live.cdc.billedInput)} tok, ${p.live.cdc.correct} correct, ${p.live.cdc.wallSec}s`);
    lines.push(`    -> ${p.live.ratios.billed}x fewer input tokens, MCP got an aggregation wrong`);
    lines.push('');
    lines.push(
      `  ${p.github.label}: ${p.github.endpoints} endpoints -> ${p.github.skillTokens}-token skill (${p.github.compression}x)`,
    );
    lines.push('');
  }

  if (!results.length) {
    lines.push('No CDC packages found. Compile one first:');
    lines.push('  cdc make <openapi.json> --name myapi');
    lines.push('  cdc from-mcp tools.json --name myserver');
    lines.push('');
    lines.push('Or pass a tools dump:  cdc --stats --tools tools.json');
    lines.push('Or show paper numbers:  cdc --stats --paper');
    return lines.join('\n');
  }

  let totalSavedTok = 0;
  let totalSavedUsd = 0;

  for (const r of results) {
    lines.push(`> ${r.title}  (${r.tools} tools, source=${r.source})`);
    lines.push(`  Scenario: ${r.scenario.sessions} session(s) x ${r.scenario.tasksPerSession} tasks`);
    lines.push('');
    lines.push('                    MCP-style          CDC              savings');
    lines.push('  ---------------------------------------------------------------');
    lines.push(
      row(
        'Definition tax',
        fmt(r.mcp.definitionTokens),
        fmt(r.cdc.definitionTokens),
        r.savings.definitionRatio + 'x',
      ),
    );
    lines.push(
      row(
        'Billed input',
        fmt(r.mcp.billedInputTokens),
        fmt(r.cdc.billedInputTokens),
        r.savings.billedInputRatio + 'x',
      ),
    );
    lines.push(
      row(
        'Peak context',
        fmt(r.mcp.maxContextTokens),
        fmt(r.cdc.maxContextTokens),
        r.savings.contextRatio + 'x',
      ),
    );
    lines.push(
      row(
        'Round trips',
        String(r.mcp.roundTrips),
        String(r.cdc.roundTrips),
        (r.mcp.roundTrips / Math.max(1, r.cdc.roundTrips)).toFixed(1) + 'x',
      ),
    );
    lines.push(
      row(
        'Est. cost',
        '$' + r.mcp.costUsd.toFixed(4),
        '$' + r.cdc.costUsd.toFixed(4),
        r.savings.costRatio + 'x',
      ),
    );
    lines.push('');
    lines.push(
      `  You would have saved ~${fmt(r.savings.tokensSaved)} billed input tokens ($${r.savings.usdSaved}).`,
    );
    if (r.cdc.compression) {
      lines.push(
        `  Source -> skill compression: ${r.cdc.compression}x  (skill is ${r.cdc.skillTokens} tokens)`,
      );
    }
    lines.push('');
    totalSavedTok += r.savings.tokensSaved;
    totalSavedUsd += r.savings.usdSaved;
  }

  if (results.length > 1) {
    lines.push('  ---------------------------------------------------------------');
    lines.push(
      `  TOTAL estimated savings: ${fmt(totalSavedTok)} tokens  |  $${totalSavedUsd.toFixed(4)}`,
    );
    lines.push('');
  }

  lines.push('Notes:');
  lines.push('  * Estimates model the MCP interaction pattern (schemas upfront, payloads');
  lines.push('    through context, one tool call per round trip) vs CDC (code execution).');
  lines.push('  * Payload size defaults are paper-calibrated; override with');
  lines.push('    --tasks N --mcp-trips N --payload-tokens N --sessions N');
  lines.push('  * Pricing defaults to $3/MTok in · $15/MTok out (override --price-in/out).');
  lines.push('  * Prompt caching would shrink MCP billed-input ratios toward context ratios.');
  lines.push('');

  return lines.join('\n');
}

function collectStats({
  root = 'cdc',
  statsFile,
  toolsFile,
  paper = false,
  scenario = {},
  prices = {},
} = {}) {
  const results = [];

  if (toolsFile) {
    const raw = fs.readFileSync(path.resolve(toolsFile), 'utf8');
    results.push(estimateFromToolsJson(raw, scenario, prices));
  }

  if (statsFile) {
    results.push(estimatePackage(loadStatsJson(statsFile), scenario, prices));
  } else if (!toolsFile) {
    for (const pkg of findPackages(root)) {
      results.push(estimatePackage(loadStatsJson(path.join(pkg, 'stats.json')), scenario, prices));
    }
  }

  return {
    results,
    report: formatStatsReport(results, { paper }),
    paper: paper ? paperHeadlines() : null,
  };
}

module.exports = {
  estimatePackage,
  estimateFromToolsJson,
  collectStats,
  formatStatsReport,
  paperHeadlines,
  findPackages,
  DEFAULT_SCENARIO,
};

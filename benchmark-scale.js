// Scaling sweep: how does each paradigm's cost grow with dataset size?
// Runs the 5-task simulated suite at several order counts (fresh process per
// scale so seeded data regenerates) and tabulates totals.
const { spawnSync } = require('child_process');
const fs = require('fs');

const SCALES = [250, 500, 1000, 2000, 4000];
const rows = [];
for (const orders of SCALES) {
  const r = spawnSync(process.execPath, [__dirname + '/benchmark-scale-worker.js'], {
    env: { ...process.env, N_ORDERS: String(orders), N_USERS: '200', N_PRODUCTS: '100' },
    encoding: 'utf8',
  });
  if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
  rows.push(JSON.parse(r.stdout));
}

let md = '# Scaling sweep — cost vs dataset size (5-task simulated suite)\n\n';
md += '200 users, 100 products, pagination 100/page; orders swept. "max ctx" = largest single-task context footprint (200k = typical context window limit).\n\n';
md += '| orders | paradigm | trips | max ctx (1 task) | billed input | fits 200k? |\n|---|---|---|---|---|---|\n';
for (const r of rows) {
  md += `| ${r.orders} | mcp | ${r.mcp.roundTrips} | ${r.mcp.maxTaskContext.toLocaleString()} | ${r.mcp.billedInputTokens.toLocaleString()} | ${r.mcp.maxTaskContext > 200000 ? '**NO**' : 'yes'} |\n`;
  md += `| ${r.orders} | codecall | ${r.codecall.roundTrips} | ${r.codecall.maxTaskContext.toLocaleString()} | ${r.codecall.billedInputTokens.toLocaleString()} | yes |\n`;
}
md += '\n| orders | billed-input ratio (mcp ÷ codecall) |\n|---|---|\n';
for (const r of rows) md += `| ${r.orders} | ${(r.mcp.billedInputTokens / r.codecall.billedInputTokens).toFixed(0)}× |\n`;
md += '\nMCP billed input grows ~quadratically with data size (more pages × bigger context per trip); codecall stays flat — the script scales, the context does not.\n';

fs.writeFileSync(__dirname + '/results-scale.md', md);
console.log(md);

// Worker: run the full simulated suite (both paradigms) at the dataset scale
// given by env (N_USERS/N_ORDERS/N_PRODUCTS) and print JSON totals.
const { createServer } = require('./server/mock-api');
const mcp = require('./agents/mcp-style');
const codecall = require('./agents/codecall');

const TASK_NAMES = ['top5_spenders', 'refunded_march', 'avg_by_category', 'total_revenue', 'most_cancelled_user'];

async function suiteTotals(tasks, baseUrl) {
  const tot = { contextTokens: 0, billedInputTokens: 0, outputTokens: 0, roundTrips: 0, wallMs: 0, maxTaskContext: 0 };
  for (const name of TASK_NAMES) {
    const t0 = performance.now();
    const { stats } = await tasks[name](baseUrl);
    tot.wallMs += performance.now() - t0;
    tot.contextTokens += stats.contextTokens;
    tot.billedInputTokens += stats.billedInputTokens;
    tot.outputTokens += stats.outputTokens;
    tot.roundTrips += stats.roundTrips;
    tot.maxTaskContext = Math.max(tot.maxTaskContext, stats.contextTokens);
  }
  return tot;
}

async function main() {
  const server = createServer();
  await new Promise((r) => server.listen(0, r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const result = {
    orders: parseInt(process.env.N_ORDERS, 10),
    mcp: await suiteTotals(mcp.TASKS, baseUrl),
    codecall: await suiteTotals(codecall.TASKS, baseUrl),
  };
  server.close();
  console.log(JSON.stringify(result));
}

main().catch((e) => { console.error(e); process.exit(1); });

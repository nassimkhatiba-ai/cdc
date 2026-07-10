// "codecall" runtime — the post-MCP pattern.
//
//   1. Upfront context = a compact one-line-per-endpoint index (not schemas).
//   2. The model writes ONE script that calls the API directly.
//   3. The script runs in a sandboxed subprocess; raw payloads stay there.
//   4. Only stdout (the derived answer) enters the context window.
//
// Round trips: 2 (write script -> see stdout -> final answer).
// The scripts below are what the model would generate; they count as
// model OUTPUT tokens, exactly as they would in a real session.
const { spawn } = require('child_process');
const { Conversation } = require('../lib/conversation');
const { SPEC_INDEX } = require('../server/mock-api');

const RUNTIME_PREAMBLE =
  'You can call the API by writing a Node script. Endpoints:\n' + SPEC_INDEX;

function runSandboxed(script, baseUrl) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', script], {
      env: { ...process.env, API_URL: baseUrl },
      timeout: 30000,
    });
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('close', (code) =>
      code === 0 ? resolve(out.trim()) : reject(new Error(err || `exit ${code}`)));
  });
}

// Shared pagination helper the model would inline in its scripts.
const PAGINATE = `
const base = process.env.API_URL;
async function all(path) {
  const items = []; let page = 1, pages = 1;
  while (page <= pages) {
    const sep = path.includes('?') ? '&' : '?';
    const b = await fetch(base + path + sep + 'page=' + page).then(r => r.json());
    items.push(...b.data); pages = b.total_pages; page++;
  }
  return items;
}`;

const SCRIPTS = {
  top5_spenders: `${PAGINATE}
(async () => {
  const [orders, users] = await Promise.all([all('/orders'), all('/users')]);
  const spend = new Map();
  for (const o of orders) if (o.status !== 'cancelled' && o.status !== 'refunded')
    spend.set(o.user_id, (spend.get(o.user_id) || 0) + o.total);
  const top = [...spend.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log(top.map(([id, t]) => users.find(u => u.id === id).email + ': $' + t.toFixed(2)).join('\\n'));
})();`,

  refunded_march: `${PAGINATE}
(async () => {
  const refunded = await all('/orders?status=refunded');
  const n = refunded.filter(o => o.created_at.startsWith('2026-03')).length;
  console.log('refunded orders in March 2026: ' + n);
})();`,

  avg_by_category: `${PAGINATE}
(async () => {
  const [orders, products] = await Promise.all([all('/orders'), all('/products')]);
  const cat = new Map();
  for (const o of orders) {
    const c = products.find(p => p.id === o.product_id).category;
    const e = cat.get(c) || { sum: 0, n: 0 };
    e.sum += o.total; e.n += 1; cat.set(c, e);
  }
  console.log([...cat.entries()].sort().map(([c, e]) => c + ': $' + (e.sum / e.n).toFixed(2)).join('\\n'));
})();`,

  total_revenue: `${PAGINATE}
(async () => {
  const orders = await all('/orders');
  const total = orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((s, o) => s + o.total, 0);
  console.log('total revenue: $' + total.toFixed(2));
})();`,

  most_cancelled_user: `${PAGINATE}
(async () => {
  const cancelled = await all('/orders?status=cancelled');
  const counts = new Map();
  for (const o of cancelled) counts.set(o.user_id, (counts.get(o.user_id) || 0) + 1);
  const [topId, n] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  const u = await fetch(base + '/users/' + topId).then(r => r.json());
  console.log('most cancellations: ' + u.email + ' (' + n + ')');
})();`,
};

const TASKS = {};
for (const [name, script] of Object.entries(SCRIPTS)) {
  TASKS[name] = async (baseUrl) => {
    const convo = new Conversation(RUNTIME_PREAMBLE);
    const stdout = await runSandboxed(script, baseUrl);
    convo.turn(script, stdout);   // model writes code, observes stdout
    convo.turn(stdout, '');       // model states the final answer
    return { answer: stdout, stats: convo.stats() };
  };
}

module.exports = { TASKS, RUNTIME_PREAMBLE };

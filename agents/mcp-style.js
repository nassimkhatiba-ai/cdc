// MCP-style agent harness.
//
// Faithfully reproduces the MCP interaction pattern:
//   1. ALL tool schemas are injected into context upfront.
//   2. The model calls tools one at a time; each call is a model round trip.
//   3. Every tool result (full JSON payload) enters the context window.
//   4. Aggregation happens "in the model" — i.e., over data sitting in context.
//
// The tool-call *decisions* are scripted (what a competent model would do),
// because we are benchmarking the interaction pattern's cost, not model IQ.
const { Conversation } = require('../lib/conversation');

// Schemas written at the verbosity level of real published MCP servers
// (github/slack/stripe servers average ~300-600 tokens per tool).
const TOOL_SCHEMAS = JSON.stringify([
  {
    name: 'list_users',
    description: 'List customer accounts registered in the store. Returns a paginated collection of user objects including their unique identifier, full display name, primary email address, ISO country code, and account creation timestamp. Use the page parameter to iterate through all result pages; check total_pages in the response to know when to stop.',
    inputSchema: { type: 'object', properties: { page: { type: 'integer', description: 'Page number to retrieve, starting from 1. Defaults to 1.' }, per_page: { type: 'integer', description: 'Number of results per page, between 1 and 100. Defaults to 100.' } }, required: [] },
  },
  {
    name: 'get_user',
    description: 'Retrieve a single customer account by its unique numeric identifier. Returns the full user object with id, name, email, country and created_at fields. Returns a not-found error when no user exists with the supplied identifier.',
    inputSchema: { type: 'object', properties: { user_id: { type: 'integer', description: 'The unique numeric identifier of the user to retrieve.' } }, required: ['user_id'] },
  },
  {
    name: 'list_orders',
    description: 'List orders placed in the store, most useful for reporting and analytics workflows. Returns a paginated collection of order objects, each including the order id, the id of the purchasing user, the purchased product id, quantity, unit price at time of purchase, extended line total, fulfillment status and creation timestamp. Supports optional filtering by purchasing user and by fulfillment status. Use the page parameter to iterate through all result pages.',
    inputSchema: { type: 'object', properties: { page: { type: 'integer', description: 'Page number to retrieve, starting from 1. Defaults to 1.' }, per_page: { type: 'integer', description: 'Number of results per page, between 1 and 100. Defaults to 100.' }, user_id: { type: 'integer', description: 'Only return orders placed by this user id.' }, status: { type: 'string', enum: ['delivered', 'shipped', 'pending', 'cancelled', 'refunded'], description: 'Only return orders currently in this fulfillment status.' } }, required: [] },
  },
  {
    name: 'get_order',
    description: 'Retrieve a single order by its unique numeric identifier. Returns the full order object including purchasing user id, product id, quantity, unit price, extended total, fulfillment status and creation timestamp.',
    inputSchema: { type: 'object', properties: { order_id: { type: 'integer', description: 'The unique numeric identifier of the order to retrieve.' } }, required: ['order_id'] },
  },
  {
    name: 'list_products',
    description: 'List products available in the store catalog. Returns a paginated collection of product objects including the product id, display name, merchandising category and current list price. Use the page parameter to iterate through all result pages.',
    inputSchema: { type: 'object', properties: { page: { type: 'integer', description: 'Page number to retrieve, starting from 1. Defaults to 1.' }, per_page: { type: 'integer', description: 'Number of results per page, between 1 and 100. Defaults to 100.' } }, required: [] },
  },
  {
    name: 'get_product',
    description: 'Retrieve a single product from the catalog by its unique numeric identifier. Returns the full product object with id, name, category and price fields.',
    inputSchema: { type: 'object', properties: { product_id: { type: 'integer', description: 'The unique numeric identifier of the product to retrieve.' } }, required: ['product_id'] },
  },
], null, 2);

async function callTool(baseUrl, name, args) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(args)) if (k !== 'user_id_path' && v !== undefined) q.set(k, String(v));
  const routes = {
    list_users: () => `/users?${q}`,
    get_user: () => `/users/${args.user_id}`,
    list_orders: () => `/orders?${q}`,
    get_order: () => `/orders/${args.order_id}`,
    list_products: () => `/products?${q}`,
    get_product: () => `/products/${args.product_id}`,
  };
  const res = await fetch(baseUrl + routes[name]());
  return res.text();
}

// Fetch every page of a list tool, one model round trip per page —
// exactly what an MCP agent does when a question spans a full dataset.
async function fetchAllPages(convo, baseUrl, tool, extraArgs = {}) {
  const all = [];
  let page = 1, totalPages = 1;
  while (page <= totalPages) {
    const args = { ...extraArgs, page };
    const raw = await callTool(baseUrl, tool, args);
    convo.turn(JSON.stringify({ tool_use: tool, input: args }), raw);
    const body = JSON.parse(raw);
    all.push(...body.data);
    totalPages = body.total_pages;
    page += 1;
  }
  return all;
}

// Each task returns { answer, stats }. Fresh conversation per task.
const TASKS = {
  async top5_spenders(baseUrl) {
    const convo = new Conversation(TOOL_SCHEMAS);
    const orders = await fetchAllPages(convo, baseUrl, 'list_orders');
    const users = await fetchAllPages(convo, baseUrl, 'list_users');
    const spend = new Map();
    for (const o of orders) if (o.status !== 'cancelled' && o.status !== 'refunded') spend.set(o.user_id, (spend.get(o.user_id) || 0) + o.total);
    const top = [...spend.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, t]) => `${users.find((u) => u.id === id).email}: $${t.toFixed(2)}`);
    const answer = top.join('\n');
    convo.turn(answer, ''); // final answer generation is a round trip too
    return { answer, stats: convo.stats() };
  },

  async refunded_march(baseUrl) {
    const convo = new Conversation(TOOL_SCHEMAS);
    const refunded = await fetchAllPages(convo, baseUrl, 'list_orders', { status: 'refunded' });
    const n = refunded.filter((o) => o.created_at.startsWith('2026-03')).length;
    const answer = `refunded orders in March 2026: ${n}`;
    convo.turn(answer, '');
    return { answer, stats: convo.stats() };
  },

  async avg_by_category(baseUrl) {
    const convo = new Conversation(TOOL_SCHEMAS);
    const orders = await fetchAllPages(convo, baseUrl, 'list_orders');
    const products = await fetchAllPages(convo, baseUrl, 'list_products');
    const cat = new Map();
    for (const o of orders) {
      const c = products.find((p) => p.id === o.product_id).category;
      const e = cat.get(c) || { sum: 0, n: 0 };
      e.sum += o.total; e.n += 1; cat.set(c, e);
    }
    const answer = [...cat.entries()].sort()
      .map(([c, e]) => `${c}: $${(e.sum / e.n).toFixed(2)}`).join('\n');
    convo.turn(answer, '');
    return { answer, stats: convo.stats() };
  },

  async total_revenue(baseUrl) {
    const convo = new Conversation(TOOL_SCHEMAS);
    const orders = await fetchAllPages(convo, baseUrl, 'list_orders');
    const total = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((s, o) => s + o.total, 0);
    const answer = `total revenue: $${total.toFixed(2)}`;
    convo.turn(answer, '');
    return { answer, stats: convo.stats() };
  },

  async most_cancelled_user(baseUrl) {
    const convo = new Conversation(TOOL_SCHEMAS);
    const cancelled = await fetchAllPages(convo, baseUrl, 'list_orders', { status: 'cancelled' });
    const counts = new Map();
    for (const o of cancelled) counts.set(o.user_id, (counts.get(o.user_id) || 0) + 1);
    const [topId, n] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    const raw = await callTool(baseUrl, 'get_user', { user_id: topId });
    convo.turn(JSON.stringify({ tool_use: 'get_user', input: { user_id: topId } }), raw);
    const answer = `most cancellations: ${JSON.parse(raw).email} (${n})`;
    convo.turn(answer, '');
    return { answer, stats: convo.stats() };
  },
};

module.exports = { TASKS, TOOL_SCHEMAS };

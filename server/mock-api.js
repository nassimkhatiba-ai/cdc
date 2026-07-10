// Mock e-commerce API: deterministic seeded data, paginated REST endpoints.
// Stands in for any real SaaS API (Stripe/Shopify-ish shape).
const http = require('http');

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const r2 = (n) => Math.round(n * 100) / 100;

const FIRST = ['Ava', 'Liam', 'Noah', 'Emma', 'Mia', 'Yuki', 'Omar', 'Ines', 'Kai', 'Zoe', 'Leo', 'Nora', 'Hugo', 'Lena', 'Aris', 'Maya'];
const LAST = ['Tanaka', 'Silva', 'Khan', 'Novak', 'Meyer', 'Rossi', 'Dubois', 'Okafor', 'Larsen', 'Petit', 'Moreau', 'Weber'];
const COUNTRIES = ['US', 'JP', 'FR', 'DE', 'BR', 'NG', 'NL', 'SE'];
const CATEGORIES = ['electronics', 'books', 'home', 'toys', 'sports', 'beauty'];
const STATUSES = ['delivered', 'delivered', 'delivered', 'delivered', 'shipped', 'shipped', 'pending', 'cancelled', 'refunded'];

const N_USERS = parseInt(process.env.N_USERS || '200', 10);
const N_PRODUCTS = parseInt(process.env.N_PRODUCTS || '100', 10);
const N_ORDERS = parseInt(process.env.N_ORDERS || '2000', 10);

const users = Array.from({ length: N_USERS }, (_, i) => {
  const first = pick(FIRST), last = pick(LAST);
  return {
    id: i + 1,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i + 1}@example.com`,
    country: pick(COUNTRIES),
    created_at: new Date(Date.UTC(2025, Math.floor(rand() * 12), 1 + Math.floor(rand() * 28))).toISOString(),
  };
});

const products = Array.from({ length: N_PRODUCTS }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  category: pick(CATEGORIES),
  price: r2(5 + rand() * 495),
}));

const orders = Array.from({ length: N_ORDERS }, (_, i) => {
  const product = pick(products);
  const quantity = 1 + Math.floor(rand() * 5);
  return {
    id: i + 1,
    user_id: 1 + Math.floor(rand() * N_USERS),
    product_id: product.id,
    quantity,
    unit_price: product.price,
    total: r2(quantity * product.price),
    status: pick(STATUSES),
    created_at: new Date(Date.UTC(2026, Math.floor(rand() * 6), 1 + Math.floor(rand() * 28), Math.floor(rand() * 24))).toISOString(),
  };
});

// Compact machine-readable index: one line per endpoint. This is the entire
// upfront context cost of the codecall runtime.
const SPEC_INDEX = [
  'GET /users?page&per_page          -> paginated {data:[{id,name,email,country,created_at}],page,per_page,total,total_pages} (per_page max 100)',
  'GET /users/:id                    -> {id,name,email,country,created_at}',
  'GET /orders?page&per_page&user_id&status -> paginated {data:[{id,user_id,product_id,quantity,unit_price,total,status,created_at}]} status in delivered|shipped|pending|cancelled|refunded',
  'GET /products?page&per_page       -> paginated {data:[{id,name,category,price}]}',
  'GET /products/:id                 -> {id,name,category,price}',
].join('\n');

function paginate(items, query) {
  const perPage = Math.min(parseInt(query.get('per_page') || '100', 10), 100);
  const page = Math.max(parseInt(query.get('page') || '1', 10), 1);
  const start = (page - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    page,
    per_page: perPage,
    total: items.length,
    total_pages: Math.ceil(items.length / perPage),
  };
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const send = (code, body, raw) => {
      res.writeHead(code, { 'content-type': raw ? 'text/plain' : 'application/json' });
      res.end(raw ? body : JSON.stringify(body));
    };
    const parts = url.pathname.split('/').filter(Boolean);

    if (url.pathname === '/spec') return send(200, SPEC_INDEX, true);
    if (parts[0] === 'users' && parts[1]) {
      const u = users.find((u) => u.id === Number(parts[1]));
      return u ? send(200, u) : send(404, { error: 'not found' });
    }
    if (url.pathname === '/users') return send(200, paginate(users, url.searchParams));
    if (parts[0] === 'products' && parts[1]) {
      const p = products.find((p) => p.id === Number(parts[1]));
      return p ? send(200, p) : send(404, { error: 'not found' });
    }
    if (url.pathname === '/products') return send(200, paginate(products, url.searchParams));
    if (url.pathname === '/orders') {
      let filtered = orders;
      const userId = url.searchParams.get('user_id');
      const status = url.searchParams.get('status');
      if (userId) filtered = filtered.filter((o) => o.user_id === Number(userId));
      if (status) filtered = filtered.filter((o) => o.status === status);
      return send(200, paginate(filtered, url.searchParams));
    }
    send(404, { error: 'not found' });
  });
}

module.exports = { createServer, SPEC_INDEX, users, products, orders };

if (require.main === module) {
  const port = process.env.PORT || 4923;
  createServer().listen(port, () => console.log(`mock api on :${port}`));
}

# mockapi - CDC

Source: MCP tools/list (5 tools)
Prefer: ONE openSession script that does ALL work then prints ONLY answer keys; callPaged for list_orders. --batch only for tiny independent probes.

## Multi-step (primary for multi-hop)

```bash
node - <<'EOF'
const { openSession, callPaged } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'list_orders', { /* filters */ }); // ALL pages
  const one = await s.call('list_products', { /* real args */ });
  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed
  // Answer helper: print JSON once; never dump tool results to chat.
  console.log(JSON.stringify(/* compact answer only */));
  s.close();
})();
EOF
```

## get
get_product(id*:integer) — Get product by id
get_spec() — API route index / help

## list
list_products(page:integer, per_page:integer) — List products (paginated)
list_orders(page:integer, per_page:integer, status) — List orders (paginated)
list_users(page:integer, per_page:integer) — List users (paginated)

## _index
get_product
get_spec
list_orders
list_products
list_users

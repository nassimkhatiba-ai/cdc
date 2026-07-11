---
name: mockapi-cdc
description: Call mockapi via short Node scripts (CDC). Compact tool index; no full MCP schemas in context. Use for mockapi.
---

# mockapi

Plain calls need NO script: `node /Users/nesbes/mcp-a;t/implementer/mega20/skills/mockapi-cdc/mcp-call.js <tool> '<json-args>'` · batch: `--batch '[{"tool":"t","args":{}},...]'`

Multi-step / aggregation — ONE inline script (bash heredoc, never a script file):

```bash
node - <<'EOF'
const { openSession, callPaged } = require('/Users/nesbes/mcp-a;t/implementer/mega20/skills/mockapi-cdc/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'list_tool', { /* filters */ }); // fetches ALL pages
  const one = await s.call('tool_name', { /* args */ });
  console.log(JSON.stringify(answer)); // aggregate in code first
  s.close();
})();
EOF
```

A background daemon keeps the server warm: repeat calls skip cold start and server STATE (browser pages, auth sessions) persists across scripts. `daemon-stop` ends it; env `CDC_MCP_DAEMON=0` disables.

Rules:
1. ONE session per script — never one per call.
2. List tools paginate — use callPaged, never just page 1. Aggregate in code; print ONLY the final compact JSON in the EXACT requested shape.
3. Tool prose is not an answer — extract the value. Named resource (id, owner/name)? Direct lookup, never global search.
4. Empty/zero/implausible result = bug: re-check args against the signatures. Max 2 runs.

## Tools

### get
get_product(id*:integer) — Get product by id
get_spec() — API route index / help
### list
list_products(page:integer, per_page:integer) — List products (paginated)
list_orders(page:integer, per_page:integer, status) — List orders (paginated)
list_users(page:integer, per_page:integer) — List users (paginated)

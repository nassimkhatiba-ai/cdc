---
name: demo-cdc
description: Call Demo MCP via short Node scripts (CDC). Compact tool index; no full MCP schemas in context. Use for demo.
---

# Demo MCP

Plain calls need NO script: `node __SKILL_DIR__/mcp-call.js <tool> '<json-args>'` · batch: `--batch '[{"tool":"t","args":{}},...]'`

Multi-step / aggregation — ONE inline script (bash heredoc, never a script file):

```bash
node - <<'EOF'
const { openSession, callPaged } = require('__SKILL_DIR__/mcp-call.js');
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
get_user(user_id*:integer) — Retrieve a single customer account by its unique numeric identifier
get_order(order_id*:integer) — Retrieve a single order by its unique numeric identifier
get_product(product_id*:integer) — Retrieve a single product from the catalog by id
### github
github_list_repos(owner*, type:"all"|"public"|"private", per_page:integer, page:integer) — List repositories for a GitHub user or organization
github_get_repo(owner*, repo*) — Get a single GitHub repository by owner and name
github_list_issues(owner*, repo*, state:"open"|"closed"|"all", labels, per_page:integer, page:integer) — List issues in a repository with optional state filter
### list
list_users(page:integer, per_page:integer) — List customer accounts registered in the store
list_orders(page:integer, per_page:integer, user_id:integer, status:"delivered"|"shipped"|"pending"|"cancelled"|"refunded") — List orders placed in the store for reporting and analytics
list_products(page:integer, per_page:integer) — List products available in the store catalog
### search
search_docs(query*, limit:integer) — Full-text search across the documentation corpus
### slack
slack_post_message(channel*, text*, thread_ts) — Post a message to a Slack channel
slack_list_channels(limit:integer, cursor) — List Slack channels the bot can see

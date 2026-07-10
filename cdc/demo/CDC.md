# demo MCP — CDC (Code-Call Descriptor)

Source: MCP tools/list (12 tools)

## How to call these tools (CDC pattern)

This package was converted from an MCP server. Instead of loading every tool
schema into context and piping results through the model, write ONE Node.js
script that calls only the tools you need, filters/aggregates in-process, and
prints the final answer.

### Calling a tool from a script

A helper `mcp-call.js` ships next to this skill. From a script:

```js
const { callTool } = require('./mcp-call.js');

const result = await callTool('tool_name', { arg: 'value' });
// result is already-parsed JSON (or text). Aggregate here, then:
console.log(JSON.stringify(answer));
```

Rules:
1. Credentials live in the MCP server process / env — never hardcode secrets.
2. Call only the tools you need. Prefer bulk/list tools over N× get-one loops
   when available; still do aggregation IN THE SCRIPT.
3. Print ONLY the final answer to stdout. Never echo raw tool payloads into
   the conversation.
4. On errors, print the error message and stop.
5. One script per question — compose multi-tool workflows inside it.

Params: `*` = required. Types shown only when non-string.

## get
get_user(user_id*:integer) — Retrieve a single customer account by its unique numeric identifier. Returns the full user object with id, name, emai...
get_order(order_id*:integer) — Retrieve a single order by its unique numeric identifier.
get_product(product_id*:integer) — Retrieve a single product from the catalog by id.

## github
github_list_repos(owner*, type:"all"|"public"|"private", per_page:integer, page:integer) — List repositories for a GitHub user or organization.
github_get_repo(owner*, repo*) — Get a single GitHub repository by owner and name.
github_list_issues(owner*, repo*, state:"open"|"closed"|"all", labels, per_page:integer, page:integer) — List issues in a repository with optional state filter.

## list
list_users(page:integer, per_page:integer) — List customer accounts registered in the store. Returns a paginated collection of user objects including their unique...
list_orders(page:integer, per_page:integer, user_id:integer, status:"delivered"|"shipped"|"pending"|"cancelled"|"refunded") — List orders placed in the store for reporting and analytics. Returns paginated order objects with user id, product id...
list_products(page:integer, per_page:integer) — List products available in the store catalog. Returns paginated product objects with id, name, category and price.

## search
search_docs(query*, limit:integer) — Full-text search across the documentation corpus. Returns ranked snippets.

## slack
slack_post_message(channel*, text*, thread_ts) — Post a message to a Slack channel.
slack_list_channels(limit:integer, cursor) — List Slack channels the bot can see.

## _index
get_order
get_product
get_user
github_get_repo
github_list_issues
github_list_repos
list_orders
list_products
list_users
search_docs
slack_list_channels
slack_post_message

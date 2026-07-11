# Demo MCP - CDC

Source: MCP tools/list (12 tools)
Use mcp-call.js openSession() from a script; print answer only.

## get
get_user(user_id*:integer) — Retrieve a single customer account by its unique numeric identifier
get_order(order_id*:integer) — Retrieve a single order by its unique numeric identifier
get_product(product_id*:integer) — Retrieve a single product from the catalog by id

## github
github_list_repos(owner*, type:"all"|"public"|"private", per_page:integer, page:integer) — List repositories for a GitHub user or organization
github_get_repo(owner*, repo*) — Get a single GitHub repository by owner and name
github_list_issues(owner*, repo*, state:"open"|"closed"|"all", labels, per_page:integer, page:integer) — List issues in a repository with optional state filter

## list
list_users(page:integer, per_page:integer) — List customer accounts registered in the store
list_orders(page:integer, per_page:integer, user_id:integer, status:"delivered"|"shipped"|"pending"|"cancelled"|"refunded") — List orders placed in the store for reporting and analytics
list_products(page:integer, per_page:integer) — List products available in the store catalog

## search
search_docs(query*, limit:integer) — Full-text search across the documentation corpus

## slack
slack_post_message(channel*, text*, thread_ts) — Post a message to a Slack channel
slack_list_channels(limit:integer, cursor) — List Slack channels the bot can see

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

# Demo MCP - CDC

Source: MCP tools/list (12 tools)
Use mcp-call.js from a script; print answer only.

## get
get_user(user_id*:integer)
get_order(order_id*:integer)
get_product(product_id*:integer)

## github
github_list_repos(owner*, type:"all"|"public"|"private", per_page:integer, page:integer)
github_get_repo(owner*, repo*)
github_list_issues(owner*, repo*, state:"open"|"closed"|"all", labels, per_page:integer, page:integer)

## list
list_users(page:integer, per_page:integer)
list_orders(page:integer, per_page:integer, user_id:integer, status:"delivered"|"shipped"|"pending"|"cancelled"|"refunded")
list_products(page:integer, per_page:integer)

## search
search_docs(query*, limit:integer)

## slack
slack_post_message(channel*, text*, thread_ts)
slack_list_channels(limit:integer, cursor)

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

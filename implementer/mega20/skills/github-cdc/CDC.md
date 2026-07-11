# github - CDC

Source: MCP tools/list (5 tools)
Use mcp-call.js openSession() from a script; print answer only.

## get
get_authenticated_user() — Return the authenticated GitHub user profile (requires login token)
get_user(username*) — Get a public GitHub user by login
get_repo(owner*, repo*) — Get a repository by owner/name

## list
list_user_repos(username*, per_page:integer, page:integer) — List public repos for a user (paginated)

## search
search_repositories(q*, per_page:integer) — Search GitHub repositories (query string)

## _index
get_authenticated_user
get_repo
get_user
list_user_repos
search_repositories

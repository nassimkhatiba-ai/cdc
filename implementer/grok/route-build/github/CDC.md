# github - CDC

Source: MCP tools/list (5 tools)
Prefer: ONE openSession script that does ALL work then prints ONLY answer keys; callPaged for list_user_repos. --batch only for tiny independent probes.

## Multi-step (primary for multi-hop)

```bash
node - <<'EOF'
const { openSession, callPaged } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'list_user_repos', { /* filters */ }); // ALL pages
  const one = await s.call('get_authenticated_user', { /* real args */ });
  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed
  // Answer helper: print JSON once; never dump tool results to chat.
  console.log(JSON.stringify(/* compact answer only */));
  s.close();
})();
EOF
```

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

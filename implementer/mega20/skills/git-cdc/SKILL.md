---
name: git-cdc
description: Call git via short Node scripts (CDC). Compact tool index; no full MCP schemas in context. Use for git.
---

# git

Plain calls need NO script: `node /Users/nesbes/mcp-a;t/implementer/mega20/skills/git-cdc/mcp-call.js <tool> '<json-args>'` · batch: `--batch '[{"tool":"t","args":{}},...]'`

Multi-step / aggregation — ONE inline script (bash heredoc, never a script file):

```bash
node - <<'EOF'
const { openSession, callPaged } = require('/Users/nesbes/mcp-a;t/implementer/mega20/skills/git-cdc/mcp-call.js');
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

### git
git_status(repo_path*) — Shows the working tree status
git_diff_unstaged(repo_path*, context_lines:integer) — Shows changes in the working directory that are not yet staged
git_diff_staged(repo_path*, context_lines:integer) — Shows changes that are staged for commit
git_diff(repo_path*, target*, context_lines:integer) — Shows differences between branches or commits
git_commit(repo_path*, message*) — Records changes to the repository
git_add(repo_path*, files*:[]) — Adds file contents to the staging area
git_reset(repo_path*) — Unstages all staged changes
git_log(repo_path*, max_count:integer, start_timestamp, end_timestamp) — Shows the commit logs
git_create_branch(repo_path*, branch_name*, base_branch) — Creates a new branch from an optional base branch
git_checkout(repo_path*, branch_name*) — Switches branches
git_show(repo_path*, revision*) — Shows the contents of a commit
git_branch(repo_path*, branch_type*, contains, not_contains) — List Git branches

# git - CDC

Source: MCP tools/list (12 tools)
Use mcp-call.js openSession() from a script; print answer only.

## git
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

## _index
git_add
git_branch
git_checkout
git_commit
git_create_branch
git_diff
git_diff_staged
git_diff_unstaged
git_log
git_reset
git_show
git_status

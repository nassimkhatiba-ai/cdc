---
name: git-cdc
description: Fast CDC for git (12 tools). ONE shell: node mcp-call.js --batch '[{tool,args}...]'. No MCP schemas. Use git-cdc skill.
---

# git

**No connected MCP.** Skill only. **ONE shell → compact JSON answer.**

## Call

```bash
node '__SKILL_DIR__/mcp-call.js' --batch '[{"tool":"git_status","args":{}}]'
```

Single: `node '__SKILL_DIR__/mcp-call.js' git_status '{}'`

Daemon warm. Do **not** list tools first. Do **not** cat SKILL.md if already loaded. Fill real args from Tools below — never invent names or placeholder values.

## Rules

1. **Max 1 shell run** for simple tasks: one `--batch` (or one single call) with **real** args. No openSession. No CDC.md. No tool listing.
2. Bridge prints compact one-line JSON. Then print **ONLY** final answer keys once — e.g. `console.log(JSON.stringify({key: value}))`. Never dump raw tool results to chat.
3. Wrong/empty: fix args from Tools below. Max **1** retry (2 shell runs total).
4. **Never cat/sed/rg mcp-call.js** — treat it as a black-box require. API is only: CLI single call, CLI `--batch`, or `require` + `callTool`/`callTools`.

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

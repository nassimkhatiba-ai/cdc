# Auth MCP fun test ��� GitHub login-gated (Codex gpt-5.6-luna)

## What we tested
Real **login-required** MCP: GitHub REST behind `GITHUB_TOKEN` (from `gh auth token`).
No token → tool errors with Unauthorized.

**Note:** Official `@modelcontextprotocol/server-github` is deprecated and timed out on probe.
Used a **minimal 5-tool auth MCP** (`github-auth-mcp.js`) that hits live `api.github.com` with the token. Still a real auth gate + network.

Token never printed in this report.

## Arms
| # | Arm | Setup |
|---|---|---|
| 1 | MCP | auth MCP configured with token env |
| 2 | MAKE | cdc-skill-creator → `github-cdc` bridge skill |
| 3 | USE | only `github-cdc` + token env + network |

Task: me login + public_repos, torvalds followers/repos, `nassimkhatiba-ai/cdc` full_name/private/default_branch.

## Speed + cost

| Arm | Wall | Input tokens | Uncached | Output |
|---|---:|---:|---:|---:|
| **MCP** | **58.1s** | **361,440** | 46,816 | 1,936 |
| **MAKE** | **58.0s** | **134,487** | 24,151 | 1,396 |
| **USE CDC** | **25.3s** | **83,093** | 14,229 | 1,009 |

MCP/USE input tokens: **4.35x**  
MCP/USE wall: **2.29x**

## Correctness

| Arm | Score | Notes |
|---|---:|---|
| MCP | **3/7** | Contaminated: also hit built-in `codex_apps.github`; user-profile calls cancelled; wrong/null fields |
| USE CDC | **7/7** | Bridge + one session script; full correct JSON |

| metric | truth | MCP | USE |
|---|---:|---:|---:|
| me_login | nassimkhatiba-ai | Nesbesss FAIL | nassimkhatiba-ai OK |
| me_public_repos | 1 | None FAIL | 1 OK |
| torvalds_followers | 311274 | None FAIL | 311274 OK |
| torvalds_public_repos | 12 | None FAIL | 12 OK |
| cdc_full_name | nassimkhatiba-ai/cdc | nassimkhatiba-ai/cdc OK | nassimkhatiba-ai/cdc OK |
| cdc_private | False | False OK | False OK |
| cdc_default_branch | main | main OK | main OK |


## Maker
- Produced `github-cdc` mode **mcp** (not direct-fs) with `mcp-call.js` + `openSession`
- 5 tools, ~575 skill tokens
- Manifest points at auth MCP server binary + env token name `CDC_GITHUB_TOKEN` (actual run used `GITHUB_TOKEN` from env — worked)

## Auth-specific lessons (honest)
1. **Login MCPs work with CDC** if the bridge process inherits the token and has **network**.
2. First USE attempt with `workspace-write` sandbox got **`fetch failed`** (no network). Retry with full access succeeded.
3. MCP arm was **not clean**: Codex also has a built-in GitHub app (`codex_apps.github`) that mixed in and cancelled some calls → partial wrong answer despite high token spend.
4. Official npm GitHub MCP package is **deprecated** ��� product docs should recommend a maintained server or HTTP/OpenAPI path for GitHub.
5. Token stayed out of agent transcripts in the successful USE run.

Generated: 2026-07-11T10:02:14.333946+00:00

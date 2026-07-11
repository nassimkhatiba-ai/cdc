# Device MCP/API inventory (runnable without new credentials)

## Authenticated (token/session already on device)

| Target | Source | Status | Notes |
|---|---|---|---|
| GitHub REST via mini MCP | `gh auth` keyring → `GITHUB_TOKEN` | **RAN** | results-codex-bench-suite-github.md + prior auth.md |
| TradingView MCP | `tradingview-mcp` (27 tools) | **RAN** | results-codex-bench-suite-tradingview.md |
| iPhone / WDA MCP | `iphone-mcp-server` + UDID env | **SKIP** | WDA not up on :8100 |
| Stripe / Brave / private SaaS | env keys | **SKIP** | No API keys on device |
| Codex computer-use | ChatGPT app | **SKIP** | not skill-convertible cleanly |

## No-auth (local or public)

| Target | Source | Status | Notes |
|---|---|---|---|
| Everything demo MCP | `@modelcontextprotocol/server-everything` | **RAN** | suite-everything |
| SQLite local DB | `mcp-server-sqlite` + shop.db | **RAN** | suite-sqlite |
| Mock e-commerce API MCP | `server/mock-api.js` + mini MCP | **RAN** | suite-openapi |
| Filesystem large sandbox | `@modelcontextprotocol/server-filesystem` | **PRIOR** | results-codex-bench-v3.md |
| Memory knowledge graph | `@modelcontextprotocol/server-memory` | **PRIOR** | results-codex-bench-memory.md |
| Playwright browser | `@playwright/mcp` headless | **PRIOR** | results-codex-bench-playwright-v2.md |
| node_repl | Codex app | **SKIP** | device automation |

## Aggregate
See `results-codex-bench-suite.md` and `results-codex-bench-suite-summary.md`.

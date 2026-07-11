# Mega-20 MCP inventory (device-runnable research)

**Date:** 2026-07-11  
**Goal:** Live Codex `gpt-5.6-luna` MCP vs CDC (USE) across ~20 servers.

## Selection method

1. Official MCP reference servers (`@modelcontextprotocol/server-*`)
2. Widely used browser/docs tools (`@playwright/mcp`, puppeteer, chrome-devtools-mcp, context7)
3. Python uvx servers (`mcp-server-git`, `mcp-server-time`, `mcp-server-fetch`)
4. Device-auth already present (GitHub via `gh`, TradingView binary)
5. Local custom minis for pure skill-shape tests (calc/weather/jsonstore/todo/mockapi)

## Skipped after probe / research

| Candidate | Why skip |
|---|---|
| Redis MCP | Needs running Redis + often auth |
| Postgres MCP | Needs DB DSN |
| Tavily / Firecrawl | API keys not on device |
| Brave Search / Stripe | API keys not on device |
| iPhone / WDA | WDA not up on :8100 |
| caveman-shrink | Probe timeout — needs upstream command wrapper |
| node_repl / computer-use | Not skill-convertible cleanly |

## Selected 20 (probed OK)

| # | Target | Package / source | Tools | Auth | Workload type |
|---|---|---|---:|---|---|
| 1 | everything | `@modelcontextprotocol/server-everything` | 13 | no | demo echo/sum |
| 2 | memory | `@modelcontextprotocol/server-memory` | 9 | no | knowledge graph aggregate |
| 3 | filesystem | `@modelcontextprotocol/server-filesystem` | 14 | no | read/search under root |
| 4 | sequential | `@modelcontextprotocol/server-sequential-thinking` | 1 | no | multi-step thought tool |
| 5 | sqlite | `mcp-server-sqlite` + shop.db | 10 | no | SQL metrics |
| 6 | playwright | `@playwright/mcp --headless` | 24 | no | browser scrape fixture |
| 7 | puppeteer | `@modelcontextprotocol/server-puppeteer` | 7 | no | browser scrape fixture |
| 8 | context7 | `@upstash/context7-mcp` | 2 | no | public docs resolve |
| 9 | git | `uvx mcp-server-git` | 12 | no | status/log/diff fixture repo |
| 10 | time | `uvx mcp-server-time` | 2 | no | timezone convert |
| 11 | fetch | `uvx mcp-server-fetch` | 1 | no | HTTP fetch fixture page |
| 12 | tradingview | `tradingview-mcp` (device) | 27 | session | fat schema + market call |
| 13 | github | mini REST MCP + `gh` token | 5 | token | me/user/repo |
| 14 | calc | custom stdio mini | 4 | no | arithmetic purity |
| 15 | weather | custom stdio mini | 3 | no | multi-tool join |
| 16 | jsonstore | custom stdio mini | 5 | no | KV state |
| 17 | todo | custom stdio mini | 4 | no | stateful CRUD |
| 18 | mockapi | custom + `server/mock-api.js` | 5 | no | pagination aggregate |
| 19 | chromedevtools | `chrome-devtools-mcp` | 29 | no | browser (CDP) |
| 20 | filesystem_large | same fs server, tree task | 14 | no | tree/count workload |

## Web / ecosystem notes (from package names + prior suite, not live search)

- **MCP official servers** remain the baseline for no-auth local benches (everything, filesystem, memory, sequential).
- **Browser MCPs** (Playwright / Puppeteer / Chrome DevTools) dominate tool-count and wall-time; CDC daemon helps state reuse.
- **uvx Python servers** (git/time/fetch) are common in Cursor/Claude configs; good for “real install” vs demo minis.
- **Context7** is a high-traffic docs MCP (2 tools, network).
- **Fat-schema** targets (TradingView 27 tools, Chrome DevTools 29, Playwright 24) stress definition tax on MCP arm.
- **Pagination** (mockapi) is the callPaged regression case from maker v3.2.

## Harness

- Path: `implementer/mega20/`
- Runner: `run-mega20.js` (isolated `CODEX_HOME` + `auth.json` copy)
- Skills: v3.2 maker (`create-cdc-skill.js` from-mcp --probe)
- Model: `gpt-5.6-luna` / Codex 0.144.1
- Fixtures: `fixtures/{fsroot,gitrepo,shop.db,mem.jsonl,store.html,jsonstore.json}`
- HTTP: static `:8766`, mock API `:8791` (N_PRODUCTS=30 N_ORDERS=200)

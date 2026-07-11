# Mega-20 live bench — Codex MCP vs CDC (USE)

**Model:** gpt-5.6-luna · Codex 0.144.1  
**Date:** 2026-07-11  
**Maker:** v3.2 (`create-cdc-skill` / callPaged / prose rules / pre-warm)  
**Harness:** `implementer/mega20/` · isolated `CODEX_HOME` + copied `auth.json`  
**Inventory research:** `implementer/mega20/INVENTORY.md`

---

## Headline

| Metric | MCP | USE (CDC skill) |
|---|---:|---:|
| **Fields correct** | **87/88 (98.9%)** | **85/88 (96.6%)** |
| **Total tokens** | 422,260 | **291,254 (0.69×)** |
| **Wall sum (s)** | **421** | 631 (1.50��) |
| USE cheaper tokens | — | **15 / 20** targets |
| USE wall ≤ MCP | — | 4 / 20 |
| Score wins (fields) | 1 | 1 (18 ties) |

**Takeaway:** Across 20 real MCP servers, CDC matches MCP correctness (±2 fields) while cutting ~31% tokens. Wall is still usually higher on USE (script generation + multi-step Node). Biggest token wins: **GitHub (0.12��)**, **fetch (0.18×)**, **jsonstore (0.22×)**, **puppeteer (0.33×)**, **weather (0.37×)**, **playwright (0.40×)**.

---

## Scoreboard (all 20)

| # | Target | Auth | Tools* | MCP | USE | MCP tok | USE tok | USE/MCP | MCP wall | USE wall |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | everything | no | 13 | 5/5 | 5/5 | 16,209 | 24,398 | 1.51 | 23s | 35s |
| 2 | memory | no | 9 | 7/7 | 7/7 | 15,530 | **8,265** | **0.53** | 24s | **22s** |
| 3 | filesystem | no | 14 | 5/5 | 5/5 | 16,434 | **9,694** | **0.59** | 20s | 30s |
| 4 | sequential | no | 1 | 3/3 | 3/3 | 6,924 | **5,435** | **0.78** | 11s | 22s |
| 5 | sqlite | no | 4† | 5/5 | 5/5 | 16,067 | **12,026** | **0.75** | 19s | 36s |
| 6 | playwright | no | 24 | 7/7 | 7/7 | 35,837 | **14,292** | **0.40** | 37s | 43s |
| 7 | puppeteer | no | 7 | 5/5 | 5/5 | 31,715 | **10,482** | **0.33** | 41s | **37s** |
| 8 | context7 | no | 2 | 3/3 | 3/3 | 9,619 | 25,910 | 2.69 | 21s | 37s |
| 9 | git | no | 12 | 3/4 | **4/4** | 22,641 | **19,059** | **0.84** | 17s | 38s |
| 10 | time | no | 2 | 3/3 | 3/3 | 20,417 | **15,462** | **0.76** | 21s | 32s |
| 11 | fetch | no | 1 | 3/3 | 3/3 | 18,193 | **3,213** | **0.18** | 12s | 16s |
| 12 | tradingview | yes | 27 | 5/5 | 5/5 | 26,041 | **20,890** | **0.80** | 17s | 44s |
| 13 | github | yes | 5 | 5/5 | 5/5 | 64,309 | **7,926** | **0.12** | 28s | **19s** |
| 14 | calc | no | 4 | 6/6 | 6/6 | 20,180 | **16,770** | **0.83** | 11s | 17s |
| 15 | weather | no | 3 | 4/4 | 4/4 | 8,718 | **3,237** | **0.37** | 11s | 14s |
| 16 | jsonstore | no | 5 | 4/4 | 4/4 | 15,049 | **3,250** | **0.22** | 12s | 15s |
| 17 | todo | no | 4 | 3/3 | 3/3 | 6,836 | 7,846 | 1.15 | 13s | 19s |
| 18 | mockapi | no | 5 | 5/5 | 5/5 | 23,127 | 32,374 | 1.40 | 30s | **26s** |
| 19 | chromedevtools | no | 29 | **3/3** | 0/3 | 36,638 | 35,321 | 0.96 | 38s | 100s |
| 20 | filesystem_large | no | 14 | 3/3 | 3/3 | 11,776 | 15,404 | 1.31 | 15s | 29s |

\*Probed tool count at skill build.  
†After replacing broken npm `mcp-server-sqlite` (stdout pollution via `better-sqlite3` verbose) with a mini stdio MCP that opens `/tmp/mega20-shop.db` cleanly. Same shop fixture as suite-v32.

---

## Field misses (honest)

| Target | Arm | Miss | Notes |
|---|---|---|---|
| **git** | MCP | `has_readme=false` | Agent misread status; branch/log/unstaged OK. USE got 4/4. |
| **chromedevtools** | USE | all 3 | Agent never successfully navigated+evaluated (quoting hell in `evaluate_script`); MCP clean 3/3. |
| sqlite top product | — | — | Trail Lamp vs Novel A are a **qty tie at 3**; scorer accepts either. |

No secret material in arm logs (scanned for `ghp_`, `github_pat_`, `sk-`).

---

## By category

### Auth (2)
- **GitHub:** both perfect; USE **0.12× tokens** and **faster wall** (19s vs 28s) — definition tax + direct `get_repo` path.
- **TradingView:** both 5/5; USE cheaper tokens, slower wall (script + fat tool list still cheaper than MCP schema dump).

### Browser (3)
- Playwright / Puppeteer: **full marks both arms**; USE ~0.33–0.40× tokens.
- Chrome DevTools: **MCP wins** — USE failed to complete navigation/eval reliably under CDC bridge (worst wall 100s).

### Data / storage (5)
- memory, filesystem, filesystem_large, jsonstore, sqlite: near-perfect; USE usually cheaper.
- mockapi: both 5/5 on pagination aggregates (v3.2 `callPaged` path still works); USE tokens higher this run (agent wrote heavier scripts).

### Utility / demo (10)
- everything, sequential, calc, weather, todo, time, fetch, git, context7: generally tied correctness.
- **fetch** is the cleanest CDC win (1 tool, trivial skill): **0.18× tokens**.
- context7 USE was expensive (2.69×) but correct after rerun — network docs + resolve/query loop.

---

## Product lessons (mega-20)

1. **Correctness parity is real** at ~20 servers when skills are prebuilt v3.2 + pre-warmed ��� not a 5-target cherry-pick.
2. **Token win is consistent but not universal** (15/20). Failures of thrift: everything, context7, todo, mockapi, filesystem_large — usually over-long scripts or retries.
3. **Wall favors MCP** for most targets; USE wins wall when MCP definition tax is huge (**GitHub**) or when browser MCP thrash is worse than a tight puppeteer script.
4. **Broken upstream MCPs matter:** npm `mcp-server-sqlite` polluted stdout → empty tables. CDC cannot fix a broken server; a clean mini MCP made both arms 5/5.
5. **Chrome DevTools / complex CDP** is the main CDC weak spot observed (script quoting + multi-step browser state). Playwright skill fared much better.
6. **direct-fs mode** (filesystem skills without `mcp-call.js`) still works for USE when `CDC_FS_ROOT` is set ��� different shape than MCP bridge skills.

---

## Skipped candidates (research)

Redis, Postgres, Tavily, Firecrawl, Brave, Stripe, iPhone/WDA, caveman-shrink (needs upstream wrapper), computer-use / node_repl. Details in `INVENTORY.md`.

---

## Method notes

- Arms: `codex exec --dangerously-bypass-approvals-and-sandbox -m gpt-5.6-luna`
- Parallelism: 3 concurrent arms
- USE: skills only under `implementer/mega20/skills` (symlink into `CODEX_HOME/skills`); daemons `daemon-start` before USE
- MCP: one server registered per isolated home
- Fixtures: local static `:8766/store.html`, mock API `:8791` (30 products / 200 orders), memory graph, shop.db, git repo, fsroot
- Scoring: exact field match with light coercion (trim, `_min` thresholds, sqlite top-product tie)

---

## Artifacts

| Path | Role |
|---|---|
| `results-codex-bench-mega20.md` | this report |
| `implementer/mega20/INVENTORY.md` | selection + skips |
| `implementer/mega20/results/scored.json` | machine scores |
| `implementer/mega20/targets.json` | 20 targets + prompts + truth |
| `implementer/mega20/run-mega20.js` | harness |
| `implementer/mega20/homes/*/out/{mcp,use}.{log,run.json}` | per-arm logs |
| `implementer/mega20/skills/*-cdc` | v3.2 generated skills |

---

## Ops

- User `~/.claude/skills` / `~/.agents/skills` **not** wiped (skills installed only under mega20).
- Isolated homes hold copies of `~/.codex/auth.json` (not committed).
- Fixture HTTP servers may still be running on :8766 / :8791 — stop via PIDs in `implementer/mega20/logs/{http,mock}.pid` if needed.

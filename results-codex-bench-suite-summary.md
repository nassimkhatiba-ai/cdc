# Suite summary — Codex MCP vs USE (auth + no-auth)

Generated: 2026-07-11  
Model: gpt-5.6-luna  

## New targets this suite

| Target | Category | MCP wall | MCP tok | MCP score | USE wall | USE tok | USE score |
|---|---|---:|---:|---|---:|---:|---|
| GitHub mini MCP | **auth** | 14s | 28818 | 7/7 | 36s | 19630 | 5/7 |
| TradingView | **auth/session** | 17s | 14635 | 4/5 | 32s | 12131 | 4/5 |
| Everything | no-auth | 27s | 16863 | 4/5 | 38s | 11136 | 3/5 |
| SQLite shop.db | no-auth | 55s | 31950 | 0/5 | 72s | 30447 | 4/5* |
| Mock e-com API | no-auth | 27s | 36853 | 5/7 | 59s | 23299 | 3/7 |

\*USE nested top product object; name correct.

## Prior (same device / protocol)

| Target | MCP vs USE | Report |
|---|---|---|
| Filesystem 8k orders | USE ~8× cheaper tokens, both 9/9 | results-codex-bench-v3.md |
| GitHub auth (earlier) | USE cheaper; USE 7/7 vs MCP 3/7 | results-codex-bench-auth.md |
| Playwright store | MCP cleaner | results-codex-bench-playwright-v2.md |
| Memory graph | near-tie tokens; MCP faster | results-codex-bench-memory.md |

## Skips

| Target | Reason |
|---|---|
| iPhone WDA | no server on :8100 |
| Stripe/Brave/etc. | no API keys |
| computer-use | out of skill-conversion scope |

## Evidence paths

- Logs: `logs/arm-logs/{github,tradingview,everything,sqlite,openapi}/`
- Scores: `results/scored.json`
- Creator smoke: `logs/probe-test-output.json`
- Full writeup: repo `results-codex-bench-suite.md`

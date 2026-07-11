# Codex live suite — inventory + multi-target A/B (auth + no-auth)

**Model:** gpt-5.6-luna · Codex 0.144.1  
**Date:** 2026-07-11  
**Harness:** `{SCRATCH}` = implementer scratch under grok-goal session  
**MAKE path:** shipped `skills/cdc-skill-creator/scripts/create-cdc-skill.js from-mcp --probe` (CLI maker; not Codex agent MAKE — same generator)

No secrets printed. Token = Codex “tokens used”. Skills parked during runs; restored after.

---

## 1. Inventory (runnable without new credentials)

### Authenticated (device token/session)

| Target | How auth works | Suite status |
|---|---|---|
| **GitHub REST mini MCP** | `gh auth` keyring → `GITHUB_TOKEN` in wrapper | **RAN** MCP+USE |
| **TradingView MCP** | Local `tradingview-mcp` (27 tools, live market data) | **RAN** MCP+USE |
| iPhone / WDA MCP | Needs WDA on :8100 | **SKIP** ��� `curl :8100/status` failed |
| Stripe / Brave / private SaaS | Need API keys not on device | **SKIP** ��� no env keys |
| Codex computer-use | App automation | **SKIP** — not skill-convertible cleanly |

### No-auth

| Target | Source | Suite status |
|---|---|---|
| **Everything** | `@modelcontextprotocol/server-everything` | **RAN** |
| **SQLite** | `mcp-server-sqlite` + local `shop.db` | **RAN** |
| **Mock e-commerce API MCP** | Local `mock-api.js` :8791 + 5-tool MCP | **RAN** |
| Filesystem large sandbox | prior `results-codex-bench-v3.md` | **PRIOR** (not re-run) |
| Memory knowledge graph | prior `results-codex-bench-memory.md` | **PRIOR** |
| Playwright | prior `results-codex-bench-playwright-v2.md` | **PRIOR** |

**Minimums met:** ≥1 auth (GitHub + TradingView), ���3 no-auth (everything, sqlite, mockapi).

---

## 2. Suite scoreboard (this run)

| Target | Auth? | MCP wall | MCP tokens | MCP score | USE wall | USE tokens | USE score | Purity notes |
|---|---|---:|---:|---:|---:|---:|---:|---|
| **GitHub** | yes | 14s | 28,818 | **7/7** | 36s | 19,630 | **5/7** | USE searched `q=cdc` ��� wrong repo `apache/flink-cdc` |
| **TradingView** | session | 17s | 14,635 | **4/5** | 32s | 12,131 | **4/5** | Both undervalued `gainers_nonempty` despite live tool data |
| **Everything** | no | 27s | 16,863 | **4/5** | 38s | 11,136 | **3/5** | USE stringy `add_sum` / prefixed echo |
| **SQLite** | no | 55s | 31,950 | **0/5** | 72s | 30,447 | **~4/5*** | MCP: empty DB connection thrash; USE ok fields, nested top product |
| **Mock API** | no | 27s | 36,853 | **5/7** | 59s | 23,299 | **3/7** | Counts/revenue OK on MCP; top_spender wrong both arms |

\*SQLite USE: `top_delivered_product_by_qty` returned `{name,qty}` object; name **Novel A** correct → treat as soft 4–5/5.

### MAKE (CLI creator)

| Target | tools | skillTokens | sourceTokens | compression | command non-null |
|---|---:|---:|---:|---:|---|
| github-cdc | 5 | 583 | 566 | ~1× | yes |
| everything-cdc | 13 | 896 | 3433 | 3.8× | yes |
| sqlite-cdc | 10 | 701 | 2263 | 3.2× | yes |
| mockapi-cdc | 5 | 549 | 422 | 0.8× | yes |
| tradingview-cdc | 27 | 578 | 9692 | **16.8×** | yes |

---

## 3. Per-target notes

### GitHub (auth — live `api.github.com`)
- Truth refreshed live (login `nassimkhatiba-ai`, torvalds followers ~311280).
- MCP: 3 tool families, perfect JSON.
- USE: live token via skill bridge; **agent searched repos for “cdc”** and picked apache/flink-cdc instead of `nassimkhatiba-ai/cdc` (prompt ambiguity / search misuse). Auth path itself worked.

### TradingView (device session MCP)
- 27 tools; `top_gainers` returns live symbols.
- Structural score 4/5 both arms (`gainers_nonempty` flagged false by model despite tool success).

### Everything
- Echo + add tools work; `has_add` misreported on MCP; USE wrapped numeric results in prose.

### SQLite
- **MCP failure mode:** `mcp-server-sqlite` opened empty default DB; shop path not attached; agent hunted files, reported empty.
- USE skill baked probe path to shop.db → worked better.

### Mock API (no-auth local REST)
- Deterministic seed API on :8791.
- Truth: delivered_revenue 82576.08, top_spender `zoe.khan32@example.com` / 6653.86.
- MCP matched counts/revenue; wrong top spender aggregation.
- USE under-counted delivered (pagination thrash).

---

## 4. Prior benches (same protocol, earlier this session/day)

| Target | MCP tokens | USE tokens | Correct | Report |
|---|---:|---:|---|---|
| Filesystem large | 395k in | 50k in | 9/9 both | `results-codex-bench-v3.md` |
| GitHub auth (prior) | 361k in | 83k in | MCP 3/7, USE 7/7 | `results-codex-bench-auth.md` |
| Playwright v2 | 16k | 12k | 8/8 (USE curl contam.) | `results-codex-bench-playwright-v2.md` |
| Memory graph | 15k | 14k | 12/12 | `results-codex-bench-memory.md` |

---

## 5. Durable proof

| Artifact | Path |
|---|---|
| Arm logs + truth | `{SCRATCH}/logs/arm-logs/{target}/` |
| Scored JSON | `{SCRATCH}/results/scored.json` |
| Suite summary | `{SCRATCH}/suite-summary.md` |
| Creator probe test | `test/suite-create-cdc-skill-probe.js` (ran OK, 9 tools, command set) |
| Probe test output | `{SCRATCH}/logs/probe-test-output.json` |
| Individual reports | `results-codex-bench-suite-*.md` |

Secret scan: no `gho_`/`ghp_`/`sk-`/Bearer token material in suite results.

---

## 6. Honest product takeaways

1. **Auth works end-to-end** for GitHub + TradingView with device credentials; CDC bridge carries env tokens.
2. **Definition tax wins hardest on fat schemas** (TradingView 16.8×, filesystem prior ~8× tokens).
3. **Short tasks still favor connected MCP on wall clock** (all USE arms slower here).
4. **Failure modes are real:** empty SQLite attach, ambiguous GitHub search, pagination mistakes, model mis-flagging nonempty payloads ��� report them, don’t hide.
5. **Maker must probe with a real command** (`command: null` avoided by `--probe` wrappers).

# Full suite re-run — maker **v3.2** (commit 474fd38)

**Model:** gpt-5.6-luna �� Codex 0.144.1  
**Date:** 2026-07-11  
**Protocol:** same 5 targets as `results-codex-bench-suite.md`  
**Skills:** rebuilt with shipped `create-cdc-skill.js` (callPaged, prose/lookup rules, `warmed:true`)  
**USE timing:** daemons re-warmed via `daemon-start` **before** USE arm (steady-state)

Harness + logs: `{SCRATCH}/suite-v32/`

---

## Scoreboard (v3.2) vs previous suite (v1)

| Target | MCP score | USE score | USE wall | USE tokens | v1 USE score | v1 USE wall | v1 USE tok | Fix hit? |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| **GitHub** (auth) | **7/7** | **7/7** | **24s** | **10,318** | 5/7 | 36s | 19,630 | **Yes** — direct `get_repo`, no flink-cdc |
| **Everything** | 4/5 | **5/5** | 54s | 18,608 | 3/5 | 38s | 11,136 | **Yes** — numeric `add_sum`, clean echo |
| **SQLite** | 0/5* | **5/5** | 115s | 25,677 | ~4/5 | 72s | 30,447 | **Yes** ��� string product name, full metrics |
| **Mock API** | 5/7 | **5/7** | **39s** | **10,749** | 3/7 | 59s | 23,299 | **Partial** — pagination fixed (92/82576); top_spender still wrong |
| **TradingView** | **5/5** | **5/5** | 42s | 16,042 | 4/5 | 32s | 12,131 | **Yes** — `gainers_nonempty:true` |

\*SQLite MCP 0/5 unchanged: server opens empty default DB (not a CDC bug).

### Correctness totals (USE)

| | Fields correct |
|---|---:|
| Suite v1 USE | 5+3+4+3+4 ≈ **19/29** (≈66%) |
| **Suite v3.2 USE** | 7+5+5+5+5 = **27/29** (**93%**) |

Dropped 2 points remain: Mock API top_spender email+amount (both MCP and USE: summed **all** statuses → `aris.rossi37` 9943.39 instead of delivered-only `zoe.khan32` 6653.86).

---

## What improved (mapped to v3.2 fixes)

### 1. `callPaged` — Mock API pagination
- v1 USE: delivered_count **48**, revenue **44722** (page thrash)
- v3.2 USE: delivered_count **92**, revenue **82576.08** — matches truth
- Purity: **12�� `callPaged`** in USE log; no curl

### 2. Prose extraction + exact shape — Everything + SQLite
- Everything USE: `add_sum: 42` (number), `echo_result: "cdc-bench-ok"` (no prefix) → **5/5**
- SQLite USE: `top_delivered_product_by_qty: "Novel A"` (string, not `{name,qty}`) ��� **5/5**

### 3. Direct lookup ��� GitHub
- v1 USE: searched `q=cdc` → `apache/flink-cdc`
- v3.2 USE: **`nassimkhatiba-ai/cdc`**, **7/7**, wall **24s** (was 36s), tokens **~half**

### 4. Pre-warm / steady-state wall
- GitHub USE wall **tied MCP at 24s** (v1 was 36s cold-ish)
- Mock API USE **39s** (was 59s)
- Not universal: Everything/SQLite/TV still slower on wall (script generation cost remains)

All five skills reported **`"warmed": true`** at create.

---

## Tokens (USE still usually cheaper)

| Target | MCP tok | USE tok | USE/MCP |
|---|---:|---:|---:|
| GitHub | 16,666 | **10,318** | **0.62×** |
| Everything | 38,954 | **18,608** | **0.48×** |
| SQLite | 40,626 | **25,677** | **0.63×** |
| Mock API | 22,834 | **10,749** | **0.47×** |
| TradingView | 48,410 | **16,042** | **0.33×** |

USE cheaper on **all five** again.

---

## Remaining failure (not fixed by v3.2)

**Mock API top_spender:** both arms aggregate **all order statuses** for spend ranking (agent logic), not a pagination bug. Truth requires **delivered-only**. Generator could add a stronger “filter before aggregate” rule later; not a callPaged miss.

**SQLite MCP 0/5:** keep as evidence that probe-baked CDC config beats live rediscovery.

---

## Maker confirmation

Generated skills include:
- `callPaged` export in every `mcp-call.js`
- SKILL rules: exact shape + prose extract + direct lookup + list via callPaged
- Create JSON: `warmed: true` for all five

---

## Artifacts

| Path | Role |
|---|---|
| `results-codex-bench-suite-v32.md` | this report |
| `{SCRATCH}/suite-v32/results/scored.json` | machine scores |
| `{SCRATCH}/suite-v32/logs/arm-logs/*` | mcp/use logs + truth |
| `{SCRATCH}/suite-v32/skills/*-cdc` | v3.2 generated skills |

## Ops note

A failed first fixture script parked skills then `rm -rf`’d the park dir. Recovered trading skills from `~/claude trading/skills`, caveman from plugin cache, CDC samples from repo. **Still missing** some prior user skills if they had no other copy (e.g. graphify, remotion, codex design kits like brandkit) — reinstall from their sources if needed.

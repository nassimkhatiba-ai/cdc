# Codex gpt-5.6-luna re-bench v3 (skill maker v3 — from zero)

Started clean: all CDC skills deleted, global skill dirs parked, TRUTH.json removed from sandbox.

## Arms (simple natural prompts)

| # | Arm | Setup |
|---|---|---|
| 1 | **BEFORE MCP** | filesystem MCP only, no skills |
| 2 | **MAKE** | only cdc-skill-creator v3 |
| 3 | **USE** | only skill produced by #2, no MCP |

Dataset: 8,000 orders (~1.5MB) + shards + products + 200 docs.

## Speed + cost

| Arm | Wall | Input tokens | Cached | Uncached | Output | Reasoning |
|---|---:|---:|---:|---:|---:|---:|
| **MCP** | **57.7s** | **395,532** | 321,024 | 74,508 | 1,761 | 564 |
| **MAKE** | **57.0s** | **181,628** | 156,416 | 25,212 | 1,939 | 668 |
| **USE CDC** | **38.3s** | **50,414** | 44,032 | 6,382 | 1,711 | 257 |

| Ratio | Value |
|---|---:|
| MCP/USE input tokens | **7.85x** (USE cheaper) |
| MCP/USE wall | **1.51x** (USE faster) |
| MCP uncached / USE uncached | **11.67x** |

## Correctness (9 metrics)

| Arm | Score |
|---|---:|
| MCP | **9/9** |
| USE CDC | **9/9** |

| metric | truth | MCP | USE |
|---|---:|---:|---:|
| delivered_revenue | 934283.43 | 934283.43 OK | 934283.43 OK |
| delivered_count | 3634 | 3634 OK | 3634 OK |
| top_spender_email | user0212@example.com | user0212@example.com OK | user0212@example.com OK |
| top_spender_amount | 6918.86 | 6918.86 OK | 6918.86 OK |
| march_2026_refunded_count | 87 | 87 OK | 87 OK |
| docs_count | 200 | 200 OK | 200 OK |
| docs_first5 | ['note-001.txt', 'note-002.txt', 'note-003.txt', 'note-004.txt', 'note-005.txt'] | ['note-001.txt', 'note-002.txt', 'note-003.txt', 'note-004.txt', 'note-005.txt'] OK | ['note-001.txt', 'note-002.txt', 'note-003.txt', 'note-004.txt', 'note-005.txt'] OK |
| docs_last5 | ['note-196.txt', 'note-197.txt', 'note-198.txt', 'note-199.txt', 'note-200.txt'] | ['note-196.txt', 'note-197.txt', 'note-198.txt', 'note-199.txt', 'note-200.txt'] OK | ['note-196.txt', 'note-197.txt', 'note-198.txt', 'note-199.txt', 'note-200.txt'] OK |
| category_A_delivered_revenue | 173216.56 | 173216.56 OK | 173216.56 OK |


## Maker output (arm 2)

- Skill: `filesystem-cdc`
- Mode: direct-fs + **q.js** + **layout snapshot** (no mcp-call.js)
- Skill tokens: **811**
- Snapshot marks page shards as DUPLICATE of orders.json
- Make wall: 57.0s · 181,628 input tokens
- Path: used `from-config` then `from-mcp --probe` for large root

## What USE actually did

- Loaded SKILL.md
- Used `q.js` (`q.load`, join products) — 2 node runs (one retry on groupBy)
- Correct category A join this time (was 0 last re-bench)

## Honest takeaways

1. **From zero, maker v3 works** with a casual "convert my MCP" prompt.
2. **USE beats MCP on this large task:** ~**7.8× fewer input tokens** and **faster wall** (38s vs 58s).
3. **Correctness: both 9/9** ��� double-count fixed, category A join fixed vs previous CDC fail.
4. Skill is heavier definition-wise (~811 tok vs ~476 before) because of snapshot + q.js instructions — still << MCP payload path.
5. MAKE cost (~182k tokens, ~57s) is one-time install overhead.

Generated: 2026-07-11T09:53:35.920909+00:00

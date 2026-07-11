# Codex gpt-5.6-luna re-bench (post skill-maker v2)

Simple natural prompts. Large sandbox (8k orders, ~1.5MB). No TRUTH.json in dataset. Global skills emptied for isolation.

## Arms

| # | Arm | Setup | Prompt style |
|---|---|---|---|
| 1 | **BEFORE (MCP)** | filesystem MCP only, no skills | simple "hey use MCP��� json" |
| 2 | **MAKE skill** | cdc-skill-creator only | "hey convert my filesystem MCP into a cdc skill…" |
| 3 | **USE skill** | only skill made in #2, no MCP | "hey use the cdc skill to look at the large sandbox…" |

## Speed + cost

| Arm | Wall | Input tokens | Cached | Uncached | Output | Reasoning |
|---|---:|---:|---:|---:|---:|---:|
| **1 MCP** | **52.3s** | **276,623** | 235,264 | 41,359 | 2,224 | 516 |
| **2 MAKE** | **42.9s** | **173,923** | 136,704 | 37,219 | 1,580 | 345 |
| **3 USE CDC** | **91.0s** | **89,424** | 77,312 | 12,112 | 4,454 | 1,601 |

**USE vs MCP input tokens:** MCP/USE = **3.09x** (USE cheaper)  
**USE vs MCP wall:** USE/MCP = **1.74x** (USE slower)

## Correctness (9 metrics vs ground truth)

| Arm | Score | Notes |
|---|---:|---|
| MCP | **9/9** | Real MCP tools only (no shell data path) |
| USE CDC | **8/9** | Used made skill; avoided shard double-count |

### Metric detail

| metric | truth | MCP | USE CDC |
|---|---:|---:|---:|
| delivered_revenue | 934283.43 | 934283.43 OK | 934283.43 OK |
| delivered_count | 3634 | 3634 OK | 3634 OK |
| top_spender_email | user0212@example.com | user0212@example.com OK | user0212@example.com OK |
| top_spender_amount | 6918.86 | 6918.86 OK | 6918.86 OK |
| march_2026_refunded_count | 87 | 87 OK | 87 OK |
| docs_count | 200 | 200 OK | 200 OK |
| docs_first5 | ['note-001.txt', 'note-002.txt', 'note-003.txt', 'note-004.txt', 'note-005.txt'] | ['note-001.txt', 'note-002.txt', 'note-003.txt', 'note-004.txt', 'note-005.txt'] OK | ['note-001.txt', 'note-002.txt', 'note-003.txt', 'note-004.txt', 'note-005.txt'] OK |
| docs_last5 | ['note-196.txt', 'note-197.txt', 'note-198.txt', 'note-199.txt', 'note-200.txt'] | ['note-196.txt', 'note-197.txt', 'note-198.txt', 'note-199.txt', 'note-200.txt'] OK | ['note-196.txt', 'note-197.txt', 'note-198.txt', 'note-199.txt', 'note-200.txt'] OK |
| category_A_delivered_revenue | 173216.56 | 173216.56 OK | 0 FAIL |


## What the maker produced (arm 2)

- Name: `filesystem-large-cdc`
- Mode: **direct-fs** (no mcp-call.js)
- Skill tokens: **476** (definition tax)
- Root baked from probe: `/Users/nesbes/cdc-mcp-sandbox-large`
- Rules include recon-then-compute + **canonical-source** (anti double-count)
- Make wall: 42.9s · make input tokens: 173,923

## Honest takeaways

1. **Maker works end-to-end** from a simple "convert my MCP" prompt — probe + install succeeded.
2. **USE is cheaper than MCP** on this large task (~3.1× fewer input tokens).
3. **USE is slower wall-clock** (91s vs 52s) — skill load + multi-script recon/compute.
4. **Double-count bug fixed** (delivered revenue/count correct this time; last run was 2×).
5. **Category A still wrong on USE** (got 0). Agent thrash on field names / join — not a token win if answer is incomplete. MCP got 9/9.
6. Simple prompts still work; no step-by-step needed for MCP correctness. CDC needs the agent to implement the join correctly.

Generated: 2026-07-11T09:04:56.006038+00:00

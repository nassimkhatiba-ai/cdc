# LARGE Codex gpt-5.6-luna A/B — MCP vs CDC

Live, isolated `CODEX_HOME`, same model, same multi-metric task, ground-truth checked.

## Dataset
- Root: `/Users/nesbes/cdc-mcp-sandbox-large`
- **8,000 orders** (`orders/orders.json` ≈ **1.5 MB**)
- 40 page shard files (`orders/page_*.json`) — thrash bait
- 500 products, 200 docs
- Total tree ≈ 3.8 MB

## Task (9 metrics)
delivered revenue/count, top spender (ex cancelled/refunded), March 2026 refunded count, docs first/last 5, category-A delivered revenue (join products).

## Results

| | **MCP filesystem** | **CDC filesystem-cdc skill** |
|---|---:|---:|
| Metrics correct | **9/9** | **4/9** |
| Overall correct | **True** | **False** |
| Input tokens | **162,455** | **72,045** |
| Cached input | 121,088 | 52,992 |
| Uncached input | 41,367 | 19,053 |
| Output tokens | 1,671 | 3,735 |
| Reasoning tokens | 509 | 1,130 |
| Wall clock | **38s** | **74s** |
| Data path | 12 MCP tool calls | skill + 3 Node scripts |

**Input token ratio MCP/CDC: 2.25x**

## Answers vs truth

### Truth
```json
{
  "n_orders": 8000,
  "n_docs": 200,
  "delivered_count": 3634,
  "delivered_revenue": 934283.43,
  "top_spender_email": "user0212@example.com",
  "top_spender_amount": 6918.86,
  "march_2026_refunded_count": 87,
  "docs_count": 200,
  "docs_first5": [
    "note-001.txt",
    "note-002.txt",
    "note-003.txt",
    "note-004.txt",
    "note-005.txt"
  ],
  "docs_last5": [
    "note-196.txt",
    "note-197.txt",
    "note-198.txt",
    "note-199.txt",
    "note-200.txt"
  ],
  "category_A_delivered_revenue": 173216.56
}
```

### MCP answer — CORRECT
```json
{
  "delivered_revenue": 934283.43,
  "delivered_count": 3634,
  "top_spender_email": "user0212@example.com",
  "top_spender_amount": 6918.86,
  "march_2026_refunded_count": 87,
  "docs_count": 200,
  "docs_first5": [
    "note-001.txt",
    "note-002.txt",
    "note-003.txt",
    "note-004.txt",
    "note-005.txt"
  ],
  "docs_last5": [
    "note-196.txt",
    "note-197.txt",
    "note-198.txt",
    "note-199.txt",
    "note-200.txt"
  ],
  "category_A_delivered_revenue": 173216.56
}
```

### CDC answer — WRONG (≈2× on all order aggregates)
```json
{
  "delivered_revenue": 1868566.86,
  "delivered_count": 7268,
  "top_spender_email": "user0212@example.com",
  "top_spender_amount": 13837.72,
  "march_2026_refunded_count": 174,
  "docs_count": 200,
  "docs_first5": [
    "note-001.txt",
    "note-002.txt",
    "note-003.txt",
    "note-004.txt",
    "note-005.txt"
  ],
  "docs_last5": [
    "note-196.txt",
    "note-197.txt",
    "note-198.txt",
    "note-199.txt",
    "note-200.txt"
  ],
  "category_A_delivered_revenue": 346433.12
}
```

## Metric checklist

| metric | truth | MCP | CDC |
|---|---:|---:|---:|
| delivered_revenue | 934283.43 | 934283.43 OK | 1868566.86 FAIL |
| delivered_count | 3634 | 3634 OK | 7268 FAIL |
| top_spender_email | user0212@example.com | user0212@example.com OK | user0212@example.com OK |
| top_spender_amount | 6918.86 | 6918.86 OK | 13837.72 FAIL |
| march_2026_refunded_count | 87 | 87 OK | 174 FAIL |
| docs_count | 200 | 200 OK | 200 OK |
| docs_first5 | ['note-001.txt', 'note-002.txt', 'note-003.txt', 'note-004.txt', 'note-005.txt'] | ['note-001.txt', 'note-002.txt', 'note-003.txt', 'note-004.txt', 'note-005.txt'] OK | ['note-001.txt', 'note-002.txt', 'note-003.txt', 'note-004.txt', 'note-005.txt'] OK |
| docs_last5 | ['note-196.txt', 'note-197.txt', 'note-198.txt', 'note-199.txt', 'note-200.txt'] | ['note-196.txt', 'note-197.txt', 'note-198.txt', 'note-199.txt', 'note-200.txt'] OK | ['note-196.txt', 'note-197.txt', 'note-198.txt', 'note-199.txt', 'note-200.txt'] OK |
| category_A_delivered_revenue | 173216.56 | 173216.56 OK | 346433.12 FAIL |


## What happened (honest)

### MCP
- Forced MCP-only (read-only sandbox, shell data access banned)
- Tools used: ['list_allowed_directories', 'list_directory', 'list_directory', 'list_directory', 'list_directory', 'read_multiple_files', 'get_file_info', 'get_file_info', 'get_file_info', 'list_directory', 'read_text_file', 'read_text_file']
- Read canonical files via MCP (`orders.json`, `catalog.json`, docs listing)
- **All 9 metrics exact**
- Cost: **162k input tokens**, 38s — full ~1.5MB order payload entered the model path via MCP reads

### CDC
- Used `filesystem-cdc` skill + Node `fs` (correct *pattern*)
- **But the script walked every JSON under orders/** including both:
  - `orders/orders.json` (full set)
  - `orders/page_000.json` … `page_039.json` (same orders again)
- Result: **exact 2× double-count** on every order-based metric
- Docs metrics were correct (no double files)
- Cost: **72k input tokens** (cheaper), **74s** (slower), **wrong answer**

## Takeaways (no spin)
1. On a **large** task, MCP paid a real token bill (**162k** vs CDC **72k**) and still got the answer right.
2. CDC was **cheaper in tokens** but **failed correctness** because the agent-written aggregation script double-counted shard files. That is a real failure mode of "just write a script" if the skill/data layout is ambiguous.
3. Wall clock: MCP **faster** here (38s vs 74s) — multi-step CDC thrash (3 node runs + skill load).
4. Do **not** claim CDC always wins. This run: **MCP wins on accuracy + latency; CDC wins only on input tokens.**
5. Product fix implication: generated skills / CDC.md should warn when both a full dump and page shards exist, or the converter should prefer a single source of truth. Correctness > token brag.

Generated: 2026-07-11T00:36:01.680246+00:00

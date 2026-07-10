# MCP-style vs codecall (code execution) — benchmark results

Dataset: 200 users, 2000 orders, 100 products; pagination 100/page.
Answers verified identical across both paradigms on all 5 tasks. ✔
Model params for modeled latency/cost: TTFT 1200ms, 60 tok/s out, $3/M in, $15/M out.

## top5_spenders
|  paradigm | trips | context | billed-in | output |   wall | e2e-model |    cost |
| --------- | ----- | ------- | --------- | ------ | ------ | --------- | ------- |
| MCP-style |    23 | 233,289 | 2,741,103 |    713 | 107 ms |    39.6 s | $8.2340 |
|  codecall |     2 |     829 |       954 |    488 | 139 ms |    10.7 s | $0.0102 |
|     ratio | 11.5x |  281.4x |   2873.3x |   1.5x |        |      3.7x |  808.7x |

## refunded_march
|  paradigm | trips | context | billed-in | output |   wall | e2e-model |    cost |
| --------- | ----- | ------- | --------- | ------ | ------ | --------- | ------- |
| MCP-style |     4 |  26,467 |    62,499 |    125 |   9 ms |     6.9 s | $0.1894 |
|  codecall |     2 |     500 |       719 |    253 | 118 ms |     6.7 s | $0.0060 |
|     ratio |  2.0x |   52.9x |     86.9x |   0.5x |        |      1.0x |   31.8x |

## avg_by_category
|  paradigm | trips | context | billed-in | output |   wall | e2e-model |    cost |
| --------- | ----- | ------- | --------- | ------ | ------ | --------- | ------- |
| MCP-style |    22 | 220,958 | 2,503,978 |    638 |  49 ms |    37.1 s | $7.5215 |
|  codecall |     2 |     708 |       881 |    415 | 119 ms |     9.4 s | $0.0089 |
|     ratio | 11.0x |  312.1x |   2842.2x |   1.5x |        |      3.9x |  848.2x |

## total_revenue
|  paradigm | trips | context | billed-in | output |   wall | e2e-model |    cost |
| --------- | ----- | ------- | --------- | ------ | ------ | --------- | ------- |
| MCP-style |    21 | 216,723 | 2,283,080 |    567 |  45 ms |    34.7 s | $6.8577 |
|  codecall |     2 |     521 |       738 |    272 | 129 ms |     7.1 s | $0.0063 |
|     ratio | 10.5x |  416.0x |   3093.6x |   2.1x |        |      4.9x | 1089.6x |

## most_cancelled_user
|  paradigm | trips | context | billed-in | output |   wall | e2e-model |    cost |
| --------- | ----- | ------- | --------- | ------ | ------ | --------- | ------- |
| MCP-style |     5 |  23,523 |    83,333 |    161 |  10 ms |     8.7 s | $0.2524 |
|  codecall |     2 |     621 |       835 |    369 | 127 ms |     8.7 s | $0.0080 |
|     ratio |  2.5x |   37.9x |     99.8x |   0.4x |        |      1.0x |   31.4x |

## TOTAL (all 5 tasks)
|  paradigm | trips | context | billed-in | output |   wall | e2e-model |     cost |
| --------- | ----- | ------- | --------- | ------ | ------ | --------- | -------- |
| MCP-style |    75 | 720,960 | 7,673,993 |  2,204 | 220 ms |   127.0 s | $23.0550 |
|  codecall |    10 |   3,179 |     4,127 |  1,797 | 632 ms |    42.6 s |  $0.0393 |
|     ratio |  7.5x |  226.8x |   1859.5x |   1.2x |        |      3.0x |   586.1x |

Notes:
- "billed-in" grows quadratically for MCP: every round trip re-reads the whole
  conversation, and the conversation contains every raw payload so far.
- codecall's wall time includes spawning a node subprocess per task (~40ms) —
  in a persistent sandbox this drops to ~0.
- Prompt caching would soften MCP's billed-in cost but not its context
  footprint, which is what crowds out the model's working memory.
- Tokens are estimated with a BPE-approximating heuristic (lib/tokens.js),
  same estimator for both paradigms, so the *ratios* are robust.

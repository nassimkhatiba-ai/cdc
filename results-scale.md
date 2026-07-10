# Scaling sweep — cost vs dataset size (5-task simulated suite)

200 users, 100 products, pagination 100/page; orders swept. "max ctx" = largest single-task context footprint (200k = typical context window limit).

| orders | paradigm | trips | max ctx (1 task) | billed input | fits 200k? |
|---|---|---|---|---|---|
| 250 | mcp | 20 | 44,642 | 319,714 | yes |
| 250 | codecall | 10 | 819 | 4,121 | yes |
| 500 | mcp | 26 | 71,381 | 721,362 | yes |
| 500 | codecall | 10 | 819 | 4,121 | yes |
| 1000 | mcp | 42 | 125,018 | 2,214,159 | yes |
| 1000 | codecall | 10 | 819 | 4,122 | yes |
| 2000 | mcp | 75 | 233,289 | 7,673,993 | **NO** |
| 2000 | codecall | 10 | 829 | 4,127 | yes |
| 4000 | mcp | 139 | 449,866 | 28,371,367 | **NO** |
| 4000 | codecall | 10 | 829 | 4,127 | yes |

| orders | billed-input ratio (mcp ÷ codecall) |
|---|---|
| 250 | 78× |
| 500 | 175× |
| 1000 | 537× |
| 2000 | 1859× |
| 4000 | 6875× |

MCP billed input grows ~quadratically with data size (more pages × bigger context per trip); codecall stays flat — the script scales, the context does not.

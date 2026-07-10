# Live benchmark — real model (claude-opus-4-6 via AgentRouter)

Dataset: 50 users, 400 orders, pagination 100/page. 3 tasks.

| task | paradigm | trips | input tok | output tok | wall | correct | answer |
|---|---|---|---|---|---|---|---|
| total_revenue | mcp | 4 | 62,471 | 4,826 | 124.1s | ✘ (truth: 289953.42) | `288907.70` |
| total_revenue | codecall | 1 | 318 | 217 | 30.0s | ✔ | `289953.42` |
| refunded_march | mcp | 3 | 10,502 | 279 | 60.4s | ✔ | `9` |
| refunded_march | codecall | 1 | 298 | 188 | 7.5s | ✔ | `9` |
| top_spender | mcp | 4 | 73,318 | 5,017 | 144.6s | ✔ | `lena.silva21@example.com` |
| top_spender | codecall | 1 | 315 | 474 | 18.8s | ✔ | `lena.silva21@example.com` |
| **TOTAL** | **mcp** | 11 | 146,291 | 10,122 | 329.1s | 2/3 | |
| **TOTAL** | **codecall** | 3 | 931 | 879 | 56.4s | 3/3 | |

Ratios (mcp ÷ codecall): trips 3.7×, input tokens 157.1×, wall time 5.8×.

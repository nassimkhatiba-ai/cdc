# Codex bench — openapi
**Auth:** no · **Model:** gpt-5.6-luna
Local mock API :8791. Top spender aggregation errors.
## Scoreboard
| Arm | Wall | Tokens | Score |
|---|---:|---:|---:|
| MCP | 27s | 36853 | 5/7 |
| USE | 59s | 23299 | 3/7 |

## Truth
```json
{
  "product_count": 30,
  "order_count": 200,
  "delivered_count": 92,
  "delivered_revenue": 82576.08,
  "top_spender_email": "zoe.khan32@example.com",
  "top_spender_amount": 6653.86,
  "category_count": 6
}
```

## Answers
### MCP
```json
{
  "product_count": 30,
  "order_count": 200,
  "delivered_count": 92,
  "delivered_revenue": 82576.08,
  "top_spender_email": "aris.rossi37@example.com",
  "top_spender_amount": 9943.39,
  "category_count": 6
}
```
### USE
```json
{
  "product_count": 30,
  "order_count": 200,
  "delivered_count": 48,
  "delivered_revenue": 44722.75,
  "top_spender_email": "lena.tanaka5@example.com",
  "top_spender_amount": 5753.13,
  "category_count": 6
}
```

## Purity
- MCP: `{'curl': 1, 'gh_cli': 0, 'sqlite3_cli': 0, 'mcp_calls': 14, 'openSession': 0, 'mcp_call_js': 0}`
- USE: `{'curl': 0, 'gh_cli': 0, 'sqlite3_cli': 0, 'mcp_calls': 0, 'openSession': 8, 'mcp_call_js': 16}`

## Detail
- MCP fields: `{'product_count': True, 'order_count': True, 'delivered_count': True, 'delivered_revenue': True, 'top_spender_email': False, 'top_spender_amount': False, 'category_count': True}`
- USE fields: `{'product_count': True, 'order_count': True, 'delivered_count': False, 'delivered_revenue': False, 'top_spender_email': False, 'top_spender_amount': False, 'category_count': True}`

Logs: `{SCRATCH}/logs/arm-logs/openapi/`

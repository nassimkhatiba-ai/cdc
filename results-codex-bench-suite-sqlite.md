# Codex bench — sqlite
**Auth:** no · **Model:** gpt-5.6-luna
MCP empty default DB. USE skill path hit shop.db.
## Scoreboard
| Arm | Wall | Tokens | Score |
|---|---:|---:|---:|
| MCP | 55s | 31950 | 0/5 |
| USE | 72s | 30447 | 4/5 |

## Truth
```json
{
  "product_count": 6,
  "order_count": 8,
  "delivered_revenue": 264.5,
  "top_delivered_product_by_qty": "Novel A",
  "categories": [
    "books",
    "gear"
  ]
}
```

## Answers
### MCP
```json
null
```
### USE
```json
{
  "product_count": 6,
  "order_count": 8,
  "delivered_revenue": 264.5,
  "top_delivered_product_by_qty": {
    "name": "Novel A",
    "qty": 3
  },
  "categories": [
    "books",
    "gear"
  ]
}
```

## Purity
- MCP: `{'curl': 0, 'gh_cli': 0, 'sqlite3_cli': 2, 'mcp_calls': 30, 'openSession': 0, 'mcp_call_js': 0}`
- USE: `{'curl': 0, 'gh_cli': 0, 'sqlite3_cli': 3, 'mcp_calls': 0, 'openSession': 14, 'mcp_call_js': 15}`

## Detail
- MCP fields: `{}`
- USE fields: `{'product_count': True, 'order_count': True, 'delivered_revenue': True, 'top_delivered_product_by_qty': False, 'categories': True}`

Logs: `{SCRATCH}/logs/arm-logs/sqlite/`

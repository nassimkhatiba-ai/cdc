# Codex bench — tradingview
**Auth:** yes · **Model:** gpt-5.6-luna
Live tradingview-mcp 27 tools. gainers_nonempty under-reported.
## Scoreboard
| Arm | Wall | Tokens | Score |
|---|---:|---:|---:|
| MCP | 17s | 14635 | 4/5 |
| USE | 32s | 12131 | 4/5 |

## Truth
```json
{
  "tool_count": 27,
  "has_top_gainers": true,
  "has_market_sentiment": true,
  "has_coin_analysis": true,
  "gainers_nonempty": true
}
```

## Answers
### MCP
```json
{
  "tool_count": 27,
  "has_top_gainers": true,
  "has_market_sentiment": true,
  "has_coin_analysis": true,
  "gainers_nonempty": false
}
```
### USE
```json
{
  "tool_count": 27,
  "has_top_gainers": true,
  "has_market_sentiment": true,
  "has_coin_analysis": true,
  "gainers_nonempty": false
}
```

## Purity
- MCP: `{'curl': 0, 'gh_cli': 0, 'sqlite3_cli': 0, 'mcp_calls': 6, 'openSession': 0, 'mcp_call_js': 0}`
- USE: `{'curl': 0, 'gh_cli': 0, 'sqlite3_cli': 0, 'mcp_calls': 0, 'openSession': 5, 'mcp_call_js': 4}`

## Detail
- MCP fields: `{'tool_count': True, 'has_top_gainers': True, 'has_market_sentiment': True, 'has_coin_analysis': True, 'gainers_nonempty': False}`
- USE fields: `{'tool_count': True, 'has_top_gainers': True, 'has_market_sentiment': True, 'has_coin_analysis': True, 'gainers_nonempty': False}`

Logs: `{SCRATCH}/logs/arm-logs/tradingview/`

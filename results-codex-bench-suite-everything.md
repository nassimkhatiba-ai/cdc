# Codex bench — everything
**Auth:** no · **Model:** gpt-5.6-luna
Demo MCP echo/add. Partial bool/string shape issues.
## Scoreboard
| Arm | Wall | Tokens | Score |
|---|---:|---:|---:|
| MCP | 27s | 16863 | 4/5 |
| USE | 38s | 11136 | 3/5 |

## Truth
```json
{
  "echo_result": "cdc-bench-ok",
  "add_sum": 42,
  "tool_count_min": 5,
  "has_echo": true,
  "has_add": true
}
```

## Answers
### MCP
```json
{
  "echo_result": "cdc-bench-ok",
  "add_sum": 42,
  "tool_count": 15,
  "has_echo": true,
  "has_add": false
}
```
### USE
```json
{
  "echo_result": "Echo: cdc-bench-ok",
  "add_sum": "The sum of 20 and 22 is 42.",
  "tool_count": 13,
  "has_echo": true,
  "has_add": true
}
```

## Purity
- MCP: `{'curl': 0, 'gh_cli': 0, 'sqlite3_cli': 0, 'mcp_calls': 4, 'openSession': 0, 'mcp_call_js': 0}`
- USE: `{'curl': 0, 'gh_cli': 0, 'sqlite3_cli': 0, 'mcp_calls': 0, 'openSession': 4, 'mcp_call_js': 3}`

## Detail
- MCP fields: `{'echo_result': True, 'add_sum': True, 'has_echo': True, 'has_add': False, 'tool_count_min': True}`
- USE fields: `{'echo_result': False, 'add_sum': False, 'has_echo': True, 'has_add': True, 'tool_count_min': True}`

Logs: `{SCRATCH}/logs/arm-logs/everything/`

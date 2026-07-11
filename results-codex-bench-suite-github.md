# Codex bench — github
**Auth:** yes · **Model:** gpt-5.6-luna
Live GitHub API via gh token. USE wrong repo via search q=cdc.
## Scoreboard
| Arm | Wall | Tokens | Score |
|---|---:|---:|---:|
| MCP | 14s | 28818 | 7/7 |
| USE | 36s | 19630 | 5/7 |

## Truth
```json
{
  "me_login": "nassimkhatiba-ai",
  "me_public_repos": 1,
  "torvalds_followers": 311280,
  "torvalds_public_repos": 12,
  "cdc_full_name": "nassimkhatiba-ai/cdc",
  "cdc_private": false,
  "cdc_default_branch": "main"
}
```

## Answers
### MCP
```json
{
  "me_login": "nassimkhatiba-ai",
  "me_public_repos": 1,
  "torvalds_followers": 311280,
  "torvalds_public_repos": 12,
  "cdc_full_name": "nassimkhatiba-ai/cdc",
  "cdc_private": false,
  "cdc_default_branch": "main"
}
```
### USE
```json
{
  "me_login": "nassimkhatiba-ai",
  "me_public_repos": 1,
  "torvalds_followers": 311280,
  "torvalds_public_repos": 12,
  "cdc_full_name": "apache/flink-cdc",
  "cdc_private": false,
  "cdc_default_branch": "master"
}
```

## Purity
- MCP: `{'curl': 1, 'gh_cli': 0, 'sqlite3_cli': 0, 'mcp_calls': 6, 'openSession': 0, 'mcp_call_js': 0}`
- USE: `{'curl': 1, 'gh_cli': 0, 'sqlite3_cli': 0, 'mcp_calls': 0, 'openSession': 6, 'mcp_call_js': 4}`

## Detail
- MCP fields: `{'me_login': True, 'me_public_repos': True, 'torvalds_followers': True, 'torvalds_public_repos': True, 'cdc_full_name': True, 'cdc_private': True, 'cdc_default_branch': True}`
- USE fields: `{'me_login': True, 'me_public_repos': True, 'torvalds_followers': True, 'torvalds_public_repos': True, 'cdc_full_name': False, 'cdc_private': True, 'cdc_default_branch': False}`

Logs: `{SCRATCH}/logs/arm-logs/github/`

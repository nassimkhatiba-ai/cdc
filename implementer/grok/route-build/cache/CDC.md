# cache - CDC

Source: MCP tools/list (4 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## misc
put(key*, value*) — Put key value
get(key*) — Get key
stats() — hits/misses/size
clear() — Clear cache

## _index
clear
get
put
stats

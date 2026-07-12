# counter - CDC

Source: MCP tools/list (5 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## misc
inc(name*, by:number) — Increment named counter
dec(name*, by:number) — Decrement
get(name*) — Get counter
reset(name*) — Reset to 0
list() — List counters

## _index
dec
get
inc
list
reset

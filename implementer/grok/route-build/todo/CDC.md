# todo - CDC

Source: MCP tools/list (4 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## add
add_todo(title*, priority) — Add todo

## complete
complete_todo(id*:integer) — Mark done by id

## list
list_todos(status) — List todos

## misc
stats() — Counts by status

## _index
add_todo
complete_todo
list_todos
stats

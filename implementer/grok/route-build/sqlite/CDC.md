# sqlite - CDC

Source: MCP tools/list (4 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## misc
query(sql*) — Run read-only SQL SELECT
execute(sql*) — Run write SQL
list-tables() — List tables
describe-table(table*) — Describe table columns

## _index
describe-table
execute
list-tables
query

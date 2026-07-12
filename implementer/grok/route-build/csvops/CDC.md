# csvops - CDC

Source: MCP tools/list (4 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## misc
parse(text*) — Parse CSV text to rows
column(text*, index*:integer) — Extract column by index

## row
row_count(text*) — Count data rows (no header)

## sum
sum_column(text*, index*:integer) — Sum numeric column

## _index
column
parse
row_count
sum_column

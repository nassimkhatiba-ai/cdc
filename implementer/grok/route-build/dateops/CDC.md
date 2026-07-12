# dateops - CDC

Source: MCP tools/list (4 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## add
add_days(s*, days*:integer) — Add days to ISO

## diff
diff_days(a*, b*) — Day difference

## misc
weekday(s*) — Weekday name UTC

## parse
parse_iso(s*) — Parse ISO date

## _index
add_days
diff_days
parse_iso
weekday

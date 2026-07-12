# inventory - CDC

Source: MCP tools/list (5 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## get
get_item(sku*) — Get SKU

## list
list_items() — List SKUs

## low
low_stock(threshold:number) — Items below threshold

## total
total_value() — Sum qty*price

## warehouse
warehouse_count() — Distinct warehouses

## _index
get_item
list_items
low_stock
total_value
warehouse_count

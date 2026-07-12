---
name: inventory-cdc
description: Fast CDC for inventory (5 tools). ONE shell: node mcp-call.js --batch '[{tool,args}...]'. No MCP schemas. Use inventory-cdc skill.
---

# inventory

**No connected MCP.** Skill only. **ONE shell → compact JSON answer.**

## Call

```bash
node '__SKILL_DIR__/mcp-call.js' --batch '[{"tool":"list_items","args":{}}]'
```

Single: `node '__SKILL_DIR__/mcp-call.js' list_items '{}'`

Daemon warm. Do **not** list tools first. Do **not** cat SKILL.md if already loaded. Fill real args from Tools below — never invent names or placeholder values.

## Rules

1. **Max 1 shell run** for simple tasks: one `--batch` (or one single call) with **real** args. No openSession. No CDC.md. No tool listing.
2. Bridge prints compact one-line JSON. Then print **ONLY** final answer keys once — e.g. `console.log(JSON.stringify({key: value}))`. Never dump raw tool results to chat.
3. Wrong/empty: fix args from Tools below. Max **1** retry (2 shell runs total).
4. **Never cat/sed/rg mcp-call.js** — treat it as a black-box require. API is only: CLI single call, CLI `--batch`, or `require` + `callTool`/`callTools`.

## Tools

### get
get_item(sku*) — Get SKU
### list
list_items() — List SKUs
### low
low_stock(threshold:number) — Items below threshold
### total
total_value() — Sum qty*price
### warehouse
warehouse_count() — Distinct warehouses

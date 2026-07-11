---
name: calc-cdc
description: Fast CDC for calc. ONE shell --batch (no MCP schemas). Use calc-cdc skill.
---

# calc

**No connected MCP.** Skill only. **Speed: ONE shell call, then final answer.**

## Call (do this first)

```bash
node '/Users/nesbes/mcp-a;t/implementer/mega20/skills/calc-cdc/mcp-call.js' --batch '[{"tool":"add","args":{"a":1,"b":1}},{"tool":"mul","args":{"a":1,"b":1}},{"tool":"pow","args":{"a":1,"b":1}},{"tool":"stats","args":{"nums":[]}}]'
```

Single tool: `node '/Users/nesbes/mcp-a;t/implementer/mega20/skills/calc-cdc/mcp-call.js' add '{"a":1,"b":1}'`

Daemon is warm (install pre-start). Do **not** list tools first — names are below.

## Rules

1. **ONE** `--batch` (or one single call). No openSession. No CDC.md. No tool listing.
2. Print ONLY compact final JSON in the exact shape asked.
3. Wrong/empty: fix args from Tools below. Max **1** retry (2 shell runs total).

## Tools

### misc
add(a*:number, b*:number) — Add two numbers
mul(a*:number, b*:number) — Multiply two numbers
pow(a*:number, b*:number) — a**b
stats(nums*:[]) — mean/min/max of number array

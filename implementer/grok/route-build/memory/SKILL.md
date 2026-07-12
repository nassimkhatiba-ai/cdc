---
name: memory-cdc
description: Fast CDC for memory (9 tools). ONE shell: node mcp-call.js --batch '[{tool,args}...]'. No MCP schemas. Use memory-cdc skill.
---

# memory

**No connected MCP.** Skill only. **ONE shell → compact JSON answer.**

## Call

```bash
node '__SKILL_DIR__/mcp-call.js' --batch '[{"tool":"create_entities","args":{}}]'
```

Single: `node '__SKILL_DIR__/mcp-call.js' create_entities '{}'`

Daemon warm. Do **not** list tools first. Do **not** cat SKILL.md if already loaded. Fill real args from Tools below — never invent names or placeholder values.

## Rules

1. **Max 1 shell run** for simple tasks: one `--batch` (or one single call) with **real** args. No openSession. No CDC.md. No tool listing.
2. Bridge prints compact one-line JSON. Then print **ONLY** final answer keys once — e.g. `console.log(JSON.stringify({key: value}))`. Never dump raw tool results to chat.
3. Wrong/empty: fix args from Tools below. Max **1** retry (2 shell runs total).
4. **Never cat/sed/rg mcp-call.js** — treat it as a black-box require. API is only: CLI single call, CLI `--batch`, or `require` + `callTool`/`callTools`.

## Tools

### add
add_observations(observations*:[]) — Add new observations to existing entities in the knowledge graph
### create
create_entities(entities*:[]) — Create multiple new entities in the knowledge graph
create_relations(relations*:[]) — Create multiple new relations between entities in the knowledge graph
### delete
delete_entities(entityNames*:[]) — Delete multiple entities and their associated relations from the knowledge graph
delete_observations(deletions*:[]) — Delete specific observations from entities in the knowledge graph
delete_relations(relations*:[]) — Delete multiple relations from the knowledge graph
### open
open_nodes(names*:[]) — Open specific nodes in the knowledge graph by their names
### read
read_graph() — Read the entire knowledge graph
### search
search_nodes(query*) — Search for nodes in the knowledge graph based on a query

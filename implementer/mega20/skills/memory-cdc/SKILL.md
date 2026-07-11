---
name: memory-cdc
description: Call memory via short Node scripts (CDC). Compact tool index; no full MCP schemas in context. Use for memory.
---

# memory

Plain calls need NO script: `node /Users/nesbes/mcp-a;t/implementer/mega20/skills/memory-cdc/mcp-call.js <tool> '<json-args>'` · batch: `--batch '[{"tool":"t","args":{}},...]'`

Multi-step / aggregation — ONE inline script (bash heredoc, never a script file):

```bash
node - <<'EOF'
const { openSession, callPaged } = require('/Users/nesbes/mcp-a;t/implementer/mega20/skills/memory-cdc/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'list_tool', { /* filters */ }); // fetches ALL pages
  const one = await s.call('tool_name', { /* args */ });
  console.log(JSON.stringify(answer)); // aggregate in code first
  s.close();
})();
EOF
```

A background daemon keeps the server warm: repeat calls skip cold start and server STATE (browser pages, auth sessions) persists across scripts. `daemon-stop` ends it; env `CDC_MCP_DAEMON=0` disables.

Rules:
1. ONE session per script — never one per call.
2. List tools paginate — use callPaged, never just page 1. Aggregate in code; print ONLY the final compact JSON in the EXACT requested shape.
3. Tool prose is not an answer — extract the value. Named resource (id, owner/name)? Direct lookup, never global search.
4. Empty/zero/implausible result = bug: re-check args against the signatures. Max 2 runs.

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

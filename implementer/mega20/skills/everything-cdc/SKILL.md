---
name: everything-cdc
description: Call everything via short Node scripts (CDC). Compact tool index; no full MCP schemas in context. Use for everything.
---

# everything

Plain calls need NO script: `node /Users/nesbes/mcp-a;t/implementer/mega20/skills/everything-cdc/mcp-call.js <tool> '<json-args>'` · batch: `--batch '[{"tool":"t","args":{}},...]'`

Multi-step / aggregation — ONE inline script (bash heredoc, never a script file):

```bash
node - <<'EOF'
const { openSession, callPaged } = require('/Users/nesbes/mcp-a;t/implementer/mega20/skills/everything-cdc/mcp-call.js');
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

### misc
echo(message*) — Echoes back the input string
get-annotated-message(messageType*:"error"|"success"|"debug", includeImage:boolean) — Demonstrates how annotations can be used to provide metadata about content
get-env() — Returns all environment variables, helpful for debugging MCP server configuration
get-resource-links(count:number) — Returns up to ten resource links that reference different types of resources
get-resource-reference(resourceType:"Text"|"Blob", resourceId:number) — Returns a resource reference that can be used by MCP clients
get-structured-content(location*:"New York"|"Chicago"|"Los Angeles") — Returns structured content along with an output schema for client data validation
get-sum(a*:number, b*:number) — Returns the sum of two numbers
get-tiny-image() — Returns a tiny MCP logo image
gzip-file-as-resource(name, data, outputType:"resourceLink"|"resource") — Compresses a single file using gzip compression
toggle-simulated-logging() — Toggles simulated, random-leveled logging on or off
toggle-subscriber-updates() — Toggles simulated resource subscription updates on or off
trigger-long-running-operation(duration:number, steps:number) — Demonstrates a long running operation with progress updates
simulate-research-query(topic*, ambiguous:boolean) — Simulates a deep research operation that gathers, analyzes, and synthesizes information

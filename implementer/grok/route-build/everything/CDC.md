# everything - CDC

Source: MCP tools/list (13 tools)
Prefer: ONE openSession script that does ALL work then prints ONLY answer keys. --batch only for tiny independent probes.

## Multi-step (primary for multi-hop)

```bash
node - <<'EOF'
const { openSession } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const one = await s.call('echo', { /* real args */ });
  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed
  // Answer helper: print JSON once; never dump tool results to chat.
  console.log(JSON.stringify(/* compact answer only */));
  s.close();
})();
EOF
```

## misc
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

## _index
echo
get-annotated-message
get-env
get-resource-links
get-resource-reference
get-structured-content
get-sum
get-tiny-image
gzip-file-as-resource
simulate-research-query
toggle-simulated-logging
toggle-subscriber-updates
trigger-long-running-operation

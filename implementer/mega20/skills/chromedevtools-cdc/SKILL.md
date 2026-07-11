---
name: chromedevtools-cdc
description: Call chromedevtools via short Node scripts (CDC). Compact tool index; no full MCP schemas in context. Use for chromedevtools.
---

# chromedevtools

Plain calls need NO script: `node /Users/nesbes/mcp-a;t/implementer/mega20/skills/chromedevtools-cdc/mcp-call.js <tool> '<json-args>'` · batch: `--batch '[{"tool":"t","args":{}},...]'`

Multi-step / aggregation — ONE inline script (bash heredoc, never a script file):

```bash
node - <<'EOF'
const { openSession, callPaged } = require('/Users/nesbes/mcp-a;t/implementer/mega20/skills/chromedevtools-cdc/mcp-call.js');
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

Tool signatures: grep CDC.md — do not read the whole file:
`grep -A 20 "^## close" /Users/nesbes/mcp-a;t/implementer/mega20/skills/chromedevtools-cdc/CDC.md`

Groups:
- close (1)
- evaluate (1)
- fill (1)
- get (2)
- handle (1)
- lighthouse (1)
- list (3)
- misc (5)
- navigate (1)
- new (1)
- performance (3)
- press (1)
- resize (1)
- select (1)
- take (3)
- type (1)
- upload (1)
- wait (1)

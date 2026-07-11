---
name: puppeteer-cdc
description: Call puppeteer via short Node scripts (CDC). Compact tool index; no full MCP schemas in context. Use for puppeteer.
---

# puppeteer

Plain calls need NO script: `node /Users/nesbes/mcp-a;t/implementer/mega20/skills/puppeteer-cdc/mcp-call.js <tool> '<json-args>'` · batch: `--batch '[{"tool":"t","args":{}},...]'`

Multi-step / aggregation — ONE inline script (bash heredoc, never a script file):

```bash
node - <<'EOF'
const { openSession, callPaged } = require('/Users/nesbes/mcp-a;t/implementer/mega20/skills/puppeteer-cdc/mcp-call.js');
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

### puppeteer
puppeteer_navigate(url*, launchOptions:{}, allowDangerous:boolean) — Navigate to a URL
puppeteer_screenshot(name*, selector, width:number, height:number, encoded:boolean) — Take a screenshot of the current page or a specific element
puppeteer_click(selector*) — Click an element on the page
puppeteer_fill(selector*, value*) — Fill out an input field
puppeteer_select(selector*, value*) — Select an element on the page with Select tag
puppeteer_hover(selector*) — Hover an element on the page
puppeteer_evaluate(script*) — Execute JavaScript in the browser console

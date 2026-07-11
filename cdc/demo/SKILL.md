---
name: demo-cdc
description: Call Demo MCP via short Node scripts (CDC). Compact tool index; no full MCP schemas in context. Use for demo.
---

# Demo MCP

ONE Node script per question. Compose tools in code; print only the answer.

```js
const { callTool } = require('./mcp-call.js');
// const data = await callTool('tool_name', { /* args */ });
// filter/aggregate here
// console.log(JSON.stringify(answer));
```

Rules:
1. Call only tools you need. Aggregate in the script - never paste raw payloads into chat.
2. One short script, one run. No exploratory thrash.
3. Grep CDC.md for signatures (do not read the whole file).

`grep -A 15 "^## get" CDC.md`

Groups:
- get (3)
- github (3)
- list (3)
- search (1)
- slack (2)

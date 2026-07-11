---
name: filesystem-cdc
description: File ops under /path/to/allowed/root via short Node fs scripts (CDC). Prefer fs; do not use MCP/npx. Use when the user asks about files in that root or filesystem-cdc.
---

# filesystem-cdc

Root: `/path/to/allowed/root`

Use **Node fs/path** in ONE short script. Do **not** call the filesystem MCP or mcp-call.js.

```js
const fs = require('fs');
const path = require('path');
const ROOT = "/path/to/allowed/root";
// read / list / search / aggregate under ROOT only
// console.log(JSON.stringify(answer));
```

Rules:
1. Paths must stay under ROOT.
2. Aggregate/filter in the script - print only the final answer.
3. One short script, one run. No multi-step thrash, no dumping file bodies into chat.
4. Prefer built-ins: readFileSync, readdirSync, statSync, writeFileSync.

Tool name map (optional): see CDC.md

---
name: filesystem-cdc
description: File ops under /Users/nesbes/cdc-mcp-sandbox via short Node fs scripts (CDC). Prefer fs; do not use MCP/npx. Use when the user asks about files in that root or filesystem-cdc.
---

# filesystem-cdc

Root: `/Users/nesbes/cdc-mcp-sandbox`

Use **Node fs/path** in a short script. Do **not** spawn the filesystem MCP or npx.

```js
const fs = require('fs');
const path = require('path');
const ROOT = "/Users/nesbes/cdc-mcp-sandbox";
// recon: fs.readdirSync(dir, { withFileTypes: true }) + statSync for sizes
// compute: read/filter/aggregate under ROOT; do ALL math in code
// console.log(JSON.stringify(answer));
```

Rules:
1. Paths must stay under ROOT.
2. Prefer built-ins: readFileSync, readdirSync, statSync, writeFileSync.
3. Unknown data layout? Run ONE tiny recon first (names/counts/sizes only, print ≤15 lines), THEN one compute script. Max 2 runs total.
4. If several sources can contain the SAME records (full dump + page shards, raw + rollup, daily + monthly), pick ONE canonical source. NEVER aggregate overlapping sources.
5. Sanity-check before printing: counts consistent with recon, no double counting, magnitudes plausible.
6. Print ONLY the final answer as compact JSON. Never echo raw payloads into chat.

Tool name map (optional): see CDC.md

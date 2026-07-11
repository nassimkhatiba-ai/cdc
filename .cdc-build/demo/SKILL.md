---
name: demo-cdc
description: Call Demo MCP via short Node scripts (CDC). Compact tool index; no full MCP schemas in context. Use for demo.
---

# Demo MCP

Compose tools IN CODE via the bundled bridge. One session, one script, print only the answer.

```js
const { openSession } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();          // ONE server process for ALL calls
  const data = await s.call('tool_name', { /* args */ });
  // join/filter/aggregate here — do ALL math in code
  console.log(JSON.stringify(answer));
  s.close();
})();
```

Quick one-off (no script file):
`node __SKILL_DIR__/mcp-call.js <tool> '<json-args>'`  ·  batch: `--batch '[{"tool":"t","args":{}},...]'`

Rules:
1. ONE session per script (`openSession`). Never open a session per call.
2. Unknown data layout? Run ONE tiny recon first (names/counts/sizes only, print ≤15 lines), THEN one compute script. Max 2 runs total.
3. If several sources can contain the SAME records (full dump + page shards, raw + rollup, daily + monthly), pick ONE canonical source. NEVER aggregate overlapping sources.
4. Sanity-check before printing: counts consistent with recon, no double counting, magnitudes plausible.
5. Print ONLY the final answer as compact JSON. Never echo raw payloads into chat.

Tool signatures: grep CDC.md — do not read the whole file:
`grep -A 20 "^## get" __SKILL_DIR__/CDC.md`

Groups:
- get (3)
- github (3)
- list (3)
- search (1)
- slack (2)

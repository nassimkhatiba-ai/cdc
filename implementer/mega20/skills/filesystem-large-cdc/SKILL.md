---
name: filesystem-large-cdc
description: File ops under $CDC_FS_ROOT via short Node fs scripts (CDC). Prefer fs; do not use MCP/npx. Use when the user asks about files in that root or filesystem-large-cdc.
---

# filesystem-large-cdc

Root: `$CDC_FS_ROOT` (set env CDC_FS_ROOT if empty)

Data work via **q.js** (bundled) in ONE inline script — no MCP, no npx, no script files:

```bash
node - <<'EOF'
const q = require('/Users/nesbes/mcp-a;t/implementer/mega20/skills/filesystem-large-cdc/q.js');
const rows = q.load('data.json');                 // json|ndjson|csv, relative to ROOT
const ref = q.index(q.load('lookup.json'), 'id'); // key-coercing join: ref.get(r.ref_id)
console.log(JSON.stringify({ metric: q.round2(q.sumBy(rows, 'total')) }));
EOF
```

Also: q.files(dir), q.groupBy, q.assertNonEmpty. Rules:
1. Trust the layout snapshot — ONE compute script, no recon run.
2. NEVER aggregate overlapping sources (full file + its numbered shards); the snapshot marks duplicates.
3. Empty/zero metric = bug: q.assertNonEmpty it, re-check snapshot field names/enum values.
4. Stay under Root. Print ONLY final compact JSON. Max 2 runs.

No layout snapshot (root unavailable at build time). First run:
`node /Users/nesbes/mcp-a;t/implementer/mega20/skills/filesystem-large-cdc/q.js recon` (bounded output), then ONE compute script.

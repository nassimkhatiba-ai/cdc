# Skill maker v3 — turn-count optimization (post re-bench)

The v2 re-bench (results-codex-bench-v2.md) showed CDC winning tokens 3.1×
but LOSING wall clock (91s vs MCP 52s) and one metric
(category_A_delivered_revenue = 0). Analysis: script runtime on 1.5MB is
<0.1s — the 91s is model turns (recon turn + ~40-line script generation +
file-write turns + a fix turn). The join-0 was a silent key/field guess.

v3 attacks turns and guessing, not script speed:

## 1. Build-time layout snapshot (direct-fs)

The maker already touches the data source at create time, so it now embeds a
bounded snapshot in SKILL.md (full version in CDC.md):

```
orders/orders.json — 8000 records: id:num, user:str, product_id:num, qty:num,
  total:num, status:(cancelled|delivered|pending|refunded|shipped), …
orders/page_000.json … page_039.json (40 files) — 8000 records total: …
  ⚠ DUPLICATE of orders/orders.json — same records split into pages. Use ONE source, NEVER both.
products/catalog.json — 500 records: id:num, name:str, price:num, category:(A|B|C|D|E)
```

- record counts, field names WITH types, low-cardinality value enums
- automatic duplicate/shard detection (the 2× bug is now printed in the skill)
- `category:(A|B|C|D|E)` is exactly the knowledge whose absence caused the
  join-0 failure
- kills the recon turn entirely; `node q.js recon` rebuilds it live if stale

## 2. q.js query kit shipped with every direct-fs skill

`load` (json/ndjson/csv), `files`, `index` (join keys coerced to String on
both sides — silent number-vs-string join misses are impossible), `sumBy`,
`groupBy`, `round2`, `assertNonEmpty` (empty/zero metric throws with a hint
instead of printing 0). Agent scripts drop from ~40 generated lines to ~10 —
generation time is the dominant CDC latency.

## 3. Heredoc execution

Templates instruct `node - <<'EOF' … EOF`: one bash call, no file-write turn
per script.

## 4. Maker UX: from-config

`create-cdc-skill.js from-config --name filesystem` finds the server's
command/args in ~/.claude.json, .mcp.json, or ~/.codex/config.toml and probes
it — zero exploration turns for "convert my X MCP". Converter output is now
ONE compact JSON line and the creator skill forbids re-reading generated
files (the MAKE arm's 174k input tokens were mostly self-verification).

## Local verification (large sandbox, 8k orders)

The full 9-metric bench task as ONE q.js heredoc script, informed only by the
snapshot: **9/9 exact vs TRUTH.json** — including
category_A_delivered_revenue = 173216.56 (the v2 miss) — script runtime 0.06s.
Duplicate shards correctly ignored via the snapshot warning.

Costs: filesystem-large SKILL.md is now 910 tokens (was 476) — the +434
snapshot replaces a recon turn that cost thousands of input tokens and
15–25s of wall clock. Generic no-snapshot template stays under the 450 budget.

## Expected next A/B

- USE turns: ~4 → 2 (one compute script + final answer)
- USE wall clock: should land at or below MCP (the recon + fix + file-write
  turns are gone; script generation is ~4× shorter)
- Correctness: 9/9 (layout knowledge is in-context from the skill itself)
- MAKE arm: fewer tokens (one-line output, no self-verification reads,
  from-config instead of exploration)

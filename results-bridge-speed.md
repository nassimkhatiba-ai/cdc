# Bridge speed — spawn-per-call (v1) vs persistent session (v2)

The v1 generated `mcp-call.js` spawned a fresh MCP server process (incl. `npx`
resolution) for **every** tool call. v2 opens ONE session per script.

Measured with the actually-installed generated artifact
(`~/.claude/skills/demo-cdc/mcp-call.js`) against a real
`@modelcontextprotocol/server-filesystem` via `CDC_MCP_COMMAND` override,
6 sequential tool calls, **warm** npx cache:

| pattern | total | per call | |
|---|---:|---:|---|
| v1 — spawn per call | 3,800 ms | 633 ms | server boot dominates |
| v2 — one session (`openSession`) | 591 ms | 99 ms | boot paid once |
| **speedup** | **6.4×** | | grows with call count; far larger with cold npx |

## Why the A/B regressed (root causes fixed in v2)

1. **Latency**: per-call spawn — the large A/B's multi-call scripts paid seconds
   of server boots per script, three scripts in a row.
2. **Correctness**: templates said "one run, no thrash" with no recon rule, so
   the agent aggregated `orders.json` AND its 40 `page_*.json` shards → exact
   2× on every order metric. v2 templates enforce recon-then-compute (max 2
   runs), a canonical-source rule, and a sanity-check step.
3. **Thrash**: CDC.md lines had zero descriptions (`list_directory(path*)`), so
   the agent guessed return shapes and rewrote scripts. v2 keeps a truncated
   one-line description per tool (~10 tokens each, e.g.
   `read_text_file(path*, tail:number, head:number) — Read the complete contents of a file…`).
4. **Portability**: `require('./mcp-call.js')` broke from other cwds; installs
   now substitute `__SKILL_DIR__` with the absolute skill path per target.

Skill preambles stay small: filesystem-cdc 458 tokens, demo-cdc 549 tokens.

Re-run the Codex A/B to confirm end-to-end; expected: CDC wall clock drops by
the spawn overhead (multi-call scripts), the shard double-count disappears, and
first-try scripts reduce input tokens further.

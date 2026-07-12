---
name: context7-cdc
description: Fast CDC for context7 (2 tools). ONE shell: node mcp-call.js --batch '[{tool,args}...]'. No MCP schemas. Use context7-cdc skill.
---

# context7

**No connected MCP.** Skill only. **ONE shell → compact JSON answer.**

## Call

```bash
node '__SKILL_DIR__/mcp-call.js' --batch '[{"tool":"resolve-library-id","args":{}}]'
```

Single: `node '__SKILL_DIR__/mcp-call.js' resolve-library-id '{}'`

Daemon warm. Do **not** list tools first. Do **not** cat SKILL.md if already loaded. Fill real args from Tools below — never invent names or placeholder values.

## Rules

1. **Max 1 shell run** for simple tasks: one `--batch` (or one single call) with **real** args. No openSession. No CDC.md. No tool listing.
2. Bridge prints compact one-line JSON. Then print **ONLY** final answer keys once — e.g. `console.log(JSON.stringify({key: value}))`. Never dump raw tool results to chat.
3. Wrong/empty: fix args from Tools below. Max **1** retry (2 shell runs total).
4. **Never cat/sed/rg mcp-call.js** — treat it as a black-box require. API is only: CLI single call, CLI `--batch`, or `require` + `callTool`/`callTools`.

## Tools

### misc
resolve-library-id(query*, libraryName*) — Resolves a package/product name to a Context7-compatible library ID and returns matchin…
query-docs(libraryId*, query*) — Retrieves and queries up-to-date documentation and code examples from Context7 for any …

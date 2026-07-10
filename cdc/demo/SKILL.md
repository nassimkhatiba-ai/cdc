---
name: demo-cdc
description: Call demo MCP by writing sandboxed Node scripts (CDC pattern — compact tool index, no full MCP schemas in context). Use when the user asks to query, analyze, or automate anything involving demo MCP. Read only the CDC.md sections you need.
---

# demo MCP via CDC

Converted from MCP · 12 tools · progressive disclosure

## How to call these tools (CDC pattern)

This package was converted from an MCP server. Instead of loading every tool
schema into context and piping results through the model, write ONE Node.js
script that calls only the tools you need, filters/aggregates in-process, and
prints the final answer.

### Calling a tool from a script

A helper `mcp-call.js` ships next to this skill. From a script:

```js
const { callTool } = require('./mcp-call.js');

const result = await callTool('tool_name', { arg: 'value' });
// result is already-parsed JSON (or text). Aggregate here, then:
console.log(JSON.stringify(answer));
```

Rules:
1. Credentials live in the MCP server process / env — never hardcode secrets.
2. Call only the tools you need. Prefer bulk/list tools over N× get-one loops
   when available; still do aggregation IN THE SCRIPT.
3. Print ONLY the final answer to stdout. Never echo raw tool payloads into
   the conversation.
4. On errors, print the error message and stop.
5. One script per question — compose multi-tool workflows inside it.

## Finding tools (progressive disclosure — do NOT read all of CDC.md)

CDC.md holds one line per tool, grouped under `## <tag>` headings.
Grep for the tag or tool name you need:

```
grep -A 40 "^## get" CDC.md | head -40
grep "list_" CDC.md
```

Tool groups:
- get (3 tools)
- github (3 tools)
- list (3 tools)
- search (1 tools)
- slack (2 tools)

## Why CDC instead of raw MCP?

MCP loads every tool schema into context and routes every payload through
the model. CDC keeps a small preamble in context and lets you grep the rest.
Aggregation happens in code, so token cost stays flat as data grows — and
arithmetic stays exact. Run `cdc --stats` to estimate the savings.

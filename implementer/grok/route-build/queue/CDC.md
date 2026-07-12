# queue - CDC

Source: MCP tools/list (5 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## misc
enqueue(job*) — Push job
dequeue() — Pop job
peek() — Peek front
size() — Queue size
list() — List jobs

## _index
dequeue
enqueue
list
peek
size

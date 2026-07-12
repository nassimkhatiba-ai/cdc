# graph - CDC

Source: MCP tools/list (5 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## has
has_path(from*, to*) — BFS path exists

## list
list_nodes() — List graph nodes
list_edges() — List edges

## misc
neighbors(node*) — Neighbors of node
degree(node*) — Degree of node

## _index
degree
has_path
list_edges
list_nodes
neighbors

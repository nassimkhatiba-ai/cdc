# memory - CDC

Source: MCP tools/list (9 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## add
add_observations(observations*:[]) — Add new observations to existing entities in the knowledge graph

## create
create_entities(entities*:[]) — Create multiple new entities in the knowledge graph
create_relations(relations*:[]) — Create multiple new relations between entities in the knowledge graph

## delete
delete_entities(entityNames*:[]) — Delete multiple entities and their associated relations from the knowledge graph
delete_observations(deletions*:[]) — Delete specific observations from entities in the knowledge graph
delete_relations(relations*:[]) — Delete multiple relations from the knowledge graph

## open
open_nodes(names*:[]) — Open specific nodes in the knowledge graph by their names

## read
read_graph() — Read the entire knowledge graph

## search
search_nodes(query*) — Search for nodes in the knowledge graph based on a query

## _index
add_observations
create_entities
create_relations
delete_entities
delete_observations
delete_relations
open_nodes
read_graph
search_nodes

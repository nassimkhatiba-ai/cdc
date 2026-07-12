# weather - CDC

Source: MCP tools/list (3 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## get
get_weather(city*) — Weather for city

## list
list_cities() — List known cities

## misc
compare(a*, b*) — Compare two cities temp

## _index
compare
get_weather
list_cities

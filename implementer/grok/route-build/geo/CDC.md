# geo - CDC

Source: MCP tools/list (4 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## distance
distance_km(a*, b*) — Haversine km

## get
get_city(name*) — City coords

## list
list_cities() — List cities

## misc
nearest(lat*:number, lon*:number) — Nearest city to lat/lon

## _index
distance_km
get_city
list_cities
nearest

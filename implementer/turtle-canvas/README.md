# turtle-canvas MCP

Turtle-style drawing MCP for MCP vs CDC A/B tests.

**Agents draw with pen commands** (`forward`, `left`, `circle`, `turtle_batch`, …).  
They do **not** edit HTML/CSS/DOM.

## What it is

| Piece | Role |
|-------|------|
| `bin/turtle-canvas-mcp.js` | stdio MCP server (zero deps) |
| `canvases/*.json` | stroke log + turtle state |
| `canvases/*.svg` | visual export (open in browser/Preview) |
| `viewer.html` | optional read-only SVG browser (human view only) |

## Tools (26)

Canvas: `canvas_new`, `canvas_list`, `canvas_get`, `canvas_clear`, `canvas_delete`,  
`canvas_export_svg`, `canvas_export_json`, `canvas_snapshot`

Turtle: `turtle_state`, `turtle_home`, `turtle_forward`, `turtle_backward`,  
`turtle_left`, `turtle_right`, `turtle_setheading`, `turtle_goto`,  
`turtle_penup`, `turtle_pendown`, `turtle_pencolor`, `turtle_pensize`,  
`turtle_fillcolor`, `turtle_circle`, `turtle_dot`

Shapes: `draw_text`, `draw_line`, `draw_poly`

**Batch (preferred multi-hop):** `turtle_batch` — run many ops in one call.

### Coordinate system

- Origin: top-left  
- `y` increases downward  
- Heading `0` = up, `90` = right, `180` = down, `270` = left  
- `left` = counterclockwise, `right` = clockwise  

## Run / probe

```bash
# smoke: list tools
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | node bin/turtle-canvas-mcp.js

# draw a square via batch
node scripts/demo-square.js
```

## Connect as MCP (Codex example)

```toml
[mcp_servers.turtle]
command = "node"
args = ["/ABS/PATH/implementer/turtle-canvas/bin/turtle-canvas-mcp.js"]
```

Optional:

```bash
export TURTLE_CANVAS_DIR=/path/to/writable/canvases
```

## CDC path (you convert — not prebuilt)

This package ships **MCP only**. Do **not** expect a checked-in `turtle-cdc` skill.

When you want the A/B:

```bash
# from repo root — product convert (you or Codex via cdc-skill-creator)
node bin/cdc.js from-mcp --probe node \
  --arg implementer/turtle-canvas/bin/turtle-canvas-mcp.js \
  --name turtle

# then YOU install if desired
# node bin/cdc.js install turtle --target both
# and DISABLE the MCP server of the same name for the CDC arm
```

Harness/agents must not hand-author a skill for the fair product-path A/B.

## Suggested A/B task (later)

Identical prompt for both arms, e.g.:

> On canvas `house`, draw a simple house: square base, triangular roof, door, sun (circle), label "home". Prefer `turtle_batch`. Return JSON `{svgPath, strokeCount, snapshot}`.

Score: correct structure + tokens + wall. Open `canvases/house.svg` to verify visually.

## Demo

```bash
node scripts/demo-square.js
open canvases/demo_square.svg   # or xdg-open
```

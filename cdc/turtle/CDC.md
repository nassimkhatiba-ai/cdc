# turtle - CDC

Source: MCP tools/list (27 tools)
Prefer: ONE openSession script that does ALL work then prints ONLY answer keys. --batch only for tiny independent probes.

## Multi-step (primary for multi-hop)

```bash
node - <<'EOF'
const { openSession } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const one = await s.call('canvas_new', { /* real args */ });
  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed
  // Answer helper: print JSON once; never dump tool results to chat.
  console.log(JSON.stringify(/* compact answer only */));
  s.close();
})();
EOF
```

## canvas
canvas_new(name, width:integer, height:integer, bg, overwrite:boolean) — Create a named drawing canvas (turtle world)
canvas_list() — List saved canvases on disk with stroke counts and SVG paths
canvas_get(name) — Get turtle pose, size, stroke count, and file paths for a canvas
canvas_clear(name) — Erase all strokes; keep size/bg; turtle returns home (center, heading 0)
canvas_delete(name*) — Delete canvas JSON + SVG from disk
canvas_export_svg(name, inline:boolean) — Write/refresh SVG and return path + byte size + optional inline SVG (truncated)
canvas_export_json(name, full:boolean) — Return stroke log summary (counts by type) and JSON path
canvas_snapshot(name) — Compact visual summary for agents: bounds of ink, stroke counts, turtle pose, SVG path

## draw
draw_text(name, text*, x:number, y:number, size:number, color) — Draw a text label at turtle position (or explicit x,y)
draw_line(name, x1*:number, y1*:number, x2*:number, y2*:number, color, width:number) — Absolute line from (x1,y1) to (x2,y2) without moving turtle pose permanently
draw_poly(name, points*:[], color, width:number, fill) — Absolute polygon from points [[x,y],…]

## turtle
turtle_state(name) — Current turtle pose only (x,y,heading,pen,color,width)
turtle_home(name) — Move turtle to center, heading 0 (up)
turtle_forward(name, distance*:number) — Move turtle forward by distance (px)
turtle_backward(name, distance*:number) — Move turtle backward by distance (px)
turtle_left(name, angle*:number) — Turn left (counterclockwise) by angle degrees
turtle_right(name, angle*:number) — Turn right (clockwise) by angle degrees
turtle_setheading(name, heading*:number) — Set absolute heading
turtle_goto(name, x*:number, y*:number) — Go to absolute (x,y)
turtle_penup(name) — Lift pen — moves do not draw
turtle_pendown(name) — Put pen down — moves draw strokes
turtle_pencolor(name, color*) — Set stroke color (CSS color string, e.g
turtle_pensize(name, size*:number) — Set stroke width in px
turtle_fillcolor(name, color) — Set fill color for subsequent circle/poly (null/empty = no fill)
turtle_circle(name, radius*:number, extent:number) — Draw a circle/arc with given radius
turtle_dot(name, radius:number, color) — Stamp a filled dot at the turtle position
turtle_batch(name, commands*:[]) — Run many turtle ops in ONE call (efficient multi-hop)

## _index
canvas_clear
canvas_delete
canvas_export_json
canvas_export_svg
canvas_get
canvas_list
canvas_new
canvas_snapshot
draw_line
draw_poly
draw_text
turtle_backward
turtle_batch
turtle_circle
turtle_dot
turtle_fillcolor
turtle_forward
turtle_goto
turtle_home
turtle_left
turtle_pencolor
turtle_pendown
turtle_pensize
turtle_penup
turtle_right
turtle_setheading
turtle_state

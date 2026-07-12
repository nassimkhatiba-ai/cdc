#!/usr/bin/env node
/**
 * turtle-canvas-mcp — stdio MCP for turtle-style drawing (NOT HTML editing).
 *
 * Agents draw by moving a pen (forward/left/right/circle/…) on a named canvas.
 * State + strokes persist as JSON; visuals export as SVG under canvases/.
 *
 * Env:
 *   TURTLE_CANVAS_DIR  root for canvas files (default: ../canvases next to this file)
 *
 * Zero deps. Node 18+.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = process.env.TURTLE_CANVAS_DIR
  ? path.resolve(process.env.TURTLE_CANVAS_DIR)
  : path.join(__dirname, '..', 'canvases');

fs.mkdirSync(ROOT, { recursive: true });

// --- geometry helpers ---
// Heading: 0° = up (north), positive = counterclockwise (Logo). Screen y grows down.
function deg2rad(d) {
  return (d * Math.PI) / 180;
}
function stepFrom(x, y, heading, dist) {
  const r = deg2rad(heading);
  return {
    x: x + dist * Math.sin(r),
    y: y - dist * Math.cos(r),
  };
}
function normHeading(h) {
  let n = h % 360;
  if (n < 0) n += 360;
  return n;
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function round(n, p = 3) {
  const f = 10 ** p;
  return Math.round(n * f) / f;
}

// --- persistence ─---------------------------------------------─
function canvasPath(name) {
  const safe = String(name || 'main').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
  return {
    name: safe,
    json: path.join(ROOT, `${safe}.json`),
    svg: path.join(ROOT, `${safe}.svg`),
  };
}

function defaultCanvas(name, width = 800, height = 600, bg = '#ffffff') {
  const w = clamp(Number(width) || 800, 64, 4096);
  const h = clamp(Number(height) || 600, 64, 4096);
  return {
    name,
    width: w,
    height: h,
    bg: String(bg || '#ffffff'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    turtle: {
      x: w / 2,
      y: h / 2,
      heading: 0,
      penDown: true,
      color: '#111111',
      width: 2,
      fill: null,
    },
    strokes: [],
  };
}

function loadCanvas(name) {
  const { name: safe, json } = canvasPath(name);
  if (!fs.existsSync(json)) throw new Error(`canvas not found: ${safe}`);
  return JSON.parse(fs.readFileSync(json, 'utf8'));
}

function saveCanvas(c) {
  const { json, svg } = canvasPath(c.name);
  c.updatedAt = new Date().toISOString();
  fs.writeFileSync(json, JSON.stringify(c, null, 2));
  fs.writeFileSync(svg, renderSvg(c));
  return c;
}

function ensureCanvas(name) {
  const { name: safe, json } = canvasPath(name);
  if (fs.existsSync(json)) return loadCanvas(safe);
  return saveCanvas(defaultCanvas(safe));
}

// --- SVG render ------------------------------------------------
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSvg(c) {
  const parts = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${c.width}" height="${c.height}" viewBox="0 0 ${c.width} ${c.height}">`,
    `  <rect width="100%" height="100%" fill="${esc(c.bg)}"/>`,
  ];
  for (const s of c.strokes) {
    if (s.type === 'line') {
      parts.push(
        `  <line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${esc(s.color)}" stroke-width="${s.width}" stroke-linecap="round"/>`,
      );
    } else if (s.type === 'circle') {
      const fill = s.fill || 'none';
      parts.push(
        `  <circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" stroke="${esc(s.color)}" stroke-width="${s.width}" fill="${esc(fill)}"/>`,
      );
    } else if (s.type === 'poly') {
      const pts = (s.points || []).map((p) => `${p[0]},${p[1]}`).join(' ');
      const fill = s.fill || 'none';
      parts.push(
        `  <polygon points="${pts}" stroke="${esc(s.color)}" stroke-width="${s.width}" fill="${esc(fill)}" stroke-linejoin="round"/>`,
      );
    } else if (s.type === 'path') {
      parts.push(
        `  <path d="${esc(s.d)}" stroke="${esc(s.color)}" stroke-width="${s.width}" fill="${esc(s.fill || 'none')}" stroke-linecap="round" stroke-linejoin="round"/>`,
      );
    } else if (s.type === 'text') {
      parts.push(
        `  <text x="${s.x}" y="${s.y}" fill="${esc(s.color)}" font-size="${s.size || 16}" font-family="system-ui,sans-serif">${esc(s.text)}</text>`,
      );
    } else if (s.type === 'dot') {
      parts.push(
        `  <circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${esc(s.color)}" stroke="none"/>`,
      );
    }
  }
  // turtle marker (not a permanent stroke — live pose)
  const t = c.turtle;
  const tip = stepFrom(t.x, t.y, t.heading, 10);
  const left = stepFrom(t.x, t.y, t.heading + 140, 8);
  const right = stepFrom(t.x, t.y, t.heading - 140, 8);
  parts.push(
    `  <!-- turtle pose -->`,
    `  <polygon points="${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}" fill="#e11d48" opacity="0.85"/>`,
  );
  parts.push(`</svg>`);
  return parts.join('\n') + '\n';
}

// --- turtle ops ---
function pushLine(c, x1, y1, x2, y2) {
  if (!c.turtle.penDown) return;
  c.strokes.push({
    type: 'line',
    x1: round(x1),
    y1: round(y1),
    x2: round(x2),
    y2: round(y2),
    color: c.turtle.color,
    width: c.turtle.width,
  });
}

function turtleState(c) {
  const t = c.turtle;
  return {
    canvas: c.name,
    x: round(t.x),
    y: round(t.y),
    heading: round(t.heading, 2),
    penDown: t.penDown,
    color: t.color,
    width: t.width,
    fill: t.fill,
    strokeCount: c.strokes.length,
    size: { width: c.width, height: c.height },
    svgPath: canvasPath(c.name).svg,
  };
}

function applyOp(c, op) {
  const name = op.op || op.tool || op.name;
  const a = op.args || op;
  switch (name) {
    case 'forward':
    case 'fd': {
      const d = Number(a.distance ?? a.d ?? a.steps ?? 0);
      const from = { x: c.turtle.x, y: c.turtle.y };
      const to = stepFrom(from.x, from.y, c.turtle.heading, d);
      pushLine(c, from.x, from.y, to.x, to.y);
      c.turtle.x = to.x;
      c.turtle.y = to.y;
      return { moved: d };
    }
    case 'backward':
    case 'bk': {
      const d = Number(a.distance ?? a.d ?? a.steps ?? 0);
      return applyOp(c, { op: 'forward', args: { distance: -d } });
    }
    case 'left':
    case 'lt': {
      const ang = Number(a.angle ?? a.degrees ?? 0);
      c.turtle.heading = normHeading(c.turtle.heading + ang);
      return { heading: c.turtle.heading };
    }
    case 'right':
    case 'rt': {
      const ang = Number(a.angle ?? a.degrees ?? 0);
      c.turtle.heading = normHeading(c.turtle.heading - ang);
      return { heading: c.turtle.heading };
    }
    case 'setheading':
    case 'seth': {
      c.turtle.heading = normHeading(Number(a.heading ?? a.angle ?? 0));
      return { heading: c.turtle.heading };
    }
    case 'goto':
    case 'setpos': {
      const x = Number(a.x);
      const y = Number(a.y);
      if (Number.isNaN(x) || Number.isNaN(y)) throw new Error('goto requires x,y');
      pushLine(c, c.turtle.x, c.turtle.y, x, y);
      c.turtle.x = x;
      c.turtle.y = y;
      return { x, y };
    }
    case 'home': {
      const hx = c.width / 2;
      const hy = c.height / 2;
      pushLine(c, c.turtle.x, c.turtle.y, hx, hy);
      c.turtle.x = hx;
      c.turtle.y = hy;
      c.turtle.heading = 0;
      return { x: hx, y: hy, heading: 0 };
    }
    case 'penup':
    case 'pu':
      c.turtle.penDown = false;
      return { penDown: false };
    case 'pendown':
    case 'pd':
      c.turtle.penDown = true;
      return { penDown: true };
    case 'pencolor':
    case 'color':
      c.turtle.color = String(a.color || a.value || '#111111');
      return { color: c.turtle.color };
    case 'pensize':
    case 'width':
      c.turtle.width = clamp(Number(a.size ?? a.width ?? 2), 0.5, 64);
      return { width: c.turtle.width };
    case 'fillcolor':
      c.turtle.fill = a.color == null || a.color === '' ? null : String(a.color);
      return { fill: c.turtle.fill };
    case 'circle': {
      // Logo circle: walk a circle with radius; approximate as SVG circle at current pos offset
      const radius = Number(a.radius ?? a.r ?? 0);
      if (!(radius > 0)) throw new Error('circle requires radius > 0');
      const extent = Number(a.extent ?? 360);
      const steps = clamp(Math.ceil(Math.abs(extent) / 6), 8, 120);
      // center is radius to the left of heading
      const center = stepFrom(c.turtle.x, c.turtle.y, c.turtle.heading + 90, radius);
      if (Math.abs(Math.abs(extent) - 360) < 0.01 && c.turtle.penDown) {
        c.strokes.push({
          type: 'circle',
          cx: round(center.x),
          cy: round(center.y),
          r: round(Math.abs(radius)),
          color: c.turtle.color,
          width: c.turtle.width,
          fill: c.turtle.fill || null,
        });
      } else if (c.turtle.penDown) {
        // arc as polyline of short steps
        let x = c.turtle.x;
        let y = c.turtle.y;
        let h = c.turtle.heading;
        const stepAng = extent / steps;
        const stepLen = (2 * Math.PI * Math.abs(radius) * Math.abs(extent)) / 360 / steps;
        const pts = [[round(x), round(y)]];
        for (let i = 0; i < steps; i++) {
          const to = stepFrom(x, y, h, stepLen);
          pts.push([round(to.x), round(to.y)]);
          x = to.x;
          y = to.y;
          h = normHeading(h + stepAng);
        }
        for (let i = 1; i < pts.length; i++) {
          c.strokes.push({
            type: 'line',
            x1: pts[i - 1][0],
            y1: pts[i - 1][1],
            x2: pts[i][0],
            y2: pts[i][1],
            color: c.turtle.color,
            width: c.turtle.width,
          });
        }
        c.turtle.x = x;
        c.turtle.y = y;
        c.turtle.heading = h;
        return { radius, extent, steps };
      }
      // full circle: leave turtle pose unchanged (classic Logo rotates around)
      if (Math.abs(Math.abs(extent) - 360) < 0.01) {
        return { radius, cx: round(center.x), cy: round(center.y) };
      }
      return { radius, extent };
    }
    case 'dot': {
      const r = clamp(Number(a.radius ?? a.size ?? c.turtle.width * 2), 0.5, 200);
      c.strokes.push({
        type: 'dot',
        cx: round(c.turtle.x),
        cy: round(c.turtle.y),
        r: round(r),
        color: String(a.color || c.turtle.color),
      });
      return { r };
    }
    case 'text':
    case 'write': {
      const text = String(a.text ?? a.label ?? '');
      if (!text) throw new Error('text requires text');
      c.strokes.push({
        type: 'text',
        x: round(Number(a.x ?? c.turtle.x)),
        y: round(Number(a.y ?? c.turtle.y)),
        text,
        color: String(a.color || c.turtle.color),
        size: clamp(Number(a.size ?? 16), 6, 128),
      });
      return { text };
    }
    case 'poly':
    case 'polygon': {
      const pts = a.points;
      if (!Array.isArray(pts) || pts.length < 3) throw new Error('poly needs points [[x,y],…] (≥3)');
      c.strokes.push({
        type: 'poly',
        points: pts.map((p) => [round(Number(p[0])), round(Number(p[1]))]),
        color: String(a.color || c.turtle.color),
        width: Number(a.width ?? c.turtle.width),
        fill: a.fill != null ? String(a.fill) : c.turtle.fill,
      });
      return { n: pts.length };
    }
    case 'line': {
      const x1 = Number(a.x1);
      const y1 = Number(a.y1);
      const x2 = Number(a.x2);
      const y2 = Number(a.y2);
      c.strokes.push({
        type: 'line',
        x1: round(x1),
        y1: round(y1),
        x2: round(x2),
        y2: round(y2),
        color: String(a.color || c.turtle.color),
        width: Number(a.width ?? c.turtle.width),
      });
      return { ok: true };
    }
    default:
      throw new Error(`unknown turtle op: ${name}`);
  }
}

// --- tool definitions ---------------------------------------------
const TOOLS = [
  {
    name: 'canvas_new',
    description:
      'Create a named drawing canvas (turtle world). Does not edit HTML — pure turtle strokes. Overwrites if exists when overwrite=true.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Canvas id (default main)' },
        width: { type: 'integer', description: 'Width px (default 800)' },
        height: { type: 'integer', description: 'Height px (default 600)' },
        bg: { type: 'string', description: 'Background color CSS (default #ffffff)' },
        overwrite: { type: 'boolean', description: 'Replace existing canvas' },
      },
    },
  },
  {
    name: 'canvas_list',
    description: 'List saved canvases on disk with stroke counts and SVG paths.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'canvas_get',
    description: 'Get turtle pose, size, stroke count, and file paths for a canvas.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
    },
  },
  {
    name: 'canvas_clear',
    description: 'Erase all strokes; keep size/bg; turtle returns home (center, heading 0).',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
    },
  },
  {
    name: 'canvas_delete',
    description: 'Delete canvas JSON + SVG from disk.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'turtle_state',
    description: 'Current turtle pose only (x,y,heading,pen,color,width).',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
    },
  },
  {
    name: 'turtle_home',
    description: 'Move turtle to center, heading 0 (up). Draws if pen is down.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
    },
  },
  {
    name: 'turtle_forward',
    description: 'Move turtle forward by distance (px). Draws a line if pen is down. Heading 0 = up.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        distance: { type: 'number', description: 'Pixels to move' },
      },
      required: ['distance'],
    },
  },
  {
    name: 'turtle_backward',
    description: 'Move turtle backward by distance (px). Draws if pen down.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        distance: { type: 'number' },
      },
      required: ['distance'],
    },
  },
  {
    name: 'turtle_left',
    description: 'Turn left (counterclockwise) by angle degrees.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        angle: { type: 'number' },
      },
      required: ['angle'],
    },
  },
  {
    name: 'turtle_right',
    description: 'Turn right (clockwise) by angle degrees.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        angle: { type: 'number' },
      },
      required: ['angle'],
    },
  },
  {
    name: 'turtle_setheading',
    description: 'Set absolute heading. 0=up, 90=right, 180=down, 270=left.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        heading: { type: 'number' },
      },
      required: ['heading'],
    },
  },
  {
    name: 'turtle_goto',
    description: 'Go to absolute (x,y). Draws if pen down. Origin top-left, y down.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        x: { type: 'number' },
        y: { type: 'number' },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'turtle_penup',
    description: 'Lift pen — moves do not draw.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
    },
  },
  {
    name: 'turtle_pendown',
    description: 'Put pen down — moves draw strokes.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
    },
  },
  {
    name: 'turtle_pencolor',
    description: 'Set stroke color (CSS color string, e.g. #e11d48 or blue).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        color: { type: 'string' },
      },
      required: ['color'],
    },
  },
  {
    name: 'turtle_pensize',
    description: 'Set stroke width in px.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        size: { type: 'number' },
      },
      required: ['size'],
    },
  },
  {
    name: 'turtle_fillcolor',
    description: 'Set fill color for subsequent circle/poly (null/empty = no fill).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        color: { type: 'string', description: 'CSS color or empty to clear fill' },
      },
    },
  },
  {
    name: 'turtle_circle',
    description:
      'Draw a circle/arc with given radius. Full 360 draws an SVG circle centered to the left of the turtle. Optional extent degrees for arcs.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        radius: { type: 'number' },
        extent: { type: 'number', description: 'Degrees of arc (default 360)' },
      },
      required: ['radius'],
    },
  },
  {
    name: 'turtle_dot',
    description: 'Stamp a filled dot at the turtle position.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        radius: { type: 'number' },
        color: { type: 'string' },
      },
    },
  },
  {
    name: 'draw_text',
    description: 'Draw a text label at turtle position (or explicit x,y). Not HTML — SVG text stroke.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        text: { type: 'string' },
        x: { type: 'number' },
        y: { type: 'number' },
        size: { type: 'number' },
        color: { type: 'string' },
      },
      required: ['text'],
    },
  },
  {
    name: 'draw_line',
    description: 'Absolute line from (x1,y1) to (x2,y2) without moving turtle pose permanently.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        x1: { type: 'number' },
        y1: { type: 'number' },
        x2: { type: 'number' },
        y2: { type: 'number' },
        color: { type: 'string' },
        width: { type: 'number' },
      },
      required: ['x1', 'y1', 'x2', 'y2'],
    },
  },
  {
    name: 'draw_poly',
    description: 'Absolute polygon from points [[x,y],…]. Optional fill.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        points: {
          type: 'array',
          items: { type: 'array', items: { type: 'number' } },
        },
        color: { type: 'string' },
        width: { type: 'number' },
        fill: { type: 'string' },
      },
      required: ['points'],
    },
  },
  {
    name: 'turtle_batch',
    description:
      'Run many turtle ops in ONE call (efficient multi-hop). Each op: {op, ...args}. Ops: forward, backward, left, right, setheading, goto, home, penup, pendown, pencolor, pensize, fillcolor, circle, dot, text, poly, line. Prefer this over many single tool calls.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        commands: {
          type: 'array',
          description: 'Ordered list of ops, e.g. [{"op":"pencolor","color":"red"},{"op":"forward","distance":100}]',
          items: { type: 'object' },
        },
      },
      required: ['commands'],
    },
  },
  {
    name: 'canvas_export_svg',
    description:
      'Write/refresh SVG and return path + byte size + optional inline SVG (truncated). Open the .svg file to see the drawing.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        inline: { type: 'boolean', description: 'Include SVG text (capped)' },
      },
    },
  },
  {
    name: 'canvas_export_json',
    description: 'Return stroke log summary (counts by type) and JSON path. Full dump only if full=true (can be large).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        full: { type: 'boolean' },
      },
    },
  },
  {
    name: 'canvas_snapshot',
    description:
      'Compact visual summary for agents: bounds of ink, stroke counts, turtle pose, SVG path. Use this instead of dumping all strokes.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
    },
  },
];

// --- tool dispatch ---
function cname(args) {
  return (args && args.name) || 'main';
}

function strokeStats(c) {
  const by = {};
  for (const s of c.strokes) by[s.type] = (by[s.type] || 0) + 1;
  return by;
}

function inkBounds(c) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const hit = (x, y) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  for (const s of c.strokes) {
    if (s.type === 'line') {
      hit(s.x1, s.y1);
      hit(s.x2, s.y2);
    } else if (s.type === 'circle' || s.type === 'dot') {
      hit(s.cx - s.r, s.cy - s.r);
      hit(s.cx + s.r, s.cy + s.r);
    } else if (s.type === 'poly') {
      for (const p of s.points || []) hit(p[0], p[1]);
    } else if (s.type === 'text') hit(s.x, s.y);
  }
  if (!Number.isFinite(minX)) return null;
  return {
    minX: round(minX),
    minY: round(minY),
    maxX: round(maxX),
    maxY: round(maxY),
    width: round(maxX - minX),
    height: round(maxY - minY),
  };
}

function callTool(name, args = {}) {
  switch (name) {
    case 'canvas_new': {
      const { name: safe, json } = canvasPath(args.name || 'main');
      if (fs.existsSync(json) && !args.overwrite) {
        throw new Error(`canvas exists: ${safe} (pass overwrite=true)`);
      }
      const c = saveCanvas(defaultCanvas(safe, args.width, args.height, args.bg));
      return { ok: true, ...turtleState(c) };
    }
    case 'canvas_list': {
      const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.json'));
      const items = files.map((f) => {
        const c = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
        return {
          name: c.name,
          width: c.width,
          height: c.height,
          strokes: c.strokes.length,
          updatedAt: c.updatedAt,
          svg: canvasPath(c.name).svg,
        };
      });
      return { root: ROOT, canvases: items };
    }
    case 'canvas_get': {
      const c = ensureCanvas(cname(args));
      saveCanvas(c);
      return turtleState(c);
    }
    case 'canvas_clear': {
      const c = ensureCanvas(cname(args));
      c.strokes = [];
      c.turtle.x = c.width / 2;
      c.turtle.y = c.height / 2;
      c.turtle.heading = 0;
      saveCanvas(c);
      return { ok: true, ...turtleState(c) };
    }
    case 'canvas_delete': {
      const p = canvasPath(args.name);
      if (!fs.existsSync(p.json)) throw new Error(`canvas not found: ${p.name}`);
      try {
        fs.unlinkSync(p.json);
      } catch {}
      try {
        fs.unlinkSync(p.svg);
      } catch {}
      return { ok: true, deleted: p.name };
    }
    case 'turtle_state': {
      const c = ensureCanvas(cname(args));
      return turtleState(c);
    }
    case 'turtle_home': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'home' });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_forward': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'forward', args: { distance: args.distance } });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_backward': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'backward', args: { distance: args.distance } });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_left': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'left', args: { angle: args.angle } });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_right': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'right', args: { angle: args.angle } });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_setheading': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'setheading', args: { heading: args.heading } });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_goto': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'goto', args: { x: args.x, y: args.y } });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_penup': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'penup' });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_pendown': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'pendown' });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_pencolor': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'pencolor', args: { color: args.color } });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_pensize': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'pensize', args: { size: args.size } });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_fillcolor': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'fillcolor', args: { color: args.color } });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_circle': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'circle', args: { radius: args.radius, extent: args.extent } });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'turtle_dot': {
      const c = ensureCanvas(cname(args));
      applyOp(c, { op: 'dot', args: { radius: args.radius, color: args.color } });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'draw_text': {
      const c = ensureCanvas(cname(args));
      applyOp(c, {
        op: 'text',
        args: { text: args.text, x: args.x, y: args.y, size: args.size, color: args.color },
      });
      saveCanvas(c);
      return turtleState(c);
    }
    case 'draw_line': {
      const c = ensureCanvas(cname(args));
      applyOp(c, {
        op: 'line',
        args: {
          x1: args.x1,
          y1: args.y1,
          x2: args.x2,
          y2: args.y2,
          color: args.color,
          width: args.width,
        },
      });
      saveCanvas(c);
      return { ok: true, strokeCount: c.strokes.length, svgPath: canvasPath(c.name).svg };
    }
    case 'draw_poly': {
      const c = ensureCanvas(cname(args));
      applyOp(c, {
        op: 'poly',
        args: { points: args.points, color: args.color, width: args.width, fill: args.fill },
      });
      saveCanvas(c);
      return { ok: true, strokeCount: c.strokes.length, svgPath: canvasPath(c.name).svg };
    }
    case 'turtle_batch': {
      const c = ensureCanvas(cname(args));
      const cmds = args.commands;
      if (!Array.isArray(cmds) || !cmds.length) throw new Error('commands array required');
      if (cmds.length > 500) throw new Error('max 500 commands per batch');
      const results = [];
      for (let i = 0; i < cmds.length; i++) {
        const op = cmds[i];
        if (!op || typeof op !== 'object') throw new Error(`commands[${i}] must be object`);
        const opName = op.op || op.tool || op.name;
        if (!opName) throw new Error(`commands[${i}] missing op`);
        const { op: _o, tool: _t, name: _n, args: nested, ...rest } = op;
        results.push({ i, op: opName, result: applyOp(c, { op: opName, args: nested || rest }) });
      }
      saveCanvas(c);
      return {
        ok: true,
        ran: results.length,
        turtle: turtleState(c),
        last: results[results.length - 1],
      };
    }
    case 'canvas_export_svg': {
      const c = ensureCanvas(cname(args));
      saveCanvas(c);
      const svg = renderSvg(c);
      const p = canvasPath(c.name).svg;
      const out = {
        path: p,
        bytes: Buffer.byteLength(svg),
        strokeCount: c.strokes.length,
        turtle: turtleState(c),
      };
      if (args.inline) {
        out.svg = svg.length > 4000 ? svg.slice(0, 4000) + '\n<!-- truncated -->' : svg;
      }
      return out;
    }
    case 'canvas_export_json': {
      const c = ensureCanvas(cname(args));
      const p = canvasPath(c.name).json;
      const base = {
        path: p,
        strokeCount: c.strokes.length,
        byType: strokeStats(c),
        turtle: turtleState(c),
      };
      if (args.full) base.canvas = c;
      return base;
    }
    case 'canvas_snapshot': {
      const c = ensureCanvas(cname(args));
      saveCanvas(c);
      return {
        name: c.name,
        size: { width: c.width, height: c.height },
        bg: c.bg,
        strokeCount: c.strokes.length,
        byType: strokeStats(c),
        inkBounds: inkBounds(c),
        turtle: turtleState(c),
        svgPath: canvasPath(c.name).svg,
        jsonPath: canvasPath(c.name).json,
      };
    }
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

// --- MCP stdio ─------------------------------------------------
function send(m) {
  process.stdout.write(JSON.stringify(m) + '\n');
}

readline.createInterface({ input: process.stdin }).on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  const { id, method, params } = msg;
  try {
    if (method === 'initialize') {
      return send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'turtle-canvas', version: '1.0.0' },
        },
      });
    }
    if (method && method.startsWith('notifications/')) return;
    if (method === 'tools/list') {
      return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
    }
    if (method === 'tools/call') {
      const r = callTool(params.name, params.arguments || {});
      return send({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(r) }] },
      });
    }
    if (id !== undefined) {
      send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (e) {
    if (id !== undefined) {
      send({
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: String(e.message || e) },
      });
    }
  }
});

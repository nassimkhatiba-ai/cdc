/**
 * Pure-Node monospace text → PNG (no native deps).
 * Renders dense skill text into one image for vision-token loading.
 */
'use strict';

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// 5x7 bitmap font for printable ASCII 32-126 (compact)
// Each glyph: 7 rows of 5 bits (LSB = left). Space = empty.
const GLYPH_W = 5;
const GLYPH_H = 7;
const FONT = buildFont();

function buildFont() {
  // Minimal readable set; missing glyphs fall back to box
  const raw = {
    ' ': [],
    '!': [0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100, 0b00000],
    '"': [0b01010, 0b01010, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
    '#': [0b01010, 0b11111, 0b01010, 0b01010, 0b11111, 0b01010, 0b00000],
    $: [0b00100, 0b01111, 0b10100, 0b01110, 0b00101, 0b11110, 0b00100],
    '%': [0b11001, 0b11010, 0b00100, 0b01000, 0b10111, 0b00111, 0b00000],
    '&': [0b01100, 0b10010, 0b10100, 0b01000, 0b10101, 0b10010, 0b01101],
    "'": [0b00100, 0b00100, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
    '(': [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010],
    ')': [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000],
    '*': [0b00100, 0b10101, 0b01110, 0b00100, 0b01110, 0b10101, 0b00100],
    '+': [0b00000, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100, 0b00000],
    ',': [0b00000, 0b00000, 0b00000, 0b00000, 0b00100, 0b00100, 0b01000],
    '-': [0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000],
    '.': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100, 0b00000],
    '/': [0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b00000, 0b00000],
    0: [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
    1: [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
    2: [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
    3: [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
    4: [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
    5: [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
    6: [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
    7: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
    8: [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
    9: [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
    ':': [0b00000, 0b00100, 0b00000, 0b00000, 0b00100, 0b00000, 0b00000],
    ';': [0b00000, 0b00100, 0b00000, 0b00000, 0b00100, 0b00100, 0b01000],
    '<': [0b00010, 0b00100, 0b01000, 0b10000, 0b01000, 0b00100, 0b00010],
    '=': [0b00000, 0b00000, 0b11111, 0b00000, 0b11111, 0b00000, 0b00000],
    '>': [0b01000, 0b00100, 0b00010, 0b00001, 0b00010, 0b00100, 0b01000],
    '?': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b00000, 0b00100],
    '@': [0b01110, 0b10001, 0b10111, 0b10101, 0b10110, 0b10000, 0b01110],
    A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
    B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
    C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
    D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
    E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
    F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
    G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
    H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
    I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
    J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
    K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
    L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
    M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
    N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
    O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
    P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
    Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
    R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
    S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
    T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
    U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
    V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
    W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
    X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
    Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
    Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
    '[': [0b01110, 0b01000, 0b01000, 0b01000, 0b01000, 0b01000, 0b01110],
    '\\': [0b10000, 0b01000, 0b00100, 0b00010, 0b00001, 0b00000, 0b00000],
    ']': [0b01110, 0b00010, 0b00010, 0b00010, 0b00010, 0b00010, 0b01110],
    '^': [0b00100, 0b01010, 0b10001, 0b00000, 0b00000, 0b00000, 0b00000],
    _: [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b11111],
    '`': [0b01000, 0b00100, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
    a: [0b00000, 0b00000, 0b01110, 0b00001, 0b01111, 0b10001, 0b01111],
    b: [0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b10001, 0b11110],
    c: [0b00000, 0b00000, 0b01110, 0b10000, 0b10000, 0b10001, 0b01110],
    d: [0b00001, 0b00001, 0b01111, 0b10001, 0b10001, 0b10001, 0b01111],
    e: [0b00000, 0b00000, 0b01110, 0b10001, 0b11111, 0b10000, 0b01110],
    f: [0b00110, 0b01001, 0b01000, 0b11100, 0b01000, 0b01000, 0b01000],
    g: [0b00000, 0b00000, 0b01111, 0b10001, 0b10001, 0b01111, 0b00001, /*g uses 7; last row clipped*/],
    h: [0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b10001, 0b10001],
    i: [0b00100, 0b00000, 0b01100, 0b00100, 0b00100, 0b00100, 0b01110],
    j: [0b00010, 0b00000, 0b00110, 0b00010, 0b00010, 0b10010, 0b01100],
    k: [0b10000, 0b10000, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010],
    l: [0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
    m: [0b00000, 0b00000, 0b11010, 0b10101, 0b10101, 0b10101, 0b10101],
    n: [0b00000, 0b00000, 0b11110, 0b10001, 0b10001, 0b10001, 0b10001],
    o: [0b00000, 0b00000, 0b01110, 0b10001, 0b10001, 0b10001, 0b01110],
    p: [0b00000, 0b00000, 0b11110, 0b10001, 0b10001, 0b11110, 0b10000],
    q: [0b00000, 0b00000, 0b01111, 0b10001, 0b10001, 0b01111, 0b00001],
    r: [0b00000, 0b00000, 0b10110, 0b11001, 0b10000, 0b10000, 0b10000],
    s: [0b00000, 0b00000, 0b01111, 0b10000, 0b01110, 0b00001, 0b11110],
    t: [0b01000, 0b01000, 0b11100, 0b01000, 0b01000, 0b01001, 0b00110],
    u: [0b00000, 0b00000, 0b10001, 0b10001, 0b10001, 0b10011, 0b01101],
    v: [0b00000, 0b00000, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
    w: [0b00000, 0b00000, 0b10001, 0b10001, 0b10101, 0b10101, 0b01010],
    x: [0b00000, 0b00000, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001],
    y: [0b00000, 0b00000, 0b10001, 0b10001, 0b10001, 0b01111, 0b00001],
    z: [0b00000, 0b00000, 0b11111, 0b00010, 0b00100, 0b01000, 0b11111],
    '{': [0b00010, 0b00100, 0b00100, 0b01000, 0b00100, 0b00100, 0b00010],
    '|': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
    '}': [0b01000, 0b00100, 0b00100, 0b00010, 0b00100, 0b00100, 0b01000],
    '~': [0b00000, 0b00000, 0b01000, 0b10101, 0b00010, 0b00000, 0b00000],
  };
  // lowercase g fix to 7 rows
  raw.g = [0b00000, 0b00000, 0b01111, 0b10001, 0b10001, 0b01111, 0b00001];
  const map = Object.create(null);
  for (const [ch, rows] of Object.entries(raw)) {
    map[ch] = rows.length ? rows : [0, 0, 0, 0, 0, 0, 0];
  }
  map['\t'] = map[' '];
  return map;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([t, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, t, data, crcBuf]);
}

function encodePngRGBA(width, height, rgba) {
  // rgba: Buffer length width*height*4
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function wrapLines(text, maxCols) {
  const out = [];
  const lines = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  for (const line of lines) {
    if (line.length <= maxCols) {
      out.push(line);
      continue;
    }
    let rest = line;
    while (rest.length > maxCols) {
      let cut = rest.lastIndexOf(' ', maxCols);
      if (cut < maxCols * 0.5) cut = maxCols;
      out.push(rest.slice(0, cut));
      rest = rest.slice(cut).replace(/^\s+/, '');
    }
    if (rest) out.push(rest);
  }
  return out;
}

/**
 * Render plain text to PNG buffer.
 * @param {string} text
 * @param {object} opts
 */
function textToPng(text, opts = {}) {
  const scale = opts.scale || 2; // pixel scale of 5x7 glyphs
  const pad = opts.pad != null ? opts.pad : 12;
  const maxCols = opts.maxCols || 100;
  const lineGap = opts.lineGap != null ? opts.lineGap : 2;
  const bg = opts.bg || [12, 14, 18, 255]; // dark
  const fg = opts.fg || [230, 235, 240, 255]; // light
  const maxHeight = opts.maxHeight || 8192; // hard cap

  const lines = wrapLines(text, maxCols);
  const cellW = (GLYPH_W + 1) * scale; // +1 spacing
  const cellH = (GLYPH_H + lineGap) * scale;
  const contentW = maxCols * cellW;
  const contentH = lines.length * cellH;
  let width = contentW + pad * 2;
  let height = contentH + pad * 2;

  // If too tall, we still render (vision models accept tall images); clamp only if requested
  if (height > maxHeight) {
    // shrink scale adaptively
    const factor = maxHeight / height;
    return textToPng(text, { ...opts, scale: Math.max(1, Math.floor(scale * factor * 0.95)), maxHeight: maxHeight * 2 });
  }

  const rgba = Buffer.alloc(width * height * 4);
  // fill bg
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = bg[0];
    rgba[i * 4 + 1] = bg[1];
    rgba[i * 4 + 2] = bg[2];
    rgba[i * 4 + 3] = bg[3];
  }

  function setPx(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const o = (y * width + x) * 4;
    rgba[o] = fg[0];
    rgba[o + 1] = fg[1];
    rgba[o + 2] = fg[2];
    rgba[o + 3] = fg[3];
  }

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    for (let ci = 0; ci < line.length && ci < maxCols; ci++) {
      const ch = line[ci];
      const glyph = FONT[ch] || FONT['?'] || [0b11111, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11111];
      const baseX = pad + ci * cellW;
      const baseY = pad + li * cellH;
      for (let gy = 0; gy < GLYPH_H; gy++) {
        const row = glyph[gy] || 0;
        for (let gx = 0; gx < GLYPH_W; gx++) {
          // bit 4 = leftmost
          if (row & (1 << (GLYPH_W - 1 - gx))) {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                setPx(baseX + gx * scale + sx, baseY + gy * scale + sy);
              }
            }
          }
        }
      }
    }
  }

  const png = encodePngRGBA(width, height, rgba);
  return {
    png,
    width,
    height,
    lines: lines.length,
    maxCols,
    scale,
    charCount: text.length,
  };
}

/**
 * Pack a .cdc file: PNG bytes + trailing JSON sidecar after IEND is invalid.
 * Instead: .cdc = PNG where we store meta in a tEXt chunk before IDAT... simpler:
 * .cdc format v1 = JSON envelope is NOT used; file IS a PNG renamed .cdc
 * Companion: same path with .cdc.meta.json optional
 *
 * For single-file: prepend a custom header? Hosts need image/png.
 * Decision: .cdc IS valid PNG (extension only). meta written alongside as .cdc.json
 */
function writeCdc(outPath, text, opts = {}) {
  const rendered = textToPng(text, opts);
  const cdcPath = outPath.endsWith('.cdc') ? outPath : outPath + '.cdc';
  fs.mkdirSync(path.dirname(cdcPath) || '.', { recursive: true });
  fs.writeFileSync(cdcPath, rendered.png);
  const meta = {
    format: 'cdc-image-skill',
    version: 1,
    contentType: 'image/png',
    note: 'Entire skill body as one image. Load as vision input, not text.',
    width: rendered.width,
    height: rendered.height,
    lines: rendered.lines,
    charCount: rendered.charCount,
    scale: rendered.scale,
    maxCols: rendered.maxCols,
    sourceChars: text.length,
    // rough text-token estimate (~4 chars/token) vs vision (~fixed per tile; caller estimates)
    approxTextTokens: Math.ceil(text.length / 4),
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(cdcPath + '.json', JSON.stringify(meta, null, 2));
  // also write .png alias for hosts that only sniff extension
  const pngAlias = cdcPath.replace(/\.cdc$/, '.cdc.png');
  fs.writeFileSync(pngAlias, rendered.png);
  return { cdcPath, pngAlias, meta, rendered };
}

function mdToSkillImageText(md) {
  // Strip YAML frontmatter markers but KEEP content (entire skill including frontmatter fields as text)
  return String(md);
}

module.exports = { textToPng, writeCdc, wrapLines, mdToSkillImageText };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('usage: node render.js <input.md> <output.cdc> [--cols 100] [--scale 2]');
    process.exit(2);
  }
  const input = args[0];
  const output = args[1];
  let cols = 100;
  let scale = 2;
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--cols') cols = parseInt(args[++i], 10);
    if (args[i] === '--scale') scale = parseInt(args[++i], 10);
  }
  const text = fs.readFileSync(input, 'utf8');
  const r = writeCdc(output, mdToSkillImageText(text), { maxCols: cols, scale });
  console.log(JSON.stringify({ ok: true, ...r.meta, cdc: r.cdcPath, png: r.pngAlias }, null, 2));
}

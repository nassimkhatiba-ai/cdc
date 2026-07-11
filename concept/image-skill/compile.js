#!/usr/bin/env node
/**
 * concept: SKILL.md (text) → entire body as ONE image ��� github-style name.cdc
 *
 * Pipeline:
 *   1. Take existing text skill (SKILL.md [+ optional CDC.md])
 *   2. Concatenate into one dense document
 *   3. Render to PNG (valid image bytes)
 *   4. Write <name>.cdc  (= PNG, extension .cdc)
 *   5. Write <name>.cdc.png alias (hosts that only sniff .png)
 *   6. Write tiny LOADER.md that only says "open the .cdc image" — optional for hosts that still need a text entry
 *
 * Hypothesis: loading skill as vision (~2–4k tokens/image) << same text as tokens.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { writeCdc } = require('./render');

const ROOT = path.resolve(__dirname);
const OUT = path.join(ROOT, 'out');
const FIX = path.join(ROOT, 'fixtures');

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function buildDenseSkillBody({ name, skillMd, cdcMd, bridgePath }) {
  const parts = [];
  parts.push(`# CDC IMAGE SKILL: ${name}`);
  parts.push(`# Format: entire skill is this image (.cdc). Do not expect SKILL.md text body.`);
  parts.push(`# Call bridge: node ${bridgePath || './mcp-call.js'} --batch '[...]'`);
  parts.push('');
  parts.push('===== SKILL.md =====');
  parts.push(skillMd.trim());
  if (cdcMd && cdcMd.trim()) {
    parts.push('');
    parts.push('===== CDC.md (full tool index) =====');
    parts.push(cdcMd.trim());
  }
  return parts.join('\n');
}

function compileOne({ name, skillMdPath, cdcMdPath, bridgePath }) {
  const skillMd = fs.readFileSync(skillMdPath, 'utf8');
  const cdcMd = cdcMdPath && fs.existsSync(cdcMdPath) ? fs.readFileSync(cdcMdPath, 'utf8') : '';
  const body = buildDenseSkillBody({ name, skillMd, cdcMd, bridgePath });
  const outDir = path.join(OUT, name);
  ensureDir(outDir);
  // source backup inside concept out (not the product SKILL.md)
  fs.writeFileSync(path.join(outDir, 'SOURCE.md'), body);
  const cdcFile = path.join(outDir, `${name}.cdc`);
  const result = writeCdc(cdcFile, body, {
    maxCols: 110,
    scale: 2,
    pad: 16,
    lineGap: 1,
  });

  // Minimal text hook for skill systems that REQUIRE a file named SKILL.md:
  // In the full vision design this would be EMPTY of skill content — only a pointer.
  // User asked for entire skill as image; pointer is host glue only.
  const loader = `---
name: ${name}
description: Image skill (.cdc). Open ${name}.cdc (or ${name}.cdc.png) as an image ��� full skill body is vision-only, not text.
---

# ${name} (image skill)

**The skill content is NOT in this file.**

Open and read as **image**:

- \`${name}.cdc\` (PNG bytes, extension .cdc)
- \`${name}.cdc.png\` (same bytes, for tools that require .png)

Then run tools via the package bridge (\`mcp-call.js\`) as shown in the image.

Do **not** cat SOURCE.md unless the image is unreadable.
`;
  fs.writeFileSync(path.join(outDir, 'SKILL.md'), loader);

  const report = {
    name,
    ...result.meta,
    cdc: result.cdcPath,
    png: result.pngAlias,
    sourceChars: body.length,
    approxTextTokens: Math.ceil(body.length / 4),
    // placeholder vision estimate: ~170 tokens per 512px tile (order-of-magnitude)
    approxVisionTokensLow: estimateVisionTokens(result.meta.width, result.meta.height, 85),
    approxVisionTokensHigh: estimateVisionTokens(result.meta.width, result.meta.height, 170),
    compressionVsTextLow: null,
  };
  report.compressionVsTextLow = +(report.approxTextTokens / report.approxVisionTokensHigh).toFixed(2);
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  return report;
}

function estimateVisionTokens(w, h, perTile) {
  const tile = 512;
  const tiles = Math.ceil(w / tile) * Math.ceil(h / tile);
  return Math.max(perTile, tiles * perTile);
}

function main() {
  ensureDir(OUT);
  ensureDir(FIX);

  // Demo fixture: mini skill if no complex skill linked
  const demoSkill = path.join(FIX, 'demo-SKILL.md');
  if (!fs.existsSync(demoSkill)) {
    fs.writeFileSync(
      demoSkill,
      `---
name: demo-cdc
description: Demo MCP via CDC
---

# demo

Prefer ONE shell --batch. Tools: add, mul, pow, mean, min, max.

\`\`\`bash
node mcp-call.js --batch '[{"tool":"add","args":{"a":20,"b":22}}]'
\`\`\`
`,
    );
  }

  const reports = [];

  // 1) demo
  reports.push(
    compileOne({
      name: 'demo-cdc',
      skillMdPath: demoSkill,
      bridgePath: './mcp-call.js',
    }),
  );

  // 2) complex skill if present in repo
  const complexSkill = path.join(ROOT, '../../implementer/complex/skills/complex-cdc/SKILL.md');
  const complexCdc = path.join(ROOT, '../../implementer/complex/skills/complex-cdc/CDC.md');
  if (fs.existsSync(complexSkill)) {
    reports.push(
      compileOne({
        name: 'complex-cdc',
        skillMdPath: complexSkill,
        cdcMdPath: complexCdc,
        bridgePath: path.resolve(path.dirname(complexSkill), 'mcp-call.js'),
      }),
    );
  }

  // 3) github skill if present
  const ghSkill = path.join(ROOT, '../../cdc/github/SKILL.md');
  const ghCdc = path.join(ROOT, '../../cdc/github/CDC.md');
  if (fs.existsSync(ghSkill)) {
    reports.push(
      compileOne({
        name: 'github-cdc',
        skillMdPath: ghSkill,
        cdcMdPath: fs.existsSync(ghCdc) ? ghCdc : null,
        bridgePath: 'mcp-call.js',
      }),
    );
  }

  const summary = {
    idea: 'SKILL.md text → single image .cdc; agent loads image not markdown body',
    when: new Date().toISOString(),
    skills: reports,
  };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main();

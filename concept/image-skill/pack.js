#!/usr/bin/env node
/**
 * Pack a text CDC skill directory into an image-skill package (.cdc).
 *
 * Input:  skillDir with SKILL.md, optional CDC.md, mcp-call.js
 * Output: outDir/<name>/
 *   <name>.cdc / .cdc.png [+ page-NNN]
 *   SOURCE.md
 *   mcp-call.js (copy)
 *   meta.json
 *   SKILL.md (pointer only — host glue)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { writeCdc } = require('./render');

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function packSkill({
  skillDir,
  outDir,
  name,
  scale = 2,
  maxCols = 100,
  maxPageHeight = 4096,
}) {
  skillDir = path.resolve(skillDir);
  outDir = path.resolve(outDir);
  name = name || path.basename(skillDir);
  const dest = path.join(outDir, name);
  ensureDir(dest);

  const skillMd = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
  const cdcPath = path.join(skillDir, 'CDC.md');
  const cdcMd = fs.existsSync(cdcPath) ? fs.readFileSync(cdcPath, 'utf8') : '';

  const bridgeSrc = path.join(skillDir, 'mcp-call.js');
  const bridgeDest = path.join(dest, 'mcp-call.js');
  if (fs.existsSync(bridgeSrc)) {
    fs.copyFileSync(bridgeSrc, bridgeDest);
  }

  // Copy other runtime helpers if present
  for (const f of ['mcp-manifest.json', 'q.js', 'snapshot.js', 'stats.json']) {
    const p = path.join(skillDir, f);
    if (fs.existsSync(p)) fs.copyFileSync(p, path.join(dest, f));
  }

  const body = [
    `# CDC IMAGE SKILL: ${name}`,
    `# ENTIRE skill body is this image. Prefer tools listed below.`,
    `# Bridge (absolute when installed): node ${bridgeDest}`,
    `# Single tool: node mcp-call.js <tool> '{}'`,
    `# Batch: node mcp-call.js --batch '[{"tool":"NAME","args":{}}]'`,
    `# Multi-page: node -e "const {openSession,callPaged}=require('./mcp-call.js');..."`,
    '',
    '===== SKILL.md =====',
    skillMd.trim(),
    cdcMd
      ? '\n===== CDC.md =====\n' + cdcMd.trim()
      : '',
  ].join('\n');

  fs.writeFileSync(path.join(dest, 'SOURCE.md'), body);

  const cdcOut = path.join(dest, `${name}.cdc`);
  const rendered = writeCdc(cdcOut, body, {
    scale,
    maxCols,
    maxPageHeight,
    pad: 14,
    lineGap: 1,
  });

  const pointer = `---
name: ${name}
description: Image CDC skill. Skill body is vision-only in ${name}.cdc.png — do not cat SOURCE.md. Call via mcp-call.js.
---

# ${name} (image skill)

**Skill body is NOT text.** It is attached / stored as:

${rendered.pngPaths.map((p) => `- \`${path.basename(p)}\``).join('\n')}

Bridge:

\`\`\`bash
node ${JSON.stringify(bridgeDest)} --batch '[{"tool":"server_info","args":{}}]'
\`\`\`

Open the image(s), then call tools. Do not re-enable MCP.
`;
  fs.writeFileSync(path.join(dest, 'SKILL.md'), pointer);

  const report = {
    name,
    skillDir,
    dest,
    ...rendered.meta,
    bridge: fs.existsSync(bridgeDest) ? bridgeDest : null,
    sourceChars: body.length,
  };
  fs.writeFileSync(path.join(dest, 'meta.json'), JSON.stringify(report, null, 2));
  return report;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2 || args.includes('-h') || args.includes('--help')) {
    console.error(`usage: node pack.js <skillDir> <outDir> [--name N] [--scale 2] [--cols 100] [--max-h 4096]

Example:
  node pack.js ../../implementer/complex/skills/complex-cdc ./packages
`);
    process.exit(2);
  }
  const skillDir = args[0];
  const outDir = args[1];
  let name;
  let scale = 2;
  let cols = 100;
  let maxH = 4096;
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--name') name = args[++i];
    if (args[i] === '--scale') scale = parseInt(args[++i], 10);
    if (args[i] === '--cols') cols = parseInt(args[++i], 10);
    if (args[i] === '--max-h') maxH = parseInt(args[++i], 10);
  }
  const r = packSkill({ skillDir, outDir, name, scale, maxCols: cols, maxPageHeight: maxH });
  console.log(JSON.stringify(r, null, 2));
}

if (require.main === module) main();
module.exports = { packSkill };

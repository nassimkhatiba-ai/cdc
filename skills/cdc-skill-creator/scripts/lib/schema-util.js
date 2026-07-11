// Shared helpers for rendering compact shape signatures from JSON Schema.
// Used by both OpenAPI and MCP compilers.

function makeResolver(spec) {
  const seen = new Set();
  return function resolve(node, depth = 0) {
    if (!node || typeof node !== 'object' || depth > 6) return node;
    if (node.$ref && typeof node.$ref === 'string' && node.$ref.startsWith('#/')) {
      if (seen.has(node.$ref)) return {};
      seen.add(node.$ref);
      const target = node.$ref
        .slice(2)
        .split('/')
        .reduce(
          (o, k) => o?.[decodeURIComponent(k.replace(/~1/g, '/').replace(/~0/g, '~'))],
          spec,
        );
      const r = resolve(target, depth + 1);
      seen.delete(node.$ref);
      return r;
    }
    return node;
  };
}

function shapeOf(schema, resolve = (x) => x, depth = 0) {
  schema = resolve(schema);
  if (!schema || depth > 2) return '…';
  if (schema.enum) {
    const vals = schema.enum.slice(0, 6).map((v) => JSON.stringify(v)).join('|');
    return vals + (schema.enum.length > 6 ? '|…' : '');
  }
  if (schema.anyOf || schema.oneOf) {
    const parts = (schema.anyOf || schema.oneOf).slice(0, 3).map((p) => shapeOf(p, resolve, depth + 1));
    return parts.join('|') + ((schema.anyOf || schema.oneOf).length > 3 ? '|…' : '');
  }
  if (schema.allOf) {
    const merged = { type: 'object', properties: {} };
    for (const part of schema.allOf.map(resolve)) {
      Object.assign(merged.properties, part?.properties || {});
    }
    schema = merged;
  }
  if (schema.type === 'array' || schema.items) {
    return '[' + shapeOf(schema.items, resolve, depth + 1) + ']';
  }
  if (schema.properties) {
    const keys = Object.keys(schema.properties);
    const shown = keys.slice(0, 12).join(',');
    return '{' + shown + (keys.length > 12 ? `,+${keys.length - 12}more` : '') + '}';
  }
  if (Array.isArray(schema.type)) return schema.type.join('|');
  return schema.type || 'any';
}

/** Compact params list: name* for required, name:shape for nested objects. */
function paramsOf(schema, resolve = (x) => x) {
  schema = resolve(schema) || {};
  const props = schema.properties || {};
  const required = new Set(schema.required || []);
  return Object.entries(props).map(([name, prop]) => {
    const p = resolve(prop) || {};
    const req = required.has(name) ? '*' : '';
    // Only show type hint when non-obvious
    let hint = '';
    if (p.enum) hint = ':' + shapeOf(p, resolve);
    else if (p.type === 'array' || p.items) hint = ':[]';
    else if (p.properties || p.type === 'object') hint = ':{}';
    else if (p.type && p.type !== 'string') hint = ':' + (Array.isArray(p.type) ? p.type[0] : p.type);
    return name + req + hint;
  });
}

function envVarName(name) {
  return `CDC_${String(name).toUpperCase().replace(/[^A-Z0-9]/g, '_')}_TOKEN`;
}

function scriptRulesBlock(authLine) {
  return `## How to call this API (CDC pattern)

Write ONE Node.js (18+) script per question. Rules:
1. ${authLine}
2. Fetch only what you need; paginate with per_page/page params where offered.
3. Do ALL filtering/aggregation/arithmetic IN THE SCRIPT — never in your head.
4. Print ONLY the final answer to stdout. Raw API payloads must never be
   echoed, logged, or pasted into the conversation.
5. On HTTP errors, print status + first 200 chars of the body and stop.`;
}

function writePackage(outDir, { cdc, skill, stats }) {
  const fs = require('fs');
  const path = require('path');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'CDC.md'), cdc);
  fs.writeFileSync(path.join(outDir, 'SKILL.md'), skill);
  fs.writeFileSync(path.join(outDir, 'stats.json'), JSON.stringify(stats, null, 2));
  return outDir;
}

/**
 * Emit image-skill artifacts (.cdc PNG pages) next to SKILL.md.
 * Always writes SOURCE.md, name.cdc.png, IMAGE.md, image-meta.json.
 * Image is primary by default (SKILL.md becomes pointer; full text in SKILL.text.md).
 * Opt out: CDC_IMAGE=0 / CDC_IMAGE=false / opts.replaceSkillMd === false.
 */
function writeImageSkill(outDir, { name, skill, cdc, replaceSkillMd, maxPageHeight = 3600 } = {}) {
  const fs = require('fs');
  const path = require('path');
  let writeCdc;
  try {
    writeCdc = require('./cdc-image').writeCdc;
  } catch {
    return null;
  }
  const skillName = name || path.basename(outDir);
  const body = [
    `# CDC IMAGE SKILL: ${skillName}`,
    '# Entire skill body is this image. Prefer tools listed below.',
    `# Bridge: node ${path.join(outDir, 'mcp-call.js')}`,
    '',
    '===== SKILL.md =====',
    String(skill || '').trim(),
    cdc ? '\n===== CDC.md =====\n' + String(cdc).trim() : '',
  ].join('\n');

  fs.writeFileSync(path.join(outDir, 'SOURCE.md'), body);
  const cdcFile = path.join(outDir, `${skillName}.cdc`);
  const rendered = writeCdc(cdcFile, body, {
    scale: 2,
    maxCols: 100,
    maxPageHeight,
    pad: 14,
    lineGap: 1,
  });

  const pages = (rendered.pngPaths || []).map((p) => `- \`${path.basename(p)}\``).join('\n');
  const bridge = path.join(outDir, 'mcp-call.js');
  const pointer = `---
name: ${skillName}-cdc
description: Image CDC skill for ${skillName}. Body is vision-only in ${skillName}.cdc.png — open image; call via mcp-call.js.
---

# ${skillName} (image skill)

**Skill body is the image**, not this text file.

Images:
${pages}

Bridge:

\`\`\`bash
node ${JSON.stringify(bridge)} --batch '[{"tool":"server_info","args":{}}]'
\`\`\`

Open the .cdc.png image(s), then call tools. MCP off.
`;

  fs.writeFileSync(path.join(outDir, 'IMAGE.md'), pointer);
  // Main path: image is primary unless explicitly disabled
  const env = process.env.CDC_IMAGE;
  const forceImage =
    replaceSkillMd === true ||
    env === '1' ||
    env === 'true' ||
    (replaceSkillMd !== false && env !== '0' && env !== 'false' && env !== 'text');
  if (forceImage) {
    fs.writeFileSync(path.join(outDir, 'SKILL.text.md'), skill || '');
    fs.writeFileSync(path.join(outDir, 'SKILL.md'), pointer);
  }
  const meta = {
    ...rendered.meta,
    skillName,
    replaceSkillMd: !!forceImage,
    imagePrimary: !!forceImage,
  };
  fs.writeFileSync(path.join(outDir, 'image-meta.json'), JSON.stringify(meta, null, 2));
  return meta;
}

module.exports = {
  makeResolver,
  shapeOf,
  paramsOf,
  envVarName,
  scriptRulesBlock,
  writePackage,
  writeImageSkill,
};

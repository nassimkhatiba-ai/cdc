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

/** Resolve forced mode: explicit param > CDC_IMAGE_MODE > legacy CDC_IMAGE > auto. */
function resolveImageMode(explicit) {
  if (explicit === 'text' || explicit === 'image' || explicit === 'auto') return explicit;
  const m = (process.env.CDC_IMAGE_MODE || '').toLowerCase();
  if (m === 'text' || m === 'image' || m === 'auto') return m;
  const legacy = process.env.CDC_IMAGE;
  if (legacy === '1' || legacy === 'true') return 'image';
  if (legacy === '0' || legacy === 'false' || legacy === 'text') return 'text';
  return 'auto';
}

/**
 * Optical skill emission with auto routing (see lib/optical-pack.js).
 *
 * TEXT IS ALWAYS THE INSTALLED HOT PATH (SKILL.md). Optical pages are an
 * optional sidecar for hosts that can load vision skills; they must NEVER
 * replace SKILL.md with a thin "read the image" pointer. That pointer caused
 * Codex product-path thrash (sed SKILL → rg mcp-call.js — 2× tokens vs MCP).
 *
 * auto: pack a compact DSL body in-memory, estimate billed vision tokens,
 * and emit image pages ONLY when they beat the text-equivalent information
 * cost with margin AND the tool surface is big enough. Tiny skills stay
 * text and pay no vision floor (images not even rendered unless
 * CDC_EMIT_IMAGE=1).
 *
 * Package layout (always):
 *   SKILL.md          = full text skill (hot path for all hosts)
 *   {name}.cdc.png    = optional optical pages (sidecar)
 *   SKILL.optical.md  = vision-pointer only when image pages exist
 *   CDC.md            = full signatures for grep-on-fail
 *   image-meta.json   = pack metrics
 */
function writeImageSkill(outDir, { name, title, skill, cdc, tools, mode, indexInlined } = {}) {
  const fs = require('fs');
  const path = require('path');
  let optical;
  try {
    optical = require('./optical-pack');
  } catch {
    return null;
  }
  const { estimateTokens } = require('./tokens');
  const skillName = name || path.basename(outDir);

  const body = tools && tools.length
    ? optical.compactBody({ name: skillName, title: title || skillName, tools })
    : optical.compactMarkdown([skill || '', cdc || ''].join('\n'));

  const plan = optical.planOptical(body);
  const skillTokens = estimateTokens(skill || '');
  const cdcTokens = estimateTokens(cdc || '');
  // The image carries the FULL tool index; text pays for it via SKILL.md
  // (when inlined) or CDC.md greps (when not) — compare like for like.
  const textEquivalentTokens = indexInlined ? skillTokens : skillTokens + cdcTokens;
  const route = optical.chooseSkillMode({
    force: resolveImageMode(mode) === 'auto' ? null : resolveImageMode(mode),
    estVisionTokens: plan.estVisionTokens,
    textEquivalentTokens,
    toolCount: tools ? tools.length : 0,
  });

  const base = {
    skillName,
    skillMode: route.mode,
    skillModeReason: route.reason,
    estVisionTokens: plan.estVisionTokens,
    textEquivalentTokens,
    planned: { scale: plan.scale, width: plan.width, pages: plan.pages, tiles: plan.tiles, budgetMet: plan.budgetMet },
  };

  // Always keep text skill as SKILL.md (writePackage already wrote it; re-assert).
  if (skill) {
    fs.writeFileSync(path.join(outDir, 'SKILL.md'), skill);
  }

  if (route.mode !== 'image' && process.env.CDC_EMIT_IMAGE !== '1') {
    // No pages rendered (no vision floor paid) — but the router decision and
    // planned pack metrics are still recorded for inspection/benchmarks.
    const textMeta = { ...base, pages: 0, imagePrimary: false };
    fs.writeFileSync(path.join(outDir, 'image-meta.json'), JSON.stringify(textMeta, null, 2));
    return textMeta;
  }

  const meta = optical.writeOptical(path.join(outDir, `${skillName}.cdc`), body, {});
  const pageList = meta.pageFiles.map((p) => `\`${path.basename(p)}\``).join(', ');
  // Vision pointer is a SIDECAR only — never overwrites SKILL.md.
  const opticalPointer = `---
name: ${skillName}-cdc-optical
description: Optional optical view of ${title || skillName}. Prefer SKILL.md (text) as the hot path. Images: ${skillName}.cdc.png.
---

# ${skillName} (optical sidecar — optional)

Prefer **SKILL.md** (text) for normal use. Optical pages list tools for vision hosts only.

Images: ${pageList}

Bridge (same as text): \`node __SKILL_DIR__/mcp-call.js <tool> '<json>'\` · \`--batch\` · \`openSession()\`/\`callPaged()\`.

Never cat/sed mcp-call.js. Grep CDC.md for one tool signature on fail only.
`;

  fs.writeFileSync(path.join(outDir, 'SKILL.optical.md'), opticalPointer);
  // Remove legacy SKILL.text.md if present (old image-primary layout).
  try { fs.unlinkSync(path.join(outDir, 'SKILL.text.md')); } catch {}
  // Ensure SKILL.md is still the full text body (never the pointer).
  if (skill) {
    fs.writeFileSync(path.join(outDir, 'SKILL.md'), skill);
  }

  const full = {
    ...meta,
    ...base,
    // imagePrimary false for product install: text is always hot path.
    // Optical pages exist as sidecar; harness may still force image mode.
    imagePrimary: false,
    opticalSidecar: true,
    opticalWouldHaveBeenPrimary: route.mode === 'image',
    approxVisionTokens: meta.estVisionTokens,
  };
  fs.writeFileSync(path.join(outDir, 'image-meta.json'), JSON.stringify(full, null, 2));
  return full;
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

// Compile an OpenAPI 3.x JSON spec into a CDC package.
const { estimateTokens } = require('./tokens');
const {
  makeResolver,
  shapeOf,
  envVarName,
  scriptRulesBlock,
  writePackage,
} = require('./schema-util');

async function loadSpec(src) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src, { headers: { 'user-agent': 'cdc-make' } });
    if (!res.ok) throw new Error(`fetch ${src}: HTTP ${res.status}`);
    return res.text();
  }
  const fs = require('fs');
  return fs.readFileSync(src, 'utf8');
}

/**
 * @param {object} opts
 * @param {string} opts.src - URL or path to OpenAPI JSON
 * @param {string} opts.name - package name (e.g. "github")
 * @param {string} [opts.outRoot="cdc"] - output root directory
 * @param {string} [opts.baseUrl] - override servers[0].url
 * @returns {Promise<{outDir: string, stats: object}>}
 */
async function compileOpenAPI({ src, name, outRoot = 'cdc', baseUrl: baseUrlOverride } = {}) {
  if (!src || !name) throw new Error('compileOpenAPI requires { src, name }');

  const rawText = await loadSpec(src);
  const spec = JSON.parse(rawText);
  const resolve = makeResolver(spec);
  const title = spec.info?.title || name;
  const baseUrl = baseUrlOverride || spec.servers?.[0]?.url || '(set base URL)';

  const envVar = envVarName(name);
  const schemes = Object.values(spec.components?.securitySchemes || {});
  let authLine = 'No auth scheme declared; many endpoints may work unauthenticated.';
  for (const s of schemes.map(resolve)) {
    if (s.type === 'http' && s.scheme === 'bearer') {
      authLine = `Send header \`authorization: Bearer $${envVar}\` (read from env, never hardcode).`;
      break;
    }
    if (s.type === 'apiKey' && s.in === 'header') {
      authLine = `Send header \`${s.name}: $${envVar}\` (read from env, never hardcode).`;
      break;
    }
    if (s.type === 'http' && s.scheme === 'basic') {
      authLine = `HTTP Basic auth: user/token from $${envVar} (\`authorization: Basic base64(user:token)\`).`;
      break;
    }
  }

  const byTag = new Map();
  let nEndpoints = 0;
  for (const [p, item] of Object.entries(spec.paths || {})) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const op = item[method];
      if (!op) continue;
      nEndpoints += 1;
      const params = [...(item.parameters || []), ...(op.parameters || [])].map((x) => resolve(x));
      const query = params
        .filter((x) => x?.in === 'query')
        .map((x) => x.name + (x.required ? '*' : ''));
      let body = '';
      if (op.requestBody) {
        const rb = resolve(op.requestBody);
        const schema = rb?.content?.['application/json']?.schema;
        if (schema) body = ' body:' + shapeOf(schema, resolve);
      }
      const okResp = op.responses?.['200'] || op.responses?.['201'] || op.responses?.['202'];
      const respSchema = resolve(okResp)?.content?.['application/json']?.schema;
      const resp = respSchema ? shapeOf(respSchema, resolve) : okResp ? 'ok' : '?';
      const summary = (op.summary || '').replace(/\s+/g, ' ').trim();
      const line = `${method.toUpperCase()} ${p}${query.length ? '?' + query.join('&') : ''}${body} -> ${resp}${summary ? ' — ' + summary : ''}`;
      const tag = op.tags?.[0] || 'misc';
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag).push(line);
    }
  }

  const tags = [...byTag.keys()].sort();
  const scriptRules = scriptRulesBlock(authLine);

  let cdc = `# ${title} — CDC (Code-Call Descriptor)\n\nBase URL: ${baseUrl}\n${scriptRules}\n\nQuery params: \`*\` = required. Response shapes show top-level fields only.\n`;
  for (const tag of tags) {
    cdc += `\n## ${tag}\n`;
    for (const line of byTag.get(tag)) cdc += line + '\n';
  }

  const tagDir = tags.map((t) => `- ${t} (${byTag.get(t).length} endpoints)`).join('\n');
  const skill = `---
name: ${name}-cdc
description: Call the ${title} API by writing sandboxed Node scripts (CDC pattern — no MCP server, no schemas in context). Use when the user asks to query, analyze, or automate anything involving ${title}. Read only the CDC.md sections you need.
---

# ${title} via CDC

Base URL: ${baseUrl}

${scriptRules}

## Finding endpoints (progressive disclosure — do NOT read all of CDC.md)

CDC.md in this skill folder holds one line per endpoint, grouped under
\`## <tag>\` headings. Grep it for the tag or path you need, e.g.:

\`\`\`
grep -A 200 "^## repos" CDC.md | head -50     # section view
grep "GET /users" CDC.md                       # path search
\`\`\`

Tags available:
${tagDir}
`;

  const path = require('path');
  const outDir = path.join(outRoot, name);

  const specTokens = rawText.length > 2_000_000 ? Math.round(rawText.length / 4) : estimateTokens(rawText);
  const stats = {
    name,
    title,
    source: 'openapi',
    endpoints: nEndpoints,
    tags: tags.length,
    tools: nEndpoints,
    specBytes: rawText.length,
    sourceBytes: rawText.length,
    sourceTokens: specTokens,
    specTokens,
    cdcBytes: cdc.length,
    cdcTokens: estimateTokens(cdc),
    skillBytes: skill.length,
    skillTokens: estimateTokens(skill),
    generatedAt: new Date().toISOString(),
  };
  stats.compressionSourceToCdc = +(stats.sourceTokens / Math.max(1, stats.cdcTokens)).toFixed(1);
  stats.compressionSourceToSkill = +(stats.sourceTokens / Math.max(1, stats.skillTokens)).toFixed(1);
  // back-compat aliases
  stats.compressionSpecToCdc = stats.compressionSourceToCdc;
  stats.compressionSpecToSkill = stats.compressionSourceToSkill;

  writePackage(outDir, { cdc, skill, stats });
  return { outDir, stats };
}

module.exports = { compileOpenAPI, loadSpec };

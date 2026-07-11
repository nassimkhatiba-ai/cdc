// Shared convert-time messaging: the product win must be felt at install,
// not buried in paper stats. Agents + humans both read this output.

/**
 * Build the "you will notice" copy after MCP → CDC conversion.
 * @param {object} stats compileMCP/compileOpenAPI stats
 * @param {{ installed?: string[], warmed?: boolean, skillName?: string }} opts
 */
function buildConvertWin(stats, opts = {}) {
  const skillName =
    opts.skillName ||
    (stats.name && (stats.name.endsWith('-cdc') ? stats.name : `${stats.name}-cdc`)) ||
    'skill';
  const tools = stats.tools || stats.endpoints || 0;
  const skillTok = stats.skillTokens || 0;
  const srcTok = stats.sourceTokens || stats.specTokens || stats.mcpSchemaTokens || 0;
  const ratio = Number(stats.definitionSavingsRatio || stats.compressionSourceToSkill || 0) || 0;
  const tier = stats.skillTier || stats.mode || 'mcp';
  const installed = opts.installed || [];
  const warmed = !!opts.warmed;

  const tierBlurb =
    tier === 'cli'
      ? 'CLI/batch one-liners (no openSession boilerplate)'
      : tier === 'paged'
        ? 'CLI for simple calls; callPaged for full list pagination'
        : tier === 'direct-fs'
          ? 'direct Node fs (no MCP process)'
          : tier === 'multi'
            ? 'CLI for 1-2 calls; one openSession script for multi-step'
            : 'short skill + lazy CDC.md index';

  // Definition-tax headline: only claim Nx when the number is real.
  // Tiny dumps can have skill > dump size - still a win once the MCP is disabled
  // (connected MCP pays schemas every turn; skill pays ~skillTok once when used).
  let headline;
  if (ratio >= 2 && srcTok > skillTok) {
    headline = `~${ratio}x smaller definition tax than full MCP schemas (${srcTok} -> ${skillTok} tokens).`;
  } else if (srcTok > skillTok && ratio >= 1) {
    headline = `Compact skill: ${skillTok} tokens vs ~${srcTok} MCP schema tokens (${ratio}x).`;
  } else if (tier === 'cli') {
    headline =
      `Small surface (${tools} tools) -> CLI-first skill (${skillTok} tok). ` +
      'Win is session tax + wall time, not dump size.';
  } else {
    headline = `Skill is ${skillTok} tokens upfront; tool details stay in CDC.md (grep lazily).`;
  }

  const mustDisable =
    'Disable/remove the same-name MCP server in Claude/Codex config. ' +
    'If MCP stays connected you pay schema tax AND skill tax - you will not feel the win.';

  const speedBits = [
    tier === 'cli' || tier === 'paged' || tier === 'multi'
      ? 'Prefer CLI/--batch (one shell call) over multi-turn MCP tool loops'
      : null,
    warmed ? 'Warm daemon pre-started (repeat calls skip cold start)' : null,
    tier === 'direct-fs' ? 'No MCP spawn - pure fs under the sandbox root' : null,
  ].filter(Boolean);

  const userNotice = [
    headline,
    `Path: ${tierBlurb}.`,
    mustDisable,
    speedBits.length ? `Speed: ${speedBits.join('; ')}.` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const nextStep = mustDisable;

  const howToUse = installed.length
    ? `Using the ${skillName} skill, ...  (MCP server of the same name must be OFF)`
    : `Install: cdc install ${stats.name} --target both  then disable the MCP server`;

  const tryLine = installed.length
    ? `Using the ${skillName} skill, ...`
    : `Using the ${skillName} skill, ...`;

  const lines = [
    '',
    '----------------------------------------',
    '  CDC convert win',
    '----------------------------------------',
    `  skill      ${skillName}  (${tools} tools, tier=${tier})`,
    `  context    ${skillTok} skill tokens` +
      (srcTok ? `  |  MCP schemas ~${srcTok} tok` : '') +
      (ratio >= 1 && srcTok > skillTok ? `  |  ${ratio}x smaller` : ''),
    `  how        ${tierBlurb}`,
  ];
  if (installed.length) {
    for (const p of installed) lines.push(`  installed  ${p}`);
  }
  if (warmed) lines.push('  daemon     pre-warmed (faster first call)');
  lines.push('');
  lines.push(`  * ${mustDisable}`);
  lines.push('');
  lines.push(`  Try:  "${tryLine}"`);
  lines.push('----------------------------------------');
  lines.push('');

  return {
    skillName,
    tier,
    headline,
    userNotice,
    nextStep,
    howToUse,
    mustDisable,
    text: lines.join('\n'),
    summary: {
      skillTokens: skillTok,
      sourceTokens: srcTok,
      definitionSavingsRatio: ratio,
      skillTier: tier,
      tools,
    },
  };
}

module.exports = { buildConvertWin };

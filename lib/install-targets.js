// Shared skill install paths for Claude Code + OpenAI Codex.
// Agent Skills standard (SKILL.md folders) works in both.

const fs = require('fs');
const path = require('path');

function home() {
  return process.env.HOME || process.env.USERPROFILE || '.';
}

/**
 * Resolve install target directories.
 * @param {{ target?: string, skillsDir?: string }} opts
 *   target: 'claude' | 'codex' | 'both' | 'auto' (default auto)
 *   skillsDir: explicit single directory (overrides target)
 * @returns {string[]}
 */
function resolveSkillsDirs(opts = {}) {
  if (opts.skillsDir) return [path.resolve(opts.skillsDir)];
  if (process.env.CDC_SKILLS_DIR) return [path.resolve(process.env.CDC_SKILLS_DIR)];

  const target = (opts.target || process.env.CDC_TARGET || 'auto').toLowerCase();
  const claude = path.join(home(), '.claude', 'skills');
  // Codex discovers user skills here (Agent Skills standard)
  const codex = path.join(home(), '.codex', 'skills');
  // Some setups also use ~/.agents/skills
  const agents = path.join(home(), '.agents', 'skills');

  if (target === 'claude') return [claude];
  if (target === 'codex') return [codex];
  if (target === 'both') return [claude, codex];

  // auto: install wherever skill roots already exist; default both if none
  const existing = [];
  if (fs.existsSync(claude) || fs.existsSync(path.join(home(), '.claude'))) existing.push(claude);
  if (fs.existsSync(codex) || fs.existsSync(path.join(home(), '.codex'))) existing.push(codex);
  // only add agents if it already has skills (avoid polluting empty tree)
  if (fs.existsSync(agents) && fs.readdirSync(agents).length) existing.push(agents);

  if (existing.length) return [...new Set(existing)];
  return [claude, codex];
}

/**
 * Install a skill package into one or more skill dirs.
 * Destination is replaced entirely so mode changes (e.g. mcp -> direct-fs)
 * do not leave stale mcp-call.js / old files behind.
 *
 * Templates reference the bridge as `__SKILL_DIR__/mcp-call.js`; that
 * placeholder is resolved to the real install path here, per destination —
 * agent-written scripts run from arbitrary cwds, so relative requires break.
 */
function installToDirs(srcDir, skillFolderName, dirs) {
  const installed = [];
  for (const dir of dirs) {
    const dest = path.join(dir, skillFolderName);
    fs.mkdirSync(dir, { recursive: true });
    // Clean replace: remove previous install so orphans (mcp-call.js etc.) cannot linger.
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(srcDir, dest, { recursive: true });
    const skillMd = path.join(dest, 'SKILL.md');
    if (fs.existsSync(skillMd)) {
      const text = fs.readFileSync(skillMd, 'utf8');
      if (text.includes('__SKILL_DIR__')) {
        fs.writeFileSync(skillMd, text.split('__SKILL_DIR__').join(dest));
      }
    }
    installed.push(dest);
  }
  return installed;
}

function skillFolderName(name) {
  if (name === 'cdc-skill-creator') return 'cdc-skill-creator';
  return name.endsWith('-cdc') ? name : `${name}-cdc`;
}

module.exports = {
  resolveSkillsDirs,
  installToDirs,
  skillFolderName,
  home,
};

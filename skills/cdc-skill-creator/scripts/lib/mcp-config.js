// Find already-configured MCP servers in Claude Code / Codex config files,
// so "convert my filesystem mcp" needs zero exploration: the agent runs
// `from-config --name filesystem` and the command/args come from config.
//
// Sources (best effort, all optional):
//   ~/.claude.json            mcpServers + projects[*].mcpServers
//   ./.mcp.json               mcpServers (project-scoped)
//   ~/.codex/config.toml      [mcp_servers.<name>] command/args
const fs = require('fs');
const path = require('path');
const os = require('os');

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function findMcpServers(query) {
  const out = [];
  const seen = new Set();
  const add = (name, cfg, source) => {
    if (!cfg || !cfg.command) return; // http/sse servers have no local command to probe
    const args = Array.isArray(cfg.args) ? cfg.args.map(String) : [];
    const key = `${name}|${cfg.command}|${args.join(' ')}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ name, command: cfg.command, args, env: cfg.env || null, source });
  };

  const home = os.homedir();

  const claude = readJson(path.join(home, '.claude.json'));
  if (claude) {
    for (const [n, c] of Object.entries(claude.mcpServers || {})) add(n, c, '~/.claude.json');
    for (const [proj, p] of Object.entries(claude.projects || {})) {
      for (const [n, c] of Object.entries(p?.mcpServers || {})) add(n, c, `~/.claude.json (${proj})`);
    }
  }

  const project = readJson(path.resolve('.mcp.json'));
  if (project) {
    for (const [n, c] of Object.entries(project.mcpServers || {})) add(n, c, '.mcp.json');
  }

  try {
    const toml = fs.readFileSync(path.join(home, '.codex', 'config.toml'), 'utf8');
    const re = /\[mcp_servers\.(?:"([^"]+)"|([^\]\s]+))\]([^[]*)/g;
    let m;
    while ((m = re.exec(toml))) {
      const name = m[1] || m[2];
      const block = m[3];
      const command = block.match(/^\s*command\s*=\s*"([^"]+)"/m)?.[1];
      const argsRaw = block.match(/^\s*args\s*=\s*\[([^\]]*)\]/m)?.[1] || '';
      const args = [...argsRaw.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
      if (command) add(name, { command, args }, '~/.codex/config.toml');
    }
  } catch {}

  if (!query) return out;
  const q = String(query).toLowerCase();
  const exact = out.filter((s) => s.name.toLowerCase() === q);
  return exact.length ? exact : out.filter((s) => s.name.toLowerCase().includes(q));
}

module.exports = { findMcpServers };

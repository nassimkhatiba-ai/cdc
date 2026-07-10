# cdc-skill-creator

Agent Skill that converts MCP servers (or OpenAPI) into **CDC skills**.

Works in **Claude Code** and **OpenAI Codex** (same Agent Skills format).

## Install

```bash
# from the cdc repo
node bin/cdc.js install-creator --target both
# -> ~/.claude/skills/cdc-skill-creator
# -> ~/.codex/skills/cdc-skill-creator
```

Restart Codex after install so it picks up the skill.

## Use

In Claude Code or Codex:

- "Convert my GitHub MCP into a CDC skill"
- "Use cdc-skill-creator on this tools.json"
- "Make a CDC skill from `npx -y @modelcontextprotocol/server-github`"

The creator installs e.g. `github-cdc` into the matching skill dirs.
That skill is what you use day-to-day — **not** a connected MCP.

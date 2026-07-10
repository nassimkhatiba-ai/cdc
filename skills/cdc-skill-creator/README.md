# cdc-skill-creator

Claude Code skill that converts MCP servers (or OpenAPI) into **CDC skills**.

## Install into Claude Code

From this repo:

```bash
# copy the skill
cp -R skills/cdc-skill-creator ~/.claude/skills/cdc-skill-creator

# or via the cdc CLI once linked:
#   node bin/cdc.js  (not required — this folder is already a skill)
```

Or one-liner:

```bash
mkdir -p ~/.claude/skills && \
cp -R skills/cdc-skill-creator ~/.claude/skills/cdc-skill-creator
```

## Use

In Claude Code, say things like:

- "Convert my GitHub MCP into a CDC skill"
- "Use cdc-skill-creator on this tools.json"
- "Make a CDC skill from `npx -y @modelcontextprotocol/server-github`"

Claude loads **cdc-skill-creator**, runs `scripts/create-cdc-skill.js`, and
installs `~/.claude/skills/<name>-cdc/`.

That new skill is what you use for day-to-day work — **not** a connected MCP.

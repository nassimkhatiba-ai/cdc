---
name: cdc-skill-creator
description: Convert any MCP server or OpenAPI spec into a short CDC Agent Skill for Claude Code and Codex. Use when the user wants to convert an MCP, make a CDC skill, turn tools into a skill, stop loading MCP schemas, or says "make this MCP a skill" / "convert my MCP".
---

# CDC Skill Creator

Convert **any** MCP (or OpenAPI) into a short **Agent Skill** - not a connected MCP.

Generator rules (product quality for every user):

1. **Always run the script** - never hand-write SKILL.md for real tool lists.
2. **General templates only** - no example files, demo paths, or task-specific code in generated skills.
3. Filesystem MCPs → **direct Node fs** (no MCP/npx re-entry). Other MCPs → short bridge + mcp-call.js.
4. Skills stay **short**: one script, print answer only, no thrash instructions.

```
MCP tools/list  -->  ~/.claude/skills/<name>-cdc/
                       SKILL.md   (short preamble)
                       CDC.md     (grep lazily)
                       mcp-call.js  (bridge mode only)
```

## Install targets

| agent | skill directory |
|---|---|
| Claude Code | `~/.claude/skills/<name>-cdc/` |
| OpenAI Codex | `~/.codex/skills/<name>-cdc/` |

Default `--target auto` installs into **both** when present.

## Workflow

### 1. Inputs

| field | required | notes |
|---|---|---|
| **name** | yes | lowercase, e.g. `github`, `stripe` |
| **source** | yes | tools JSON, `--probe` command, or OpenAPI URL |

Do **not** invent tool schemas.

### 2. Run converter

From this skill folder (or absolute path):

```bash
# tools dump
node scripts/create-cdc-skill.js from-mcp --name <name> --file /path/to/tools.json

# live stdio MCP (preferred - captures command/args for mode detect + bridge)
node scripts/create-cdc-skill.js from-mcp \
  --name <name> \
  --probe <command> \
  --arg <arg> ...

# OpenAPI
node scripts/create-cdc-skill.js from-openapi --name <name> --spec <url-or-path>
```

Examples:

```bash
# filesystem MCP (becomes direct-fs skill; root from last path arg)
node scripts/create-cdc-skill.js from-mcp \
  --name filesystem \
  --probe npx --arg -y --arg @modelcontextprotocol/server-filesystem \
  --arg /path/to/allowed/root

# generic MCP bridge
node scripts/create-cdc-skill.js from-mcp \
  --name github \
  --probe npx --arg -y --arg @modelcontextprotocol/server-github
```

Flags: `--no-install` · `--target claude|codex|both|auto` · `--skills-dir DIR` · `--title "..."` · `--http-base URL` · `--out DIR`

### 3. Report result

Stdout is JSON (`ok`, `skillName`, `tools`, `skillTokens`, `installed`, `howToUse`).

Tell the user:

1. Skill name + install path(s)
2. Tool count + skill tokens (definition tax vs full MCP schemas)
3. Loads as a **skill**, not an MCP connection
4. Example: `Using the <name>-cdc skill, ...`

## What gets generated

| mode | when | contents |
|---|---|---|
| **direct-fs** | filesystem-like tools + optional root path | short SKILL (Node fs), CDC.md map, **no** mcp-call.js |
| **http** | `--http-base` | short fetch skill + CDC.md |
| **mcp** | everything else | short skill + CDC.md + mcp-call.js + manifest |

Generated skills must **never** contain:

- Hardcoded demo files (`orders.json`, sandbox paths from other users, etc.)
- Long multi-step thrash recipes
- Instructions to re-enter MCP when direct-fs applies

## Rules for you (agent)

1. Always run the script --- do not hand-edit large generated packages.
2. Prefer `--probe` with full command + args (needed for filesystem root + bridge).
3. Never paste full tool schemas into chat after conversion.
4. Default: install for detected agents.
5. Name: lowercase letters/digits/hyphens only.

---
name: cdc-skill-creator
description: Convert MCP servers (or OpenAPI specs) into Claude Code CDC skills so tools load as a skill instead of a connected MCP. Use when the user wants to convert an MCP, make a CDC skill, turn tools into a skill, stop loading MCP schemas into context, run cdc-skill-creator, or says "make this MCP a skill" / "convert my MCP".
---

# CDC Skill Creator

Turn an **MCP server** (or OpenAPI spec) into a **Claude Code skill**.

Claude loads the result as a normal skill (`~/.claude/skills/<name>-cdc/`) -
**not** as a connected MCP server. No tool schemas dumped into context. The
agent greps a one-line-per-tool index and writes a sandboxed script.

```
MCP tools/list  --this skill-->  ~/.claude/skills/<name>-cdc/
                                   SKILL.md   (~400-900 tokens)
                                   CDC.md     (grep lazily)
                                   mcp-call.js
```

## When to use

- User: "convert this MCP into a CDC skill"
- User: "make a skill for my GitHub / Stripe / other MCP"
- User: "stop loading X as MCP, use CDC"
- User pastes a `tools/list` JSON dump
- User gives an MCP launch command (`npx -y @...`) or OpenAPI URL

## Workflow (do this every time)

### 1. Collect inputs

You need:

| field | required | example |
|---|---|---|
| **name** | yes | `github`, `stripe`, `linear` |
| **source** | yes | tools JSON **or** probe command **or** OpenAPI URL |
| title | no | `GitHub MCP` |
| install | no | default **yes** -> `~/.claude/skills/<name>-cdc` |

If the user only says "convert my GitHub MCP", prefer probing a known package
or ask for the command / tools dump. Do **not** invent tool schemas.

### 2. Run the converter script

Script path (relative to this skill folder):

```bash
node scripts/create-cdc-skill.js from-mcp --name <name> [options]
```

**Option A - tools dump file**

```bash
node scripts/create-cdc-skill.js from-mcp \
  --name github \
  --file /path/to/tools.json
```

**Option B - stdin (tools.json in the workspace)**

```bash
node scripts/create-cdc-skill.js from-mcp --name github --stdin < tools.json
```

**Option C - probe a live stdio MCP server**

```bash
node scripts/create-cdc-skill.js from-mcp \
  --name github \
  --probe npx \
  --arg -y \
  --arg "@modelcontextprotocol/server-github"
```

**Option D - OpenAPI -> skill**

```bash
node scripts/create-cdc-skill.js from-openapi \
  --name petstore \
  --spec https://petstore3.swagger.io/api/v3/openapi.json
```

Always run from the skill directory, or use an absolute path:

```bash
# if skill is installed:
node ~/.claude/skills/cdc-skill-creator/scripts/create-cdc-skill.js from-mcp ...

# if working inside this repo:
node skills/cdc-skill-creator/scripts/create-cdc-skill.js from-mcp ...
```

Flags:

- `--no-install` - only build under `.cdc-build/`, do not copy to `~/.claude/skills`
- `--skills-dir DIR` - override install location
- `--title "..."` - display title in SKILL.md
- `--command CMD` / `--arg A` - bake MCP launch into `mcp-manifest.json` (for `mcp-call.js`)
- `--http-base URL` - generate HTTP-mode skill instead of MCP bridge
- `--out DIR` - build directory (default `.cdc-build`)

### 3. Read the JSON result

Stdout is JSON:

```json
{
  "ok": true,
  "skillName": "github-cdc",
  "tools": 42,
  "skillTokens": 680,
  "installed": "/Users/.../.claude/skills/github-cdc",
  "howToUse": "In Claude Code: \"Using the github-cdc skill, ...\"",
  "note": "Installed as a Claude Code skill - not as a connected MCP server."
}
```

On failure: `{ "ok": false, "error": "..." }` - fix and retry.

### 4. Tell the user what happened

Report:

1. Skill name and install path
2. Tool count + upfront skill tokens (vs full MCP schema size if present)
3. That it loads as a **skill**, not an MCP connection
4. How to use it next session, e.g.:

> Using the github-cdc skill, list my open PRs.

Optional savings estimate:

```bash
node scripts/create-cdc-skill.js stats --package github --paper
```

## Getting a tools dump when the user has MCP already

If tools are already connected in the current session, you can:

1. Call the MCP server's tool list if available, **or**
2. Ask the user to paste / save a `tools/list` response as JSON, **or**
3. Use `--probe` with their start command from Claude Desktop / Cursor config.

Claude Desktop config often looks like:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

Map that to:

```bash
node scripts/create-cdc-skill.js from-mcp \
  --name github \
  --probe npx \
  --arg -y \
  --arg "@modelcontextprotocol/server-github"
```

## What the generated skill contains

```
~/.claude/skills/<name>-cdc/
  SKILL.md            # short preamble Claude loads first
  CDC.md              # one line per tool (grep; do not load whole file)
  stats.json          # compression numbers
  mcp-call.js         # optional bridge to call the original MCP from scripts
  mcp-manifest.json   # command/args for mcp-call.js
```

## Rules for you (the agent using this creator)

1. **Always run the script** - do not hand-write SKILL.md/CDC.md for large tool lists.
2. **Never paste full tool schemas** into the chat after conversion. Point at the skill path.
3. Prefer `--probe` or a file over retyping tools.
4. Default to **installing** the skill (`~/.claude/skills`).
5. After install, suggest one example prompt that uses the new skill by name.
6. If probe fails (timeout, auth), fall back to asking for a tools dump.
7. Name skills with lowercase letters/digits/hyphens only (`linear`, `gh`, `my-api`).

## Why this exists

MCP-as-tool-bus loads every schema and routes every payload through the model.
CDC skills keep a tiny preamble in context; aggregation runs in code. Same
capabilities, far fewer tokens - and arithmetic stays exact.

Deep dive: repo `PAPER.md` / `cdc --stats --paper` if the toolkit is checked out.

---
name: cdc-skill-creator
description: Convert any MCP server or OpenAPI spec into a short CDC Agent Skill for Claude Code and Codex. Use when the user wants to convert an MCP, make a CDC skill, turn tools into a skill, stop loading MCP schemas, or says "make this MCP a skill" / "convert my MCP".
---

# CDC Skill Creator

Convert **any** MCP (or OpenAPI) into a short **Agent Skill** - not a connected MCP.

**Product goal:** after convert, the user must *notice* fewer tokens and faster work.
That only happens if (1) the skill is short + CLI-first and (2) the **same MCP is disabled**.

Generator rules (product quality for every user):

1. **Always run the script** - never hand-write SKILL.md for real tool lists.
2. **General templates only** - no example files, demo paths, or task-specific code in generated skills.
3. Filesystem MCPs -> **direct Node fs** (no MCP/npx re-entry). Other MCPs -> short bridge + mcp-call.js.
4. Skills stay **short** but not blind: CDC.md keeps a one-line description per
   tool (guessing return shapes causes exploratory-script thrash).
5. Bridge skills are **tiered**:
   - **cli** (<=12 tools, no real pagination): CLI/`--batch` only - no openSession boilerplate
   - **paged**: teach `callPaged` only when tools truly paginate (page/cursor/offset)
   - **multi**: openSession for multi-step aggregates
6. Generated rules enforce **recon-then-compute** (max 2 runs) and a
   **canonical-source rule** (never aggregate a full dump plus its page shards).

```
MCP tools/list  -->  ~/.claude/skills/<name>-cdc/
                       SKILL.md   (short preamble, CLI-first)
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

### 2. Run converter - ONE command, no exploration

**When the user says "convert my X MCP", X is almost always already in their
config. Try `from-config` FIRST** - it finds command/args in `~/.claude.json`,
`.mcp.json`, or `~/.codex/config.toml` and probes automatically:

```bash
node scripts/create-cdc-skill.js from-config --name <configured-server-name>
```

If it exits non-zero it prints the configured server names - pick and retry.
Only fall back to explicit forms when the server is not configured anywhere:

```bash
# live stdio MCP by command (values starting with -- are fine: --arg --headless)
node scripts/create-cdc-skill.js from-mcp --name <name> --probe <cmd> --arg <a> ...
# tools dump
node scripts/create-cdc-skill.js from-mcp --name <name> --file /path/to/tools.json
# OpenAPI
node scripts/create-cdc-skill.js from-openapi --name <name> --spec <url-or-path>
```

Flags: `--no-install` · `--target claude|codex|both|auto` · `--skills-dir DIR` · `--title "..."` · `--http-base URL` · `--out DIR` · `--verbose` · `--no-warm`

### 3. Report result - make the win obvious

Stdout is ONE compact JSON line. Do **not** read/cat any generated file.
Report from the JSON fields (prefer `userNotice` / `nextStep` when present):

1. `<skillName>` installed -> paths; tier=`<skillTier>`; **warmed**=daemon ready
2. **Token win:** `<skillTokens>` skill tokens vs `<sourceTokens>` MCP schema tokens
   (quote `definitionSavingsRatio` when >=1). Quote `userNotice`.
3. **Required next step (always say this):** disable/remove the same-name MCP
   in Claude/Codex config - otherwise user pays schema tax AND skill tax and
   will **not** feel cheaper/faster. Quote `nextStep`.
4. Try: `Using the <skillName> skill, ...` (MCP of same name must be OFF)

Never claim "done" without the disable-MCP step.

## What gets generated

| mode / tier | when | contents |
|---|---|---|
| **direct-fs** | filesystem-like tools + optional root path | short SKILL (Node fs), CDC.md map, **no** mcp-call.js |
| **http** | `--http-base` | short fetch skill + CDC.md |
| **mcp / cli** | <=12 tools, no real pagination | CLI/`--batch` skill + mcp-call.js |
| **mcp / paged** | list tools with page/cursor/offset | CLI + callPaged + openSession |
| **mcp / multi** | larger surface, multi-step | CLI + openSession script path |

Generated skills must **never** contain:

- Hardcoded demo files (`orders.json`, sandbox paths from other users, etc.)
- Fake `callPaged` examples on non-paginated tools
- Instructions to re-enter MCP when direct-fs applies
- Encouragement to keep the MCP server connected

## Rules for you (agent)

1. Always run the script - do not hand-edit large generated packages.
2. Prefer `--probe` with full command + args (needed for filesystem root + bridge).
3. Never paste full tool schemas into chat after conversion.
4. Default: install for detected agents.
5. Name: lowercase letters/digits/hyphens only.
6. After convert: **tell the user to disable the MCP** - that is the product.

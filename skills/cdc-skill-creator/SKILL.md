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
4. Skills stay **short** but not blind: CDC.md keeps a one-line description per
   tool (guessing return shapes causes exploratory-script thrash).
5. Bridge skills use `openSession()` — **one server process per script**, never
   a spawn per call (per-call `npx` cold starts were the big latency regression).
6. Generated rules enforce **recon-then-compute** (max 2 runs) and a
   **canonical-source rule** (never aggregate a full dump plus its page shards —
   this exact mistake produced a 2× wrong answer in live A/B).

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

### 2. Run converter — ONE command, no exploration

**When the user says "convert my X MCP", X is almost always already in their
config. Try `from-config` FIRST** — it finds command/args in `~/.claude.json`,
`.mcp.json`, or `~/.codex/config.toml` and probes automatically:

```bash
node scripts/create-cdc-skill.js from-config --name <configured-server-name>
```

If it exits non-zero it prints the configured server names — pick and retry.
Only fall back to explicit forms when the server is not configured anywhere:

```bash
# live stdio MCP by command (values starting with -- are fine: --arg --headless)
node scripts/create-cdc-skill.js from-mcp --name <name> --probe <cmd> --arg <a> ...
# tools dump
node scripts/create-cdc-skill.js from-mcp --name <name> --file /path/to/tools.json
# OpenAPI
node scripts/create-cdc-skill.js from-openapi --name <name> --spec <url-or-path>
```

Flags: `--no-install` · `--target claude|codex|both|auto` · `--skills-dir DIR` · `--title "..."` · `--http-base URL` · `--out DIR` · `--verbose`

### 3. Report result — 3 lines, nothing more

Stdout is ONE compact JSON line. Do **not** read/cat any generated file, do
not re-open SKILL.md/CDC.md to "verify" — trust the JSON. Report exactly:

1. `<skillName>` installed → `<installed paths>`
2. `<tools>` tools, `<skillTokens>` skill tokens (vs full MCP schemas)
3. Try: `Using the <skillName> skill, ...`

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

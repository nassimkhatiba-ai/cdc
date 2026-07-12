# Notion same-task A/B - Codex MCP vs Codex CDC skill (post product fix)

**Model:** `gpt-5.6-sol` �� reasoning `medium` · real workspace + token  
**Task (identical):** get-self + search `stacksnap` + read `stacksnap_FULL_PLAN` heading  
**Skill:** product-converted `notion-cdc` (text-primary SKILL.md)  
**Date:** 2026-07-12 (rebench after product fix)

## Product fixes applied

1. **Text is always the installed hot path** - `writeImageSkill` no longer overwrites `SKILL.md` with an optical pointer. Optical pages are a sidecar (`SKILL.optical.md` + `.cdc.png`).
2. **pageTool excludes writes** - `API-patch-block-children` is never the `callPaged` example; prefers `API-post-search` / list / query.
3. **Anti-recon rules** - SKILL forbids `cat`/`sed`/`rg` of `mcp-call.js` (black-box require only).

## Results (this rebench)

| arm | tokens | wall (s) | tool path | answer |
|-----|-------:|---------:|-----------|--------|
| **MCP** | **19,243** | **20** | connected Notion MCP tools | correct |
| **CDC** | **9,819** | **33** | `notion-cdc` text skill + bridge | correct |

## Ratios

| | |
|--|--|
| CDC / MCP tokens | **0.51x** (**49% under MCP**) |
| MCP / CDC tokens | **1.96x** |
| CDC wall | 33s (~1.65x MCP wall; still slower wall, much better tokens) |

## vs previous broken product path (optical SKILL primary)

| arm | before (optical thrash) | after (text-primary) | delta |
|-----|------------------------:|---------------------:|------:|
| MCP tokens | 20,414 | 19,243 | ~same |
| CDC tokens | **33,614** | **9,819** | **-70.8%** |
| CDC wall | 69s | 33s | **~-52%** |
| CDC vs MCP | +64.7% worse | **-49% better** | flipped |

## Same answers (both correct)

```json
{
  "stacksnap_titles": ["stacksnap", "stacksnap_checklist", "stacksnap_FULL_PLAN"],
  "stacksnap_count": 3,
  "plan_title": "stacksnap_FULL_PLAN",
  "plan_heading": "StackSnap Product Plan",
  "bot_name": "test",
  "workspace_name": "D0jsG Khatib's Workspace"
}
```

(MCP arm sorted titles with FULL_PLAN before checklist; same set.)

## How each ran

| | MCP | CDC |
|--|-----|-----|
| Config | `mcp_servers.notion` -> `notion-mcp.sh` | no MCP; skill at `CODEX_HOME/skills/notion-cdc` |
| Calls | `API-get-self`, `API-post-search`, `API-retrieve-page-markdown` | `sed SKILL.md` once -> openSession multi-hop (one field retry) |
| Skill body | n/a | **text SKILL.md** (not optical pointer) |
| pageTool example | n/a | `API-post-search` (not patch-block-children) |

## Honest note

This is the **product Codex-using-skill** path (discover skill + write shell script), **not** the harness full-skill inject path. After text-primary install + write-safe pageTool + anti-recon rules, **CDC wins on tokens** for this multi-hop Notion task. Wall is still higher than MCP (script composition + one retry), but no longer the 5x thrash of the optical path.

## Logs

- `implementer/notion-live/logs/ab-mcp-v3.log` (wall: `ab-mcp-v3.wall`)
- `implementer/notion-live/logs/ab-cdc-v3.log` (wall: `ab-cdc-v3.wall`)
- Prior broken run: `ab-mcp.log` / `ab-cdc.log`

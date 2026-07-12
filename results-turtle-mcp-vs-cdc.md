# turtle-canvas A/B — Codex MCP vs product CDC skill

**Model:** `gpt-5.6-sol` · reasoning `medium`  
**Date:** 2026-07-12  
**Task:** draw house (base, roof, door, sun, "home" label) on canvas `house` (500x400)  
**Skill:** product `cdc from-mcp` convert only (not hand-written)

## Definition tax (convert-time)

| | tokens |
|--|-------:|
| MCP tools/list schemas (est.) | ~3,399 |
| CDC hot SKILL.md | **795** (4.3x smaller) |

## Runtime A/B (product Codex path)

| arm | tokens | wall (s) | structure on `house` | notes |
|-----|-------:|---------:|---------------------:|-------|
| **MCP** | **13,708** | **26** | **4/5 PASS** | `canvas_new` + 2x `turtle_batch` + snapshots |
| **CDC** | **13,206** | **42** | **0/5 FAIL** | drew full house on default `main` (13 strokes); `house` empty |

## Ratios

| | |
|--|--|
| CDC / MCP tokens | **0.963x** (-3.7% vs MCP) |
| MCP / CDC tokens | **1.038x** |
| CDC wall | 42s (~1.62x MCP) |

## Canvas artifacts

### MCP (`canvases-mcp/house.svg`) — PASS
- strokes: 5 · byType: `{'poly': 3, 'text': 1, 'circle': 1}`
- base/roof/door as polys, sun circle, text label

### CDC (`canvases-cdc/`)
- **`house.svg`**: empty (0 strokes) — agent claimed has_* true but snapshot showed strokeCount 0
- **`main.svg`**: **PASS** structure 5/5 — lines+circle+text (house drawn on wrong canvas name)

## How each ran

| | MCP | CDC |
|--|-----|-----|
| Config | `mcp_servers.turtle` → wrapper + `canvases-mcp` | no MCP; skill `turtle-cdc` + bridge → `canvases-cdc` |
| Path | native MCP tools | sed SKILL.md → ONE openSession Node script |
| Who converted skill | n/a | **product** `node bin/cdc.js from-mcp --probe` |

## Honest read

- **Tokens:** CDC slightly under MCP (~3.7%) on this small 27-tool surface — definition tax savings are modest vs Notion-scale schemas.
- **Correctness:** MCP hit the requested canvas name. CDC **drew successfully** but **wrong default canvas** (`main` not `house`) ��� product-path scripting bug, not missing draw capability.
- **Wall:** MCP faster (26s vs 42s); CDC paid skill load + script composition.

## Logs / files

- logs: `implementer/turtle-canvas/bench/logs/ab-mcp.log`, `ab-cdc.log`
- SVGs: `implementer/turtle-canvas/bench/canvases-mcp/house.svg`, `.../canvases-cdc/main.svg`
- scored: `implementer/turtle-canvas/bench/results/scored.json`

# Memory MCP A/B — Codex gpt-5.6-luna

**MCP:** `@modelcontextprotocol/server-memory` (knowledge graph, 9 tools)  
**Fixture:** seeded graph 35 entities / 56 relations (`/tmp/codex-bench-mem/fixture/memory.jsonl`)  
**Model:** gpt-5.6-luna · Codex 0.144.1  
**Date:** 2026-07-11  

Something different from filesystem / GitHub-auth / Playwright: a **stateful knowledge-graph MCP** with multi-field aggregation over entities + relations.

Protocol (same as other benches): wipe skills → park globals → MCP → MAKE → USE only remade skill.

Logs: `/tmp/codex-bench-mem/out/{mcp,make,use}.log`

## Scoreboard

| Arm | Wall | Tokens | Correct | Purity |
|---|---:|---:|---:|---|
| **MCP** | **21s** | **14,629** | **12/12** | Clean ��� 2× `read_graph` only |
| **MAKE** | **67s** | **42,073** | skill gen | Agent shortcut (see below) |
| **USE CDC** | **66s** | **13,718** | **12/12** | Pure bridge — no curl / no raw file |

| Ratio | Value |
|---|---:|
| USE/MCP tokens | **0.94×** (slightly cheaper) |
| USE/MCP wall | **3.1×** slower |

## Truth (all matched both arms)

| field | value |
|---|---|
| entity_count | 35 |
| relation_count | 56 |
| person_count | 20 |
| company_count | 5 |
| rust_skilled_people | Ava Chen, Fay Ng, Noa Vale |
| remote_people | Dan Wu, Omar Diaz, Quinn Ames, Rae Cole |
| highest_salary_person | Hana Sol |
| highest_salary | 220000 |
| harbor_engineers | Max Reed, Noa Vale, Omar Diaz |
| works_at_relation_count | 20 |
| largest_company_by_employees | Cedar Health |
| largest_company_employees | 210 |

## What each arm did

### MCP
- 2× `memory/read_graph` (redundant second call)
- Aggregated in-model from tool payload → perfect JSON
- Fast and clean

### MAKE (important defect)
Agent did **not** use live probe of the harness server first. Path taken:
1. Tried config lookup → missed `CODEX_HOME` memory server
2. Fell back to hand-building `memory-tools.json` from MCP tool defs it already saw
3. Ran `from-mcp --name memory --file memory-tools.json --target auto`

Result of that install:
- 9 tools, ~727 skill tokens, 1.8× vs that thin file
- **`mcp-manifest.json` had `"command": null`** — skill could not spawn the server

For USE we **re-ran the generator with `--probe /tmp/codex-bench-mem/memory-mcp.sh`** (harness fix, not agent). Probed skill:
- command → wrapper script with `MEMORY_FILE_PATH` set
- compression **7×** vs live tools/list schemas (5082 → 727 skill tokens)

**Honest flag:** the MAKE arm’s skill as the agent left it was **broken for runtime**. Report USE numbers are for the probe-fixed skill (same tool surface, working launch).

### USE
- Multiple `openSession` + `read_graph` via bridge
- One wrong require path (`/tmp/codex-bench-mem/mcp-call.js`) then recovery
- Final script aggregated fully in Node → exact truth
- **No** reading `memory.jsonl` via shell; pure CDC bridge

## vs other benches

| MCP type | USE vs MCP tokens | USE vs MCP speed | Notes |
|---|---|---|---|
| Filesystem large (8k orders) | USE **~8× cheaper** | USE faster | Big payload win |
| GitHub auth mini | USE **~4× cheaper** | USE faster | Network + multi call |
| Playwright store page | USE contaminated / MCP cleaner | MCP faster | Short browser path |
| **Memory graph (this)** | USE **~6% cheaper** | **MCP 3× faster** | Small payload; bridge thrash |

## Honest takeaways

1. **Both correct 12/12** on a multi-metric knowledge-graph query.
2. **MCP wins on wall clock** here ��� graph fits in one `read_graph`; connected tools are already efficient.
3. **USE is only slightly cheaper** on tokens; skill overhead + path thrash eats the definition-tax win when the MCP schema is already small (9 tools).
4. **MAKE quality bug:** `--file` without probe produces a skill with `command: null`. Creator should refuse install when launch command is missing, or require `--probe` / config name for MCP mode.
5. **Harness discovery gap** again: creator config scan does not see `CODEX_HOME`-only MCP servers → agents invent workarounds.
6. Memory MCP is a **weak CDC showcase** at this graph size. It would get more interesting with a much larger graph where dumping `read_graph` into context hurts MCP, and CDC aggregates in-process.

## Artifacts

| Path | Role |
|---|---|
| `/tmp/codex-bench-mem/` | Harness |
| `…/fixture/memory.jsonl` | Seed graph |
| `…/make-home/skills/memory-cdc/` | Probe-fixed skill |
| `…/out/*.log` | Arm logs |
| `…/truth.json` | Ground truth |

Parked personal skills restored. No `memory-cdc` left in global skill dirs (bench-only).

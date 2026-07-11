# Live Codex A/B: MCP-on vs CDC skill-only (MCP disabled)

**Model:** `gpt-5.6-luna` · **Date:** 2026-07-11  
**Question:** After converting an MCP to a CDC skill and *disabling* the MCP, does the user notice fewer tokens (and a workable path)?

## Setup

Isolated `CODEX_HOME` per arm (`implementer/mega20/homes/<id>/{mcp,use}-home`):

| Arm | Config |
|---|---|
| **MCP** | Connected MCP server only (no skill) |
| **USE** | CDC skill only - **no MCP server in config** (skill-only, daemon pre-warmed) |

Skills rebuilt with the post-mega20 converter:

| Package | Tier | Skill tokens | MCP schema tokens | Definition ratio |
|---|---|---|---|---|
| **calc-cdc** | `cli` | 366 | 378 | ~1.0x (session win, not dump size) |
| **tradingview-cdc** | `multi` | 893 | 9692 | **10.9x** smaller definition tax |

Also fixed install paths so dirs containing `;` are shell-quoted (`node '/path/with;semi/mcp-call.js'`).

## Results (perfect accuracy both arms)

| Target | MCP tokens | MCP wall | MCP score | USE tokens | USE wall | USE score | **USE/MCP tok** | USE/MCP wall |
|---|---:|---:|---|---:|---:|---|---:|---:|
| **calc** | 15,447 | 10s | 6/6 | **7,097** | 17s | 6/6 | **0.46x** (-54%) | 1.70x |
| **tradingview** | 15,846 | 18s | 5/5 | **10,034** | 27s | 5/5 | **0.63x** (-37%) | 1.50x |

Prior mega-20 (old skills, thrashy templates): calc USE was **16,770** tok / 17s vs MCP 20,180 - only mild savings.  
After CLI-first skill: calc USE **7,097** - **~2.4x fewer tokens than the old USE path**.

### Path purity (USE)

| Target | Path taken |
|---|---|
| **calc** | One `mcp-call.js --batch` with all four tools -> single JSON answer. No MCP tool calls. |
| **tradingview** | Skill + tool name list -> `--batch` for gainers/sentiment/coin_analysis. No connected MCP. Still some CDC.md greps for arg shapes (room to tighten). |

## What the user should notice

1. **Token bill drops hard** once MCP is off: calc ~half the tokens; fat tradingview ~37% fewer.
2. **Definition tax** on fat servers is the structural win (tradingview schemas 9.7k -> skill 0.9k).
3. **Wall clock is not yet the win** on these short tasks (USE still slower by ~1.5-1.7x): Codex pays a skill-read + shell turn; MCP is already warm in-process. Speed wins show up more on multi-step / multi-page / fat-schema tasks (see paper + github mega-20: USE 0.12x tokens and faster wall).
4. **If MCP stays connected, you will not feel this.** Schema tax + skill tax stack.

## Product takeaway

Convert UX is correct: **install skill -> disable MCP -> use skill**. Live numbers now back the "way less tokens" claim for both a mini (`cli` tier) and a fat multi-tool server.

### Remaining speed work (not required for token win)

- Prefer batch over multi-step scripts more aggressively in prompts
- Inline required arg hints for top tools so agents skip CDC greps
- Keep daemon pre-warm (already on at convert/install)

## Reproduce

```bash
cd implementer/mega20
ONLY=calc,tradingview PHASE=setup node run-mega20.js
ONLY=calc,tradingview PHASE=prebuild node run-mega20.js
ONLY=calc,tradingview PHASE=mcp PARALLEL=2 node run-mega20.js
ONLY=calc,tradingview PHASE=use PARALLEL=2 node run-mega20.js
ONLY=calc,tradingview PHASE=score node run-mega20.js
# results: results/scored.json
```

Raw logs: `homes/{calc,tradingview}/out/{mcp,use}.log`

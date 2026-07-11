# Live Codex A/B: gpt-5.6-sol (MCP-on vs CDC skill-only)

**Model:** `gpt-5.6-sol` (confirmed in logs)  
**Date:** 2026-07-11  
**Arms:** same harness as luna feel-ab - isolated `CODEX_HOME`, MCP connected vs skill-only (MCP disabled), daemon pre-warmed.

## Results (perfect accuracy both arms)

| Target | MCP tokens | MCP wall | MCP score | USE tokens | USE wall | USE score | **USE/MCP tok** | USE/MCP wall |
|---|---:|---:|---|---:|---:|---|---:|---:|
| **calc** | 17,232 | 16s | 6/6 | **7,348** | **14s** | 6/6 | **0.43x (-57%)** | **0.88x (faster)** |
| **tradingview** | 13,827 | 19s | 5/5 | 17,301 | 21s | 5/5 | 1.25x (+25%) | 1.11x |

### Path notes

| Target | What happened |
|---|---|
| **calc USE** | One `mcp-call.js --batch` for add/mul/pow/stats -> clean JSON. **Tokens and wall both win.** |
| **calc MCP** | 8 MCP tool round-trips (per-call pattern). |
| **tradingview MCP** | Sol was very efficient: ~2 MCP tool calls, low session tokens. |
| **tradingview USE** | Read skill -> list tools via bridge -> `top_gainers` (fat payload). Correct, but payload + skill turns cost more than Sol's lean MCP path on this short task. |

## Sol vs Luna (same tasks, same skills)

| Target | Metric | Luna USE/MCP | Sol USE/MCP | Winner for CDC feel |
|---|---|---:|---:|---|
| **calc** | tokens | 0.46x | **0.43x** | both clear; Sol slightly better |
| **calc** | wall | 1.70x (USE slower) | **0.88x (USE faster)** | **Sol** - first live wall win |
| **tradingview** | tokens | **0.63x** | 1.25x | **Luna** felt the win; Sol MCP was already cheap |
| **tradingview** | wall | 1.50x | 1.11x | Sol closer |

Luna reference (prior run, same converter skills):

| Target | MCP tok | USE tok | USE/MCP |
|---|---:|---:|---:|
| calc | 15,447 | 7,097 | 0.46x |
| tradingview | 15,846 | 10,034 | 0.63x |

## Takeaways

1. **On Sol + calc (CLI-tier skill), the convert win is obvious:** ~57% fewer tokens **and** slightly faster wall.
2. **Fat MCP on Sol can already be cheap** when the model makes few tool calls (TV MCP 13.8k with 2 calls). CDC still wins definition tax (9.7k schemas -> 0.9k skill) but short single-shot tasks may not show session-token savings if USE dumps a fat tool payload.
3. **Disable MCP still required** for the product story - stacking both hides the win either model.
4. Sol is a **better demo model for mini CLI skills** (calc); Luna showed the fat-schema token win more cleanly on tradingview in this sample.

## Artifacts

- Scored: `implementer/mega20/results/sol/scored-sol.json`
- Logs: `implementer/mega20/homes/{calc,tradingview}/out/{mcp,use}.log`
- Run logs: `implementer/mega20/logs/sol-mcp.log`, `sol-use.log`

## Reproduce

```bash
cd implementer/mega20
export CODEX_MODEL=gpt-5.6-sol
ONLY=calc,tradingview PHASE=setup node run-mega20.js
ONLY=calc,tradingview PHASE=prebuild node run-mega20.js
ONLY=calc,tradingview PHASE=mcp PARALLEL=2 node run-mega20.js
ONLY=calc,tradingview PHASE=use PARALLEL=2 node run-mega20.js
ONLY=calc,tradingview PHASE=score node run-mega20.js
```

# mega40 three-arm benchmark (MCP vs text CDC vs image .cdc)

**Model:** `gpt-5.6-sol`  
**When:** 2026-07-11T17:01:32.853Z  
**Targets:** 5 / 40  
**Image skill is MAIN** (default compile path)

## Aggregate

| arm | n | avg tokens | avg wall (s) | accuracy |
|-----|---|------------|--------------|----------|
| MCP | 5 | 21325 | 26.2 | 31/31 (100%) |
| text CDC | 5 | 14370 | 38 | 31/31 (100%) |
| **image .cdc** | 5 | 13750 | 35.6 | 31/31 (100%) |

### Overall ratios (avg tokens)
| | |
|--|--|
| MCP / text | 1.48 |
| MCP / image | 1.55 |
| text / image | 1.05 |
| image vs text savings | 4.3% |

## Per-target

| target | mcp tok | text tok | image tok | mcp score | text score | image score | img vs text % |
|--------|---------|----------|-----------|-----------|------------|-------------|---------------|
| playwright | 18208 | 22243 | 11173 | 7/7 | 7/7 | 7/7 | 49.8% |
| github | 18804 | 12080 | 8357 | 5/5 | 5/5 | 5/5 | 30.8% |
| mockapi | 23950 | 9406 | 18918 | 5/5 | 5/5 | 5/5 | -101.1% |
| complex | 27022 | 19434 | 15040 | 7/7 | 7/7 | 7/7 | 22.6% |
| nova | 18643 | 8686 | 15262 | 7/7 | 7/7 | 7/7 | -75.7% |

## Hard multi-system MCPs

- **complex** (acme-ops ~47 tools) - P1 SLA breaches
- **nova** (nova-fleet ~48 tools) - SEV1 SLO + MRR at risk

## How to re-run

```bash
CODEX_MODEL=gpt-5.6-sol PHASE=all PARALLEL=2 node implementer/mega40/run-mega40.js
# stepwise: setup | prebuild | mcp | text | image | score
# subset: ONLY=nova,complex,calc PHASE=all
```

## Files
- targets: `implementer/mega40/targets.json` (40)
- scored: `implementer/mega40/results/scored.json`
- nova server: `implementer/mega40/bin/nova-complex-mcp.js`

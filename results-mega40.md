# mega40 three-arm benchmark (MCP vs text CDC vs image .cdc)

**Model:** `gpt-5.6-sol`  
**When:** 2026-07-12T12:39:07.889Z  
**Targets:** 40 / 40  
**Image skill is MAIN** (default compile path)

## Aggregate

| arm | n | avg tokens | avg wall (s) | accuracy |
|-----|---|------------|--------------|----------|
| MCP | 40 | 13194 | 17.9 | 153/155 (98.7%) |
| text CDC | 40 | 8487 | 15.8 | 120/155 (77.4%) |
| **image .cdc** | 40 | 9372 | 24.1 | 128/155 (82.6%) |

### Overall ratios (avg tokens)
| | |
|--|--|
| MCP / text | 1.55 |
| MCP / image | 1.41 |
| text / image | 0.91 |
| image vs text savings | -10.4% |
| **text under MCP %** | 35.7% |
| **image under MCP %** | 29.0% |

## Per-target

| target | mcp tok | text tok | image tok | mcp score | text score | image score | img vs text % |
|--------|---------|----------|-----------|-----------|------------|-------------|---------------|
| everything | 18313 | 8144 | 10006 | 5/5 | 4/5 | 4/5 | -22.9% |
| memory | 14219 | 9578 | 13460 | 7/7 | 4/7 | 7/7 | -40.5% |
| filesystem | 16247 | 11778 | 5578 | 5/5 | 3/5 | 0/5 | 52.6% |
| sequential | 6275 | 7321 | 7090 | 3/3 | 2/3 | 2/3 | 3.2% |
| sqlite | 8427 | 8731 | 17486 | 5/5 | 0/5 | 0/5 | -100.3% |
| playwright | 31041 | 6099 | 7436 | 7/7 | 0/7 | 7/7 | -21.9% |
| puppeteer | 18546 | 8906 | 7072 | 5/5 | 4/5 | 5/5 | 20.6% |
| context7 | 13300 | 8639 | 7643 | 3/3 | 2/3 | 3/3 | 11.5% |
| git | 18672 | 2769 | 10047 | 4/4 | 0/4 | 4/4 | -262.8% |
| time | 15624 | 8357 | 7433 | 3/3 | 0/3 | 3/3 | 11.1% |
| fetch | 17653 | 7943 | 5179 | 3/3 | 3/3 | 3/3 | 34.8% |
| tradingview | 13821 | 18514 | 10132 | 5/5 | 4/5 | 4/5 | 45.3% |
| github | 18760 | 10643 | 12521 | 5/5 | 5/5 | 5/5 | -17.6% |
| calc | 19197 | 8024 | 5400 | 6/6 | 6/6 | 6/6 | 32.7% |
| weather | 8312 | 2958 | 6498 | 4/4 | 4/4 | 4/4 | -119.7% |
| jsonstore | 5762 | 7351 | 19479 | 4/4 | 4/4 | 4/4 | -165% |
| todo | 10804 | 8316 | 7067 | 3/3 | 3/3 | 0/3 | 15% |
| mockapi | 43782 | 8441 | 21475 | 5/5 | 5/5 | 5/5 | -154.4% |
| chromedevtools | 16887 | 15489 | 15843 | 3/3 | 0/3 | 0/3 | -2.3% |
| filesystem_large | 16117 | 9218 | 5576 | 3/3 | 2/3 | 0/3 | 39.5% |
| complex | 24135 | 10504 | 26271 | 7/7 | 7/7 | 7/7 | -150.1% |
| nova | 25317 | 9994 | 23656 | 7/7 | 7/7 | 7/7 | -136.7% |
| stringops | 8674 | 7396 | 15092 | 4/4 | 4/4 | 4/4 | -104.1% |
| unitconvert | 5920 | 8077 | 6233 | 4/4 | 4/4 | 4/4 | 22.8% |
| graph | 10115 | 8021 | 6233 | 4/4 | 4/4 | 4/4 | 22.3% |
| kv | 14658 | 7298 | 7182 | 3/3 | 3/3 | 3/3 | 1.6% |
| counter | 6391 | 7348 | 6276 | 2/2 | 2/2 | 1/2 | 14.6% |
| hash | 12999 | 14231 | 5998 | 3/3 | 3/3 | 3/3 | 57.9% |
| books | 8199 | 9175 | 5202 | 3/3 | 3/3 | 3/3 | 43.3% |
| inventory | 11619 | 9377 | 5207 | 4/4 | 4/4 | 4/4 | 44.5% |
| queue | 6213 | 7997 | 5847 | 2/2 | 2/2 | 0/2 | 26.9% |
| flags | 5994 | 7311 | 6040 | 3/3 | 3/3 | 3/3 | 17.4% |
| geo | 5633 | 7291 | 5026 | 2/2 | 2/2 | 2/2 | 31.1% |
| regex | 9861 | 7982 | 6225 | 2/3 | 2/3 | 2/3 | 22% |
| csvops | 10261 | 8087 | 5025 | 2/2 | 2/2 | 2/2 | 37.9% |
| cronish | 5488 | 7419 | 6090 | 2/2 | 2/2 | 2/2 | 17.9% |
| uuidgen | 6174 | 7504 | 9641 | 2/3 | 2/3 | 2/3 | -28.5% |
| mathstat | 7013 | 2794 | 6067 | 3/3 | 3/3 | 3/3 | -117.1% |
| dateops | 5602 | 7345 | 6268 | 3/3 | 3/3 | 3/3 | 14.7% |
| cache | 5723 | 7115 | 8873 | 3/3 | 3/3 | 3/3 | -24.7% |

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

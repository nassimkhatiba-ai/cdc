# mega40 three-arm benchmark (MCP vs text CDC vs image .cdc)

**Model:** `gpt-5.6-sol`  
**When:** 2026-07-11T14:47:58.646Z  
**Targets:** 40 / 40  
**Image skill is MAIN** (default compile path)

## Aggregate

| arm | n | avg tokens | avg wall (s) | accuracy |
|-----|---|------------|--------------|----------|
| MCP | 40 | 13324 | 17.8 | 152/155 (98.1%) |
| text CDC | 40 | 8423 | 21.4 | 137/155 (88.4%) |
| **image .cdc** | 40 | 10167 | 18.1 | 127/155 (81.9%) |

### Overall ratios (avg tokens)
| | |
|--|--|
| MCP / text | 1.58 |
| MCP / image | 1.31 |
| text / image | 0.83 |
| image vs text savings | -20.7% |

## Per-target

| target | mcp tok | text tok | image tok | mcp score | text score | image score | img vs text % |
|--------|---------|----------|-----------|-----------|------------|-------------|---------------|
| everything | 16952 | 9365 | 8012 | 5/5 | 4/5 | 4/5 | 14.4% |
| memory | 14354 | 14980 | 9139 | 7/7 | 7/7 | 7/7 | 39% |
| filesystem | 16310 | 10723 | 9869 | 5/5 | 3/5 | 0/5 | 8% |
| sequential | 7674 | 8776 | 6954 | 3/3 | 2/3 | 2/3 | 20.8% |
| sqlite | 12618 | 10955 | 9843 | 5/5 | 0/5 | 4/5 | 10.2% |
| playwright | 18208 | 22243 | 11805 | 7/7 | 7/7 | 6/7 | 46.9% |
| puppeteer | 31727 | 7329 | 9461 | 5/5 | 5/5 | 4/5 | -29.1% |
| context7 | 8267 | 11063 | 7519 | 3/3 | 0/3 | 3/3 | 32% |
| git | 17635 | 11251 | 9943 | 4/4 | 4/4 | 3/4 | 11.6% |
| time | 15462 | 6159 | 11351 | 3/3 | 3/3 | 3/3 | -84.3% |
| fetch | 15691 | 8601 | 6834 | 3/3 | 3/3 | 3/3 | 20.5% |
| tradingview | 24909 | 13422 | 16644 | 5/5 | 5/5 | 5/5 | -24% |
| github | 18804 | 12080 | 37571 | 5/5 | 5/5 | 5/5 | -211% |
| calc | 17570 | 8671 | 7323 | 6/6 | 6/6 | 6/6 | 15.5% |
| weather | 9319 | 8534 | 7390 | 4/4 | 4/4 | 4/4 | 13.4% |
| jsonstore | 5757 | 13712 | 7423 | 4/4 | 4/4 | 4/4 | 45.9% |
| todo | 7103 | 11132 | 9402 | 3/3 | 3/3 | 0/3 | 15.5% |
| mockapi | 23950 | 9406 | 19996 | 5/5 | 5/5 | 5/5 | -112.6% |
| chromedevtools | 16162 | 10736 | 30463 | 3/3 | 0/3 | 0/3 | -183.7% |
| filesystem_large | 8838 | 10164 | 14468 | 3/3 | 3/3 | 0/3 | -42.3% |
| complex | 27022 | 19434 | 12615 | 7/7 | 7/7 | 7/7 | 35.1% |
| nova | 18643 | 8686 | 12883 | 7/7 | 7/7 | 7/7 | -48.3% |
| stringops | 16276 | 3423 | 7188 | 4/4 | 4/4 | 4/4 | -110% |
| unitconvert | 5877 | 3608 | 7060 | 4/4 | 4/4 | 0/4 | -95.7% |
| graph | 10127 | 8650 | 6619 | 4/4 | 4/4 | 4/4 | 23.5% |
| kv | 15796 | 8576 | 6364 | 3/3 | 3/3 | 3/3 | 25.8% |
| counter | 10465 | 3432 | 7350 | 2/2 | 2/2 | 1/2 | -114.2% |
| hash | 11594 | 3433 | 7158 | 3/3 | 3/3 | 3/3 | -108.5% |
| books | 15590 | 3916 | 7662 | 3/3 | 3/3 | 3/3 | -95.7% |
| inventory | 9203 | 3609 | 6931 | 3/4 | 3/4 | 3/4 | -92% |
| queue | 11991 | 3312 | 7100 | 2/2 | 2/2 | 2/2 | -114.4% |
| flags | 7327 | 9505 | 11824 | 3/3 | 3/3 | 3/3 | -24.4% |
| geo | 5779 | 3481 | 6665 | 2/2 | 2/2 | 2/2 | -91.5% |
| regex | 7816 | 8632 | 6335 | 2/3 | 2/3 | 2/3 | 26.6% |
| csvops | 5629 | 3537 | 6477 | 2/2 | 2/2 | 2/2 | -83.1% |
| cronish | 5590 | 3476 | 6564 | 2/2 | 2/2 | 2/2 | -88.8% |
| uuidgen | 7012 | 3517 | 7509 | 2/3 | 2/3 | 2/3 | -113.5% |
| mathstat | 19260 | 8524 | 7217 | 3/3 | 3/3 | 3/3 | 15.3% |
| dateops | 5777 | 3572 | 6637 | 3/3 | 3/3 | 3/3 | -85.8% |
| cache | 8875 | 3284 | 7111 | 3/3 | 3/3 | 3/3 | -116.5% |



## Analysis

### Headline
- **Text CDC is the best average token path** on this 40-server mix: **8.4k** avg vs MCP **13.3k** (1.58x) and image **10.2k**.
- **Image .cdc wins hard multi-system tasks** where definition tax dominates:
  - **complex**: MCP 27.0k → text 19.4k → **image 12.6k** (all **7/7**, image 2.1× under MCP, 35% under text, wall 46s→23s)
  - **nova** (new SEV1 fleet MCP): MCP 18.6k → **text 8.7k**  image 12.9k (all **7/7**)
- **Image has a vision floor** (~6–8k) that hurts tiny skills (stringops/hash/queue/cache…): text ~3.3–3.5k, image ~7k. That pulls the overall average against image.
- Accuracy: MCP **98.1%** > text **88.4%** > image **81.9%** (some image/browser failures: filesystem, chromedevtools, unitconvert, todo).

### Where image beats text (tokens)
18 / 40 targets. Notable: complex (−35%), memory (−39%), playwright (−47%), jsonstore (−46%), context7 (−32%), calc (−16%), everything (−14%).

### Where text beats image (tokens)
22 / 40 — mostly small local MCPs (stringops, books, hash, queue, cache, geo…) and a few fat vision outliers (github image 37.6k, chromedevtools 30.5k).

### Hard multi-system (perfect accuracy all arms)
| target | mcp tok | text tok | image tok | image vs text | wall mcp/text/image |
|--------|---------|----------|-----------|---------------|---------------------|
| complex | 27022 | 19434 | 12615 | 35% better | 46/33/23 |
| nova | 18643 | 8686 | 12883 | text better | 22/50/38 |

### Product takeaway
1. **Image skill is MAIN** in the convert pipeline (default `.cdc.png` + pointer `SKILL.md`).
2. **Routing rule** (recommended): use **image** when tool surface is fat / multi-hop (definition tax >> vision floor); use **text** when skill body is already short (<~2–3k tokens).
3. New **nova-fleet-complex** MCP (~48 tools) validates multi-hop SEV1/SLO/MRR scoring end-to-end on all three arms at **7/7**.

Perfect accuracy on all three arms: **24/40** (memory, time, fetch, tradingview, github, calc, weather, jsonstore, mockapi, complex, nova, stringops, graph, kv, hash, books, queue, flags, geo, csvops, cronish, mathstat, dateops, cache).

## Hard multi-system MCPs

- **complex** (acme-ops ~47 tools) — P1 SLA breaches
- **nova** (nova-fleet ~48 tools) — SEV1 SLO + MRR at risk

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

# mega40 optical v2 full suite

**Model:** `gpt-5.6-sol`  
**When:** 2026-07-11T19:22:15.307Z  
**Targets:** 40  
**Image arm:** forced optical pack (`--mode image`, tile-budgeted dense DSL)  
**Auto column:** post-hoc pick text vs image using pack `imagePrimary` (convert-time router)

## Aggregate

| arm | n | avg tokens | avg wall (s) | accuracy |
|-----|---|------------|--------------|----------|
| MCP | 40 | 13167 | 17.8 | 152/155 (98.1%) |
| text CDC | 40 | 9158 | 20.1 | 130/155 (83.9%) |
| image optical v2 | 40 | 9170 | 23.4 | 129/155 (83.2%) |
| **auto (routed)** | 40 | 9393 | 24.1 | 134/155 (86.5%) |

Auto mix: 38 image / 2 text.

### Ratios (avg tokens)
| | |
|--|--|
| MCP / text | 1.44 |
| MCP / image | 1.44 |
| text / image | 1.00 |
| MCP / auto | 1.40 |
| auto vs text savings | -2.6% |

## Per-target

| target | mcp | text | image | auto | mcp score | text score | image score | pack vision | pages |
|--------|----:|-----:|------:|------|-----------|------------|-------------|------------:|------:|
| everything | 18206 | 9454 | 10006 | image 10006 | 5/5 | 4/5 | 4/5 | 425 | 1 |
| memory | 13245 | 16156 | 13460 | image 13460 | 7/7 | 7/7 | 7/7 | 425 | 1 |
| filesystem | 16415 | 10333 | 5578 | text 10333 | 5/5 | 3/5 | 0/5 | - | - |
| sequential | 10625 | 8707 | 7090 | image 7090 | 3/3 | 2/3 | 2/3 | 255 | 1 |
| sqlite | 12417 | 15564 | 17486 | image 17486 | 5/5 | 0/5 | 0/5 | 255 | 1 |
| playwright | 19134 | 13963 | 12502 | image 12502 | 7/7 | 0/7 | 7/7 | 595 | 1 |
| puppeteer | 18357 | 11051 | 7072 | image 7072 | 5/5 | 4/5 | 5/5 | 425 | 1 |
| context7 | 11281 | 10961 | 7643 | image 7643 | 3/3 | 3/3 | 3/3 | 255 | 1 |
| git | 17413 | 10911 | 10047 | image 10047 | 3/4 | 3/4 | 4/4 | 425 | 1 |
| time | 15600 | 9104 | 7433 | image 7433 | 3/3 | 3/3 | 3/3 | 255 | 1 |
| fetch | 15623 | 8639 | 5179 | image 5179 | 3/3 | 3/3 | 3/3 | 255 | 1 |
| tradingview | 14856 | 18420 | 25131 | image 25131 | 5/5 | 4/5 | 4/5 | 765 | 1 |
| github | 18772 | 8063 | 12521 | image 12521 | 5/5 | 5/5 | 5/5 | 425 | 1 |
| calc | 16078 | 13788 | 5400 | image 5400 | 6/6 | 6/6 | 6/6 | 255 | 1 |
| weather | 9360 | 8556 | 6498 | image 6498 | 4/4 | 4/4 | 4/4 | 255 | 1 |
| jsonstore | 5858 | 4493 | 19479 | image 19479 | 4/4 | 4/4 | 4/4 | 255 | 1 |
| todo | 6345 | 3945 | 7067 | image 7067 | 3/3 | 3/3 | 0/3 | 255 | 1 |
| mockapi | 23224 | 14465 | 21475 | image 21475 | 5/5 | 5/5 | 5/5 | 255 | 1 |
| chromedevtools | 14446 | 13600 | 10077 | image 10077 | 3/3 | 0/3 | 1/3 | 765 | 1 |
| filesystem_large | 9786 | 9766 | 5576 | text 9766 | 3/3 | 2/3 | 0/3 | - | - |
| complex | 22254 | 14158 | 17537 | image 17537 | 7/7 | 7/7 | 7/7 | 1020 | 2 |
| nova | 23578 | 7885 | 9998 | image 9998 | 7/7 | 7/7 | 7/7 | 765 | 1 |
| stringops | 16161 | 8547 | 15092 | image 15092 | 4/4 | 4/4 | 4/4 | 255 | 1 |
| unitconvert | 9965 | 8715 | 6233 | image 6233 | 4/4 | 4/4 | 4/4 | 255 | 1 |
| graph | 10209 | 8708 | 6233 | image 6233 | 4/4 | 4/4 | 4/4 | 255 | 1 |
| kv | 5837 | 8549 | 7182 | image 7182 | 3/3 | 3/3 | 3/3 | 255 | 1 |
| counter | 9244 | 8546 | 6276 | image 6276 | 2/2 | 2/2 | 1/2 | 255 | 1 |
| hash | 16063 | 8548 | 5998 | image 5998 | 3/3 | 3/3 | 3/3 | 255 | 1 |
| books | 8013 | 9069 | 5202 | image 5202 | 3/3 | 3/3 | 3/3 | 255 | 1 |
| inventory | 12723 | 4648 | 5207 | image 5207 | 4/4 | 4/4 | 4/4 | 255 | 1 |
| queue | 17073 | 8381 | 5847 | image 5847 | 2/2 | 2/2 | 0/2 | 255 | 1 |
| flags | 6110 | 3369 | 6040 | image 6040 | 3/3 | 3/3 | 3/3 | 255 | 1 |
| geo | 5658 | 8565 | 5026 | image 5026 | 2/2 | 2/2 | 2/2 | 255 | 1 |
| regex | 13778 | 4534 | 6225 | image 6225 | 2/3 | 2/3 | 2/3 | 255 | 1 |
| csvops | 10369 | 3584 | 5025 | image 5025 | 2/2 | 2/2 | 2/2 | 255 | 1 |
| cronish | 6532 | 4489 | 6090 | image 6090 | 2/2 | 2/2 | 2/2 | 255 | 1 |
| uuidgen | 16562 | 4594 | 9641 | image 9641 | 2/3 | 2/3 | 2/3 | 255 | 1 |
| mathstat | 8494 | 8534 | 6067 | image 6067 | 3/3 | 3/3 | 3/3 | 255 | 1 |
| dateops | 5706 | 4566 | 6268 | image 6268 | 3/3 | 3/3 | 3/3 | 255 | 1 |
| cache | 15304 | 8409 | 8873 | image 8873 | 3/3 | 3/3 | 3/3 | 255 | 1 |

## Hard multi-system

- **complex**: MCP 22254 tok / 37s / 7/7 · text 14158 tok / 37s / 7/7 · image 17537 tok / 31s / 7/7 · auto image 17537
- **nova**: MCP 23578 tok / 24s / 7/7 · text 7885 tok / 39s / 7/7 · image 9998 tok / 24s / 7/7 · auto image 9998

## Notes

- Optical packer: `lib/optical-pack.js` (tile budget, dense DSL, width ~504).
- Forced image arm measures packer quality; auto column is the product default story.
- Re-run: `CODEX_MODEL=gpt-5.6-sol PHASE=all PARALLEL=2 node implementer/mega40/run-mega40.js`
- Then: `node implementer/mega40/score-optical-v2-report.js`

## Files
- scored raw: `implementer/mega40/results/scored.json`
- this report: `implementer/mega40/results/results-mega40-optical-v2.md`

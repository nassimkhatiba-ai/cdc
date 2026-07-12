suite = 40 live MCP servers; model gpt-5.6-sol via Codex CLI; all arms same codex version same day; ground-truth scored
bare-agent floor = 3,454 tokens (mean of 3 no-op runs)
arms = MCP-connected vs CDC-auto (converted skills; router: 36 text / 4 image) vs CDC-hybrid (keep-MCP for <8-tool surfaces)

## 1. SYSTEMS

| system | total tokens | raw gain % | above-floor gain % | accuracy % | avg wall s |
|---|---:|---:|---:|---:|---:|
| MCP-only | 527748 | 0.0 | 0.0 | 98.3 | 17.85 |
| CDC-auto | 361869 | 45.8 | 74.1 | 82.3 | 17.225 |
| CDC-hybrid | 457450 | 15.4 | 22.0 | 89.4 | 19.125 |

## 2. TOOL-COUNT BANDS

| band | n | MCP avg tok | CDC-auto avg tok | raw gain % | above-floor gain % |
|---|---:|---:|---:|---:|---:|
| <8 | 30 | 11099 | 7913 | 40.3 | 71.4 |
| 8-19 | 5 | 16714 | 8297 | 101.4 | 173.8 |
| >=20 | 5 | 22240 | 16597 | 34.0 | 42.9 |

## 3. COST SPLIT

| metric | MCP | CDC-auto | gain% |
|---|---:|---:|---:|
| totalTokens | 527748 | 361869 | 45.8 |
| uncachedInput | 511607 | 341247 | 49.9 |
| output | 16141 | 20622 | -21.7 |
| costUnits | 788983.8 | 554397.4 | 42.3 |

Footnote: costUnits = uncached×1.0 + cached×0.1 + output×4.0

## 4. TOP 10 per-target gains

| id | mcpTok | autoArm | autoTok | gain% |
|---|---:|---|---:|---:|
| git | 18672 | text | 2769 | 574.3 |
| mockapi | 43782 | text | 8441 | 418.7 |
| playwright | 31041 | image | 7436 | 317.4 |
| weather | 8312 | text | 2958 | 181.0 |
| mathstat | 7013 | text | 2794 | 151.0 |
| calc | 19197 | text | 8024 | 139.2 |
| everything | 18313 | text | 8144 | 124.9 |
| fetch | 17653 | text | 7943 | 122.2 |
| puppeteer | 18546 | text | 8906 | 108.2 |
| kv | 14658 | text | 7298 | 100.8 |

## 5. BOTTOM 10 per-target gains

| id | mcpTok | autoArm | autoTok | gain% |
|---|---:|---|---:|---:|
| unitconvert | 5920 | text | 8077 | -26.7 |
| cronish | 5488 | text | 7419 | -26.0 |
| dateops | 5602 | text | 7345 | -23.7 |
| geo | 5633 | text | 7291 | -22.7 |
| queue | 6213 | text | 7997 | -22.3 |
| jsonstore | 5762 | text | 7351 | -21.6 |
| cache | 5723 | text | 7115 | -19.6 |
| flags | 5994 | text | 7311 | -18.0 |
| uuidgen | 6174 | text | 7504 | -17.7 |
| sequential | 6275 | text | 7321 | -14.3 |

## 6. ACCURACY LOSSES on CDC-auto

| id | mcpScore | autoScore | arm |
|---|---|---|---|
| chromedevtools | 3/3 | 0/3 | text |
| context7 | 3/3 | 2/3 | text |
| everything | 5/5 | 4/5 | text |
| filesystem | 5/5 | 3/5 | text |
| filesystem_large | 3/3 | 2/3 | text |
| git | 4/4 | 0/4 | text |
| memory | 7/7 | 4/7 | text |
| puppeteer | 5/5 | 4/5 | text |
| sequential | 3/3 | 2/3 | text |
| sqlite | 5/5 | 0/5 | text |
| time | 3/3 | 0/3 | text |
| tradingview | 5/5 | 4/5 | image |

## 7. APPENDIX — full 40-target table

| id | tools | mcpTok | autoArm | autoTok | mcpScore | autoScore |
|---|---:|---:|---|---:|---|---|
| everything | 13 | 18313 | text | 8144 | 5/5 | 4/5 |
| memory | 9 | 14219 | text | 9578 | 7/7 | 4/7 |
| filesystem | 14 | 16247 | text | 11778 | 5/5 | 3/5 |
| sequential | 1 | 6275 | text | 7321 | 3/3 | 2/3 |
| sqlite | 4 | 8427 | text | 8731 | 5/5 | 0/5 |
| playwright | 24 | 31041 | image | 7436 | 7/7 | 7/7 |
| puppeteer | 7 | 18546 | text | 8906 | 5/5 | 4/5 |
| context7 | 2 | 13300 | text | 8639 | 3/3 | 2/3 |
| git | 12 | 18672 | text | 2769 | 4/4 | 0/4 |
| time | 2 | 15624 | text | 8357 | 3/3 | 0/3 |
| fetch | 1 | 17653 | text | 7943 | 3/3 | 3/3 |
| tradingview | 27 | 13821 | image | 10132 | 5/5 | 4/5 |
| github | 5 | 18760 | text | 10643 | 5/5 | 5/5 |
| calc | 4 | 19197 | text | 8024 | 6/6 | 6/6 |
| weather | 3 | 8312 | text | 2958 | 4/4 | 4/4 |
| jsonstore | 5 | 5762 | text | 7351 | 4/4 | 4/4 |
| todo | 4 | 10804 | text | 8316 | 3/3 | 3/3 |
| mockapi | 5 | 43782 | text | 8441 | 5/5 | 5/5 |
| chromedevtools | 29 | 16887 | text | 15489 | 3/3 | 0/3 |
| filesystem_large | 14 | 16117 | text | 9218 | 3/3 | 2/3 |
| complex | 47 | 24135 | image | 26271 | 7/7 | 7/7 |
| nova | 48 | 25317 | image | 23656 | 7/7 | 7/7 |
| stringops | 5 | 8674 | text | 7396 | 4/4 | 4/4 |
| unitconvert | 5 | 5920 | text | 8077 | 4/4 | 4/4 |
| graph | 5 | 10115 | text | 8021 | 4/4 | 4/4 |
| kv | 5 | 14658 | text | 7298 | 3/3 | 3/3 |
| counter | 5 | 6391 | text | 7348 | 2/2 | 2/2 |
| hash | 4 | 12999 | text | 14231 | 3/3 | 3/3 |
| books | 5 | 8199 | text | 9175 | 3/3 | 3/3 |
| inventory | 5 | 11619 | text | 9377 | 4/4 | 4/4 |
| queue | 5 | 6213 | text | 7997 | 2/2 | 2/2 |
| flags | 4 | 5994 | text | 7311 | 3/3 | 3/3 |
| geo | 4 | 5633 | text | 7291 | 2/2 | 2/2 |
| regex | 4 | 9861 | text | 7982 | 2/3 | 2/3 |
| csvops | 4 | 10261 | text | 8087 | 2/2 | 2/2 |
| cronish | 4 | 5488 | text | 7419 | 2/2 | 2/2 |
| uuidgen | 4 | 6174 | text | 7504 | 2/3 | 2/3 |
| mathstat | 5 | 7013 | text | 2794 | 3/3 | 3/3 |
| dateops | 4 | 5602 | text | 7345 | 3/3 | 3/3 |
| cache | 4 | 5723 | text | 7115 | 3/3 | 3/3 |

## Caveats

Single-run per cell (observed variance ±30–50%).
Floor measured empirically (3,454 tokens; mean of 3 no-op runs).
Scores = exact-match vs ground truth.
Harness: implementer/mega40/.
Router decisions made at build time (no oracle).
Accuracy gap on CDC-auto is real and shown above.

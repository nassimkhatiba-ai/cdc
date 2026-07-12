# Grok-A mega40 text-CDC analysis

Suite optical-v2 avgs: MCP 13.2k / text 9.2k / image 9.2k. Tokens from run.json (=logs).

## 1) Eight focus targets

| id | mcpTok | textTok | dTok | turns | shells | skillSed | maxOutB | textScore | mcpScore |
|----|--------|---------|------|-------|--------|----------|---------|-----------|----------|
| memory | 13245 | 16156 | +2911 | 2 | 2 | 1 | 1879 | 7/7 | 7/7 |
| jsonstore | 5858 | 4493 | -1365 | 2 | 2 | 1 | 1105 | 4/4 | 4/4 |
| todo | 7092 | 7865 | +773 | 2 | 1 | 0 | 505 | 3/3 | 3/3 |
| flags | 6182 | 2021 | -4161 | 1 | 1 | 0 | 85 | 3/3 | 3/3 |
| sequential | 10625 | 8707 | -1918 | 2 | 2 | 1 | 1235 | 2/3 | 3/3 |
| context7 | 11281 | 10961 | -320 | 2 | 3 | 1 | 1998 | 3/3 | 3/3 |
| tradingview | 14856 | 18420 | +3564 | 2 | 2 | 1 | 10139 | 4/5 | 5/5 |
| filesystem_large | 9786 | 9766 | -20 | 3 | 3 | 1 | 1349 | 2/3 | 3/3 |

Where tokens went: skillSed 6/8; multi-shell 6/8; dump>2kB tradingview+context7; recon filesystem_large.
True losses: memory (+2911), tradingview (+3564). Near-tie: context7 (-320), filesystem_large (-20).
Wins mislisted: flags (-4161), jsonstore (-1365), sequential (-1918 tok, score 2/3). todo +773 this disk run.
MCP arms: 0 shell execs (native tools). Text pays shell transcript + skill body rebill.

## 2) Generic fixes (max 5)

1. Card-inject + ban SKILL sed -- evidence 6/8 sed; flags 2021 tok. Save 0.8-2k/target. Risk low.
2. Compact bridge stdout / no raw list dumps -- tradingview 10kB out. Save 1-4k. Risk medium (need --raw).
3. Multi-hop = ONE openSession for all tiers -- context7 3 shells. Save 1-3k + accuracy. Risk medium.
4. Shrink preamble + names-only fat index -- tradingview skill 5602B. Save 150-800 def tok. Risk low-med.
5. direct-fs snapshot or recon+compute one shell -- fs_large 3 shells. Save 1-2k. Risk low.

## 3) Auto router (40/40 probes OK)

image (5): playwright, tradingview, chromedevtools, complex, nova
text (35): all other targets. probe-failed: 0.
Policy: tools<20 => text; else image if (vision+160ptr+600prior) < textEquiv * 0.70.

JSON: implementer/grok/analysis.json

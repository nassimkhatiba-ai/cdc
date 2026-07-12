# Phase A efficiency pass — product changes + subset live check

## Shipped (general product, not test hacks)

1. **Slim SKILL.md** (`lib/compile-mcp.js`): no fake `--batch` placeholder args; openSession template moved to cold **CDC.md**; stronger description.
2. **Compact bridge I/O**: one-line JSON default; `CDC_BRIDGE_MAX_BYTES` (8k) truncate; `--pretty` / `CDC_BRIDGE_PRETTY=1` for debug.
3. **Router text-primary** (`lib/optical-pack.js`): `minTools` 8→**20**, margin 0.85→**0.70**, turn prior **+400**.
4. **Harness skill inject** (product-shaped): text arm inlines SKILL.md so agent skips sed turn (`LEGACY_SED=1` for old path).
5. Report now includes **text/image under MCP %**.

Synced to `skills/cdc-skill-creator/scripts/lib/`.

## Subset live (gpt-5.6-sol, text only, 6 targets)

| target | MCP | old text | new text | under MCP | vs old text | acc |
|--------|----:|---------:|---------:|----------:|------------:|-----|
| calc | 16078 | 13788 | **7442** | **53.7%** | **−46%** | 6/6 |
| hash | 16063 | 8548 | **7379** | **54.1%** | **−14%** | 3/3 |
| complex | 22254 | 14158 | 14195 | 36.2% | ~0 | 7/7 |
| nova | 23578 | 7885 | 12738 | 46.0% | +62% worse | 7/7 |
| github | 18772 | 8063 | 10022 | 46.6% | +24% worse | **5/5** (extractor false-neg fixed) |
| flags | 6110 | 3369 | 7319 | −20% | +117% worse | 3/3 |

**Avg of these 6:** MCP 17.1k · old text 9.3k (���46%) · new text **9.8k (−43%)** — not a suite win yet.

### Read of subset
- **Wins:** tiny compute skills (calc/hash) nearly hit Phase A bar (~50% under MCP).
- **Flat:** complex multi-hop still ~14k (session tax / multi-script).
- **Regressions:** skill inject + thrash hurt flags/nova tokens; github accuracy failed (wrong answer shape).
- Inject helps when the agent would sed; **hurts tiny skills** when body is re-billed every turn and agent still multi-calls.

### Scoring fix
Skill inject embeds `{"tool","args"}` examples; old `extractJson` grabbed those. Prefer score_keys match + skip tool/args stubs (`run-mega40.js`).

## Next (Phase A.1 / B)
1. Inject only when skill > ~800 chars OR use description-only + tools section (not full always-hot body for minis).
2. Stronger one-shot for multi-hop (kit.js / single script) — Phase B.
3. Full mega40 rebench after A.1.

## 90% status
Still multi-phase. Phase A product levers landed; **live suite avg not yet at 50%**. Best path remains one-shot execution + payload caps + selective inject, then host floor.

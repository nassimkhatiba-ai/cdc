# Image skill (`.cdc`) benchmarks

**Model:** `gpt-5.6-sol`  
**When:** 2026-07-11  
**Concept:** entire skill body as PNG image(s) attached with `codex exec -i`, vs text `SKILL.md`, vs full MCP.

## What we built

```text
text skill (SKILL.md + CDC.md)
        │
        ▼ pack.js / render.js
   name.cdc  (= PNG bytes)
   name.cdc.png  (alias for hosts)
   page-002… (if multi-page)
        │
        ▼ codex exec -i name.cdc.png  + stdin prompt
   agent sees skill as vision, calls mcp-call.js bridge
```

| file | role |
|------|------|
| `concept/image-skill/render.js` | pure-Node MD ��� multi-page PNG |
| `concept/image-skill/pack.js` | pack skill dir → `.cdc` package |
| `concept/image-skill/bench.js` | MCP / text / image / load A/B |
| `packages/complex-cdc/` | packed image skill (local) |

Codex quirk: free args after `-i` are treated as more images — **prompt must go via stdin** with trailing `-`.

## Pack metrics (definition tax estimates)

| pack | chars | ~text tokens | pages | ~vision tokens (est) |
|------|-------|--------------|-------|----------------------|
| complex-cdc (real skill) | 7,838 | ~1,960 | 1 | ~3,570 |
| fat load fixture | 34,529 | ~8,633 | 3 | ~10,200 |

Note: for the **compact** complex skill, estimated vision cost can exceed text — the live session still won because image load replaced multi-turn skill/text thrash, not because tiles are always cheaper than short text.

## Task A/B ��� multi-hop SLA (same hard task as complex MCP)

All three arms: **7/7 accuracy** (perfect).

| arm | tokens | wall (s) | accuracy | interface |
|-----|--------|----------|----------|-----------|
| **MCP** | **22,578** | **42** | 7/7 | ~74 MCP tool calls |
| **text skill** | **17,395** | **32** | 7/7 | openSession / callPaged / --batch |
| **image .cdc** | **13,432** | **29** | 7/7 | 1 image + bridge (0 MCP) |

### Ratios

| | |
|--|--|
| MCP / text tokens | **1.30×** |
| MCP / image tokens | **1.68×** |
| text / image tokens | **1.30×** |
| **image vs text savings** | **22.8%** |
| MCP / image wall | **1.45×** (image faster) |
| text / image wall | **1.10×** (image slightly faster) |

**Image skill is the cheapest and fastest** on this hard multi-hop task, with identical correctness.

## Load microbench — fat doc as text vs image

Question: extract tool metadata from a padded ~34k-char skill document (no tool calls needed).

| arm | tokens | wall (s) | score |
|-----|--------|----------|-------|
| load-text | **12,331** | **22** | 4/4 |
| load-image (3 pages) | **9,984** | **11** | 4/4 |

| | |
|--|--|
| text / image tokens | **1.24×** |
| **load savings** | **19%** |
| text / image wall | **2.0��** (image **2× faster**) |

Both recovered correct tool names (`server_info`, `list_open_p1_tickets`, `evaluate_ticket_sla`, batch bridge). Vision fidelity held on dense monospace.

## Interpretation

1. **Works end-to-end on Codex** with `-i` + stdin prompt.  
2. **Accuracy holds** (7/7 task, 4/4 load) — tool names readable from the bitmap font.  
3. **Tokens:** image beats text skill (~23%) and MCP (~40% vs MCP on this run).  
4. **Wall:** image fastest on both task and load (especially load: 11s vs 22s).  
5. **When image wins hardest:** fat docs / multi-page definition tax (load bench). Compact skills may have vision tile overhead close to text ��� still can win on fewer recon turns.  
6. **Not free:** trivial “PONG” with one image burned ~5.6k tokens (vision floor). Image skills pay that floor; huge text bodies amortize it.

## How to re-run

```bash
# full suite
CODEX_MODEL=gpt-5.6-sol PHASE=all node concept/image-skill/bench.js

# stepwise
PHASE=setup node concept/image-skill/bench.js
PHASE=pack  node concept/image-skill/bench.js
PHASE=mcp   node concept/image-skill/bench.js
PHASE=text  node concept/image-skill/bench.js
PHASE=image node concept/image-skill/bench.js
PHASE=load  node concept/image-skill/bench.js
PHASE=score node concept/image-skill/bench.js

# pack only
node concept/image-skill/pack.js implementer/complex/skills/complex-cdc concept/image-skill/packages
```

## Artifacts

| path | |
|------|--|
| `concept/image-skill/results/scored.json` | machine scores |
| `concept/image-skill/results/results-image-skill-bench.md` | this report |
| `concept/image-skill/bench/out/{mcp,text,image,load-*}.log` | transcripts |
| `concept/image-skill/packages/complex-cdc/complex-cdc.cdc.png` | skill image |

## Bottom line

**Shipping the skill body as a `.cdc` image is viable on Codex today.** On the complex multi-hop SLA task:

- **Image 13.4k tok / 29s**  
- Text skill 17.4k / 32s  
- MCP 22.6k / 42s  

Same answers. Next product step: optional `create-cdc-skill --format image` once multi-model hosts load images as skill bodies natively.

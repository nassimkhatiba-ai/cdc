# Concept: image skills (`.cdc`)

**Status:** experiment only — isolated under `concept/image-skill/`.  
**Does not change** the production skill maker (`skills/cdc-skill-creator/`).

## Idea

Today:

```text
agent loads SKILL.md as TEXT  ���  pays ~chars/4 tokens for the whole body
```

Proposal:

```text
compile:  SKILL.md (+ CDC.md)  →  ONE dense image  →  github-cdc.cdc
agent:    loads .cdc as IMAGE  ���  pays vision tokens (~fixed per tile)
```

Your cited shape: dense text ~25k text-tokens ��� **one image ~2.7k vision tokens**.

User intent for this concept:

> the skill should be **entirely** placed as an image  
> system still *authors* markdown, then **converts** to `.cdc`  
> loading `github-cdc.cdc` is loading the skill body as vision, not plain text

## Format (v1)

| file | role |
|------|------|
| `name.cdc` | **Valid PNG bytes**, extension `.cdc` only |
| `name.cdc.png` | Same bytes (for tools that only accept `.png`) |
| `name.cdc.json` | Width/height/char counts, estimates |
| `SOURCE.md` | Rebuild source (humans / re-render; agent should not cat) |
| `SKILL.md` | **Host glue only** — says “open the image”; **no skill body** |

So: content lives in the image. The tiny `SKILL.md` exists only because Claude/Codex skill discovery still expects a text entry point. In a future host that registers `.cdc` natively, that stub goes away.

## Pipeline

```bash
# from repo root
node concept/image-skill/compile.js
```

Renders fixtures + any of:

- `implementer/complex/skills/complex-cdc/{SKILL,CDC}.md` ��� `out/complex-cdc/complex-cdc.cdc`
- `cdc/github/{SKILL,CDC}.md` → `out/github-cdc/github-cdc.cdc`
- demo fixture → `out/demo-cdc/demo-cdc.cdc`

Low-level:

```bash
node concept/image-skill/render.js path/to/SKILL.md out/foo.cdc --cols 110 --scale 2
```

Renderer is **pure Node** (no canvas/sharp/PIL) — 5×7 bitmap font → PNG.

## Token math (order of magnitude)

| | estimate |
|--|----------|
| Text tokens | `chars / 4` |
| Vision tokens | tiles of 512² × ~85–170 (provider-dependent) |
| Win | when body is large and fits in few tiles |

See each `out/<name>/report.json` after compile.

## What to test next (live)

1. Codex/Claude: attach `complex-cdc.cdc.png` instead of reading SKILL.md body.  
2. Same hard SLA task as complex A/B.  
3. Compare session tokens + accuracy (tool names must stay readable).  
4. Fail cases: tiny misread of `evaluate_ticket_sla` ��� wrong tool.

## Risks

- Vision OCR fidelity on dense monospace  
- Multi-page if height blows past model limits  
- Hosts that refuse non-`.png` ��� use `.cdc.png` alias  
- Skill routers still need a short **text** description for *discovery* (name/when-to-use)

## Backup / product path

This folder is the sandbox. Production path later:

1. `create-cdc-skill` emits `name.cdc` (+ optional text stub)  
2. Install targets prefer image load when the host supports it  
3. Keep `SOURCE.md` / `CDC.md` for rebuild and grep fallback

# Concept: image skills (`.cdc`)

**Status:** working experiment + live Codex benchmarks.  
**Does not change** production skill maker yet.

## Idea

```text
author:  SKILL.md + CDC.md  (text)
compile: entire body → image page(s)
package: github-cdc.cdc  (= PNG)
load:    agent gets vision tokens, not full text body
```

## Pipeline

```bash
# pack any text skill dir
node concept/image-skill/pack.js path/to/skill-dir concept/image-skill/packages

# render one file
node concept/image-skill/render.js SOURCE.md out/foo.cdc --cols 100 --scale 2 --max-h 3600

# live A/B: MCP vs text skill vs image skill (+ fat load microbench)
CODEX_MODEL=gpt-5.6-sol PHASE=all node concept/image-skill/bench.js
```

## Live results (gpt-5.6-sol, complex 47-tool SLA task)

| arm | tokens | wall | accuracy |
|-----|--------|------|----------|
| MCP | 22,578 | 42s | 7/7 |
| text skill | 17,395 | 32s | 7/7 |
| **image .cdc** | **13,432** | **29s** | **7/7** |

Image vs text: **−23% tokens**, slightly faster wall.  
Image vs MCP: **−40% tokens**, **1.45× faster**.

Fat load microbench: image **���19% tokens**, **2× faster** wall, 4/4 fidelity.

Full writeup: [`results/results-image-skill-bench.md`](results/results-image-skill-bench.md)

## Format v1

| file | role |
|------|------|
| `name.cdc` | valid PNG, extension `.cdc` |
| `name.cdc.png` | same bytes (Codex `-i` likes `.png`) |
| `name.page-00N.cdc.png` | multi-page overflow |
| `name.cdc.json` / `meta.json` | sizes, token estimates |
| `SOURCE.md` | rebuild source (agent should not cat) |
| `mcp-call.js` | runtime bridge (copied from text skill) |
| `SKILL.md` | host glue pointer only (optional if host attaches image) |

## Codex usage

```bash
# prompt MUST be stdin when using -i (args after -i are more images)
codex exec --dangerously-bypass-approvals-and-sandbox \
  -m gpt-5.6-sol \
  -i packages/complex-cdc/complex-cdc.cdc.png \
  - <<'EOF'
IMAGE SKILL MODE. Read attached image for tools. Call via node mcp-call.js ...
EOF
```

## Layout

```text
concept/image-skill/
  render.js      # pure Node text���PNG, multi-page
  pack.js        # skill dir → .cdc package
  bench.js       # live Codex harness
  compile.js     # earlier batch compiler
  README.md
  results/       # scored report
  packages/      # gitignored packed skills
  bench/         # gitignored runs
```

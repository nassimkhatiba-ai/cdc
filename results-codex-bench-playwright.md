# Playwright MCP A/B — Codex gpt-5.6-luna

Simple prompts. Local fixture page `http://127.0.0.1:8765/store.html` (known ground truth).
MCP: `@playwright/mcp` headless (24 tools).

## Speed + cost

| Arm | Wall | Input tokens | Uncached | Output | Correct |
|---|---:|---:|---:|---:|---:|
| **MCP** | **81.1s** | **86,270** | 11,006 | 569 | **8/8** |
| **MAKE** | **82.1s** | **187,896** | 35,320 | 2,243 | skill ok |
| **USE CDC** | **82.0s** | **167,281** | 23,921 | 1,936 | **8/8** |

| Ratio | Value |
|---|---:|
| USE/MCP input tokens | **1.94x** (USE more expensive here) |
| USE/MCP wall | **1.01x** |

## Correctness detail

Both arms returned exact truth JSON.

| metric | truth |
|---|---|
| page_title | CDC Test Shop |
| shop_name | Nebula Outfitters |
| product_count | 4 |
| total_price | 175.75 |
| promo_code | SUMMER25 |

## What happened

### MCP
- 2 tool calls: `browser_navigate` + `browser_evaluate`
- Clean, efficient, correct

### MAKE
- Creator made `playwright-cdc` (bridge mode, 24 tools, ~571 skill tokens)
- **Bug hit:** CLI parser treats `--headless` as a boolean flag of create-cdc-skill itself, not a probe arg
- Agent worked around with a wrapper script `.probe-playwright.sh` (baked into first manifest)
- We fixed manifest to `npx -y @playwright/mcp --headless` before USE

### USE CDC
- Correct final answer
- More thrash: skill locate, CDC.md greps, multiple bridge attempts
- **More tokens than MCP** on this task (skill overhead + bridge cold start + recon)

## Honest takeaways

1. **Playwright is a weak win case for CDC** when the MCP path is already short (2 calls, small payload). Connected MCP was cheaper and similar speed.
2. **Both correct** — skill/bridge works for browser tools.
3. **Maker CLI bug:** `--arg --headless` is broken (args starting with `--` swallowed). Needs fix for real-world playwright installs.
4. CDC shines more when MCP dumps large payloads / many round-trips (filesystem 8k orders). Browser evaluate returning compact JSON is already near-optimal for MCP.
5. Definition tax: MCP schemas ~8k tokens; skill ~571 tokens — but on a short task the connected MCP path still spent less total input.

Generated: 2026-07-11T10:20:49.782524+00:00

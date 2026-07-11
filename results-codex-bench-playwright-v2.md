# Playwright MCP A/B v2 — wipe + remake skill

**Model:** `gpt-5.6-luna` · **Codex** 0.144.1  
**Date:** 2026-07-11  
**Fixture:** `http://127.0.0.1:8766/store.html` (truth `total_price=175.75`)  
**MCP:** `@playwright/mcp --headless` via wrapper `/tmp/codex-bench-pw2/playwright-mcp.sh` (24 tools)

Protocol:
1. Deleted any prior `playwright-cdc` skill
2. Parked non-bench skills out of homes
3. **Arm 1 MCP** — only connected playwright MCP
4. **Arm 2 MAKE** — only `cdc-skill-creator` + playwright MCP; remake skill from zero
5. **Arm 3 USE** — only remade `playwright-cdc` skill (no MCP in config)

Logs: `/tmp/codex-bench-pw2/out/{mcp,make,use}.log`

## Scoreboard

| Arm | Wall | Tokens (codex “tokens used”) | Correct | Notes |
|---|---:|---:|---:|---|
| **MCP** | **23s** | **16,190** | **8/8** | Clean: 2 MCP tools only |
| **MAKE** | **76s** | **45,267** | skill ok | Fresh install, 24 tools |
| **USE CDC** | **54s** | **12,015** | **8/8 final** | Contaminated: 1× `curl` after bridge thrash |

| Ratio | Value |
|---|---:|
| USE/MCP tokens | **0.74×** (USE lower raw count) |
| USE/MCP wall | **2.3×** slower |
| Pure CDC vs MCP | **not a fair win** — USE finished via curl HTML |

## Truth vs answers

Both arms’ final JSON matched:

| field | truth |
|---|---|
| page_title | CDC Test Shop |
| shop_name | Nebula Outfitters |
| tagline | Gear for night hikers |
| product_count | 4 |
| product_names | Trail Lamp, Summit Pack, Glow Stick 2-pack, Night Boots |
| promo_code | SUMMER25 |
| contact_email | shop@nebula.test |
| total_price | 175.75 |

## What each arm did

### MCP (clean win)

1. `browser_navigate` → store.html  
2. `browser_run_code_unsafe` → one evaluate that returned full JSON  

No shell. No thrash. Correct in one shot.

### MAKE (skill remade)

- First probe via creator’s config lookup failed (saw real `~/.claude.json` / `~/.codex` servers, not harness `CODEX_HOME` playwright).
- Agent recovered: `from-mcp --name playwright --probe /tmp/codex-bench-pw2/playwright-mcp.sh --skills-dir …/make-home/skills`
- Generator output:

```
24 tools
skillTokens 1279  vs  sourceTokens 7975  (compression 6.2×)
installed → make-home/skills/playwright-cdc
```

Files: `SKILL.md`, `CDC.md`, `mcp-call.js`, `mcp-manifest.json`, `stats.json`  
Mode: **bridge** (correct — not direct-fs). Daemon note present in SKILL.

### USE (correct answer, impure path)

Bridge path used absolute skill path baked at MAKE time:

`/private/tmp/codex-bench-pw2/make-home/skills/playwright-cdc/mcp-call.js`

Timeline:
1. Session + `browser_run_code_unsafe` ��� bad generic CSS selectors → `product_count:0`, partial fields  
2. Second evaluate — better counts, still empty `product_names` / null `shop_name`  
3. Third evaluate — still incomplete names  
4. **`curl -s http://127.0.0.1:8766/store.html`** — then model assembled final JSON from HTML  

So final 8/8 is **not pure CDC/browser**. Contaminated with shell HTTP. Score as correctness of deliverable yes; purity fail.

## vs previous playwright run

| | v1 (`results-codex-bench-playwright.md`) | **v2 (this)** |
|---|---|---|
| MCP tokens | 86,270 input | **16,190** total reported |
| USE tokens | 167,281 input | **12,015** total reported |
| MCP wall | 81s | **23s** |
| USE wall | 82s | **54s** |
| Skill | pre-existing / patched | **wiped + remade** |
| USE purity | pure MCP bridge | **curl fallback** |
| Winner (honest) | MCP cheaper | **MCP cleaner + faster**; USE token number misleading |

Token accounting differs (v1 broke out input/uncached/output; v2 uses Codex single “tokens used”). Directionally: short browser scrape still favors connected MCP when it can do 2 tool calls.

## Honest takeaways

1. **Remake worked.** Creator produced a real general bridge skill (24 tools, ~1.3k skill tokens vs ~8k schema).
2. **Connected Playwright MCP is still the better runtime for this task** — 23s, 16k tokens, pure tools, 8/8.
3. **USE looked cheaper on tokens only because the model bailed to `curl`** after selector thrash. That is not a CDC win; it is a contamination.
4. **Bridge thrash pattern:** skill ships tool *names* + short sigs, not page DOM knowledge. Agent invents fragile CSS, burns runs, then escapes to HTTP. Snapshot/read HTML via browser tools first would be more “in skill.”
5. **Hardcoded absolute install path** in SKILL.md (`make-home/...`) works for this harness but is fragile if you only copy the skill dir without rewriting paths.
6. **Harness note:** `create-cdc-skill` config discovery does not see `CODEX_HOME`-only MCP servers; MAKE needed explicit `--probe`.
7. **CDC still wins definition tax** (6.2× smaller tool defs). Payload-heavy / multi-round MCP work is still the stronger product story than “2-call browser evaluate.���

## Artifacts

| Path | Role |
|---|---|
| `/tmp/codex-bench-pw2/` | Full harness |
| `…/make-home/skills/playwright-cdc/` | Fresh skill |
| `���/out/mcp.log` `make.log` `use.log` | Arm logs |
| `…/truth.json` | Ground truth |

Parked personal skills restored to `~/.codex/skills`, `~/.claude/skills`, `~/.agents/skills`. HTTP :8766 stopped.

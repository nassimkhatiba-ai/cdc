# Skill maker v3.1 — fixes from the playwright A/B

The playwright bench (results-codex-bench-playwright.md) was the remaining
weak case: both arms 8/8 correct, but USE cost 1.94× MCP's input tokens at
equal wall clock. Three causes, three fixes:

## 1. Maker CLI bug: `--arg --headless` swallowed (FIXED)

Both parsers (bin/cdc.js, create-cdc-skill.js) treated any value starting
with `--` as the next flag, so probing `npx -y @playwright/mcp --headless`
was impossible without a wrapper script — that wrangling burned most of the
MAKE arm. Value-taking flags (`--arg`, `--probe`, …) now consume the next
token verbatim; `--key=value` also works. Verified by regenerating
playwright-cdc with the exact previously-broken invocation.

## 2. Grep indirection cost more than it saved (FIXED)

USE thrash was "skill locate, CDC.md greps, multiple bridge attempts". For a
24-tool server, one grep round trip costs more input tokens than the whole
index. Bridge skills now INLINE the full signature index in SKILL.md when it
is ≤ ~1,000 tokens (playwright: 24 tools, skill = 1,279 tokens vs 7,975 for
MCP schemas — 6.2×, zero grep turns). Huge servers (github, 1,196 endpoints)
keep the grep pattern. Fast path is stated first: plain calls via
`mcp-call.js <tool> '<json>'` / `--batch` need no script at all.

## 3. Bridge daemon: warm server + cross-script state (NEW)

`openSession()` now talks to a detached daemon behind a unix socket (started
automatically on first use, idles out after 10 min, `daemon-stop` /
`CDC_MCP_DAEMON=0` to control, falls back to direct spawn on any error).

Measured with playwright-cdc, two SEPARATE script processes:

| step | wall | note |
|---|---:|---|
| script 1: `browser_navigate(example.com)` | 11.1s | daemon + npx + Chromium cold boot (one-time) |
| script 2: `browser_evaluate(document.title)` | **0.74s** | separate process, **read the page script 1 opened** |

State persistence across scripts is what makes stateful MCPs (browsers,
DB sessions) actually usable through CDC — previously every script got a
fresh browser. Warm-path speedup ~15×; every subsequent call in a session
skips server cold start entirely.

## Honest scoping (unchanged from the A/B's takeaway)

A 2-call browser task with compact payloads is near-optimal for a connected
MCP; CDC's structural wins are large payloads, many round trips, and
composition. v3.1 closes the self-inflicted gaps (parser, grep turns, cold
starts) so the remaining difference is the skill-load cost itself.

Expected next playwright A/B: MAKE without the wrapper-script detour; USE
with zero grep turns and one warm bridge — input tokens at or below MCP for
multi-step tasks, and browser state usable across scripts (something the
one-shot bridge could not do at all).

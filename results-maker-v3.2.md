# Skill maker v3.2 — fixes from the multi-target suite

Source: results-codex-bench-suite{,-summary,-inventory}.md (GitHub auth,
TradingView, Everything, SQLite, Mock API). USE won tokens on all five but
lost wall clock on all five and dropped points on three. Failure clustering:

## Fixed in the generator (all general, no per-service logic)

1. **Pagination under-count** (Mock API USE 3/7: "under-counted delivered,
   pagination thrash"). Bridge skills had no pagination guidance or helper.
   → `callPaged(session, tool, args)` in every generated mcp-call.js: handles
   bare arrays and {data|items|results} wrappers, honors total_pages, stops
   on empty page, and guards against servers that ignore the page param
   (duplicate-page detection). Skill example + rule updated; unit-tested in
   smoke (full pagination, ignore-guard, pass-through).

2. **Tool prose echoed as answers** (Everything USE 3/5: "stringy add_sum /
   prefixed echo"). → rule: "Tool prose is not an answer — extract the value;
   print the EXACT requested output shape." (Also covers the SQLite
   nested-object soft miss.)

3. **Global search on named resources** (GitHub USE 5/7: searched q=cdc,
   picked apache/flink-cdc over the user's own repo). → rule: "Named resource
   (id, owner/name)? Direct lookup, never global search."

4. **Wall-clock asymmetry: connected MCP's server boots BEFORE the timer;
   CDC booted it inside the run.** → the creator now PRE-WARMS the bridge
   daemon at skill-creation time (fire-and-forget `daemon-start` after
   install; `--no-warm` to opt out; `warmed` field in output). First USE call
   hits a warm server, same as the MCP baseline. Verified: create → first
   call 1.9s total including node startup.

## Noted, not fixed (honest scoping)

- **SQLite MCP 0/5 was the MCP arm's own failure** (server opened an empty
  default DB). The CDC skill won precisely because the maker bakes the probe
  command — configuration is captured once at build time. Keep as evidence.
- **Tiny servers (5 tools) have ~1× definition-tax compression** (github-mini
  583 vs 566 source tokens). Expected: CDC's win on small schemas comes from
  payload transit + composition, not definitions. TradingView shows the other
  end: 16.8×.
- **USE remains slower on short tasks** even after pre-warm removes the boot
  gap: writing a script is inherently one longer generation than emitting a
  tool call. The structural CDC wins stay: large payloads, many round trips,
  cross-script state, and token cost (USE cheaper on all 5 targets here).

Suggested next suite tweak: since real usage hits a warm daemon (and MCP
arms get pre-booted servers), record USE wall with the daemon already warm —
that is the steady-state comparison.

# CDC - Code-Call Descriptors

**Replace the MCP interaction pattern with compiled API descriptors and sandboxed code execution.**

MCP loads every tool schema into context and routes every payload through the model. CDC compiles your API (or MCP server) into a tiny Claude Code skill: the agent greps a one-line-per-tool index and writes a script. Only the answer enters context.

| | MCP-style | CDC |
|---|---|---|
| Upfront context | All tool schemas | ~400-900 token skill |
| Data path | Payloads -> model | Payloads -> sandbox |
| Aggregation | In the model | In code (exact) |
| Cost vs data size | Superlinear | Flat |

**Benchmarked** (see [PAPER.md](PAPER.md)): **1,860x** fewer billed input tokens on a controlled suite; **157x** on a live frontier-model run where MCP also got an aggregation *wrong*.

```
npm install -g cdc-toolkit   # or: npm link  from this repo
cdc --help
```

---

## Install

```bash
# From this repo
npm link          # exposes the `cdc` command

# Or run without installing
node bin/cdc.js --help
```

Requires **Node 18+** (global `fetch`, no dependencies).

---

## Convert an MCP server -> CDC

### Option A - probe a live stdio server

```bash
cdc from-mcp \
  --probe npx \
  --arg -y \
  --arg "@modelcontextprotocol/server-github" \
  --name github-mcp

cdc --stats --package github-mcp
cdc install github-mcp
```

### Option B - from a tools/list JSON dump

Export tools from any MCP client, or save a `tools/list` response:

```bash
cdc from-mcp examples/sample-mcp-tools.json --name demo
cdc --stats --root cdc
cdc install demo
```

### What you get

```
cdc/demo/
  SKILL.md           # Claude Code skill preamble (~definition tax)
  CDC.md             # one line per tool, grouped by tag (grep lazily)
  stats.json         # compression + token accounting
  mcp-call.js        # tiny stdio client scripts can require()
  mcp-manifest.json  # how to reach the original MCP server
```

Drop the folder into `~/.claude/skills/` (or run `cdc install`) and Claude Code will load the skill on demand. The agent:

1. Reads the short `SKILL.md` preamble
2. Greps `CDC.md` for the tools it needs
3. Writes one Node script that calls tools / HTTP, aggregates in-process
4. Prints only the final answer

---

## Convert OpenAPI -> CDC

```bash
cdc make https://petstore3.swagger.io/api/v3/openapi.json --name petstore
cdc install petstore
```

Compiling GitHub's official 12.7MB OpenAPI spec (1,196 endpoints) yields a **909-token** skill - **3,502x** compression.

Back-compat: `node cdc-make.js <spec> --name <name>` still works.

---

## `cdc --stats` - how much would MCP have cost?

```bash
cdc --stats --paper
```

```
==============================================================
  CDC -- estimated savings vs MCP interaction pattern
==============================================================

From the CDC paper (reproducible benchmarks in this repo):

  Simulated suite (2,000 orders, 5 tasks)
    MCP billed input : 7,673,993 tokens  ($23.06)
    CDC billed input : 4,127 tokens  ($0.039)
    -> 1859.5x fewer input tokens, 586x cheaper

> Demo MCP  (12 tools, source=mcp)
  Scenario: 1 session(s) x 5 tasks

                    MCP-style          CDC              savings
  ---------------------------------------------------------------
  Definition tax            1,863             680         2.7x
  Billed input          1,651,725          15,900       103.9x
  Peak context             45,063           1,920        23.5x
  Round trips                  75              10         7.5x
  Est. cost               $5.0227         $0.0747        67.2x

  You would have saved ~1,635,825 billed input tokens ($4.948).
```

Useful flags:

| flag | meaning |
|---|---|
| `--paper` | include headline numbers from the paper |
| `--root cdc` | scan packages under this directory |
| `--package name` | single package |
| `--tools dump.json` | estimate from a raw MCP tools dump (no compile) |
| `--tasks N` | tasks per session (default 5) |
| `--mcp-trips N` | MCP round trips per task (default 15) |
| `--payload-tokens N` | avg MCP payload size per trip (default 2800) |
| `--sessions N` | sessions to model |
| `--price-in` / `--price-out` | $/MTok (default 3 / 15) |
| `--json` | machine-readable |

The estimator models MCP's three taxes - **definition**, **payload**, and **round-trip** (quadratic billed input) - against CDC's flat code-execution path. Defaults are calibrated to [results.md](results.md).

---

## Use in Claude Code

```bash
cdc install demo
# installs to ~/.claude/skills/demo-cdc/
```

Then ask Claude things like:

> Using the demo-cdc skill, compute total revenue across all orders.

Claude should open the skill, grep `CDC.md`, write a script (via `mcp-call.js` or HTTP), and return a number - without stuffing order pages into the conversation.

For MCP-mode packages, point scripts at your server:

```bash
export CDC_MCP_COMMAND=npx
export CDC_MCP_ARGS='["-y","@modelcontextprotocol/server-github"]'
# or bake the command in at compile time with --probe / --command
```

---

## CLI reference

```
cdc make <openapi> --name <name> [--out cdc] [--base-url URL]
cdc from-mcp <tools.json> --name <name> [--command CMD] [--http-base URL]
cdc from-mcp --probe <cmd> [--arg A]... --name <name>
cdc install <package> [--skills-dir DIR]
cdc stats | cdc --stats [options]
cdc list [--root cdc]
cdc help
```

---

## Why this works

An agent connected through MCP pays three taxes (full write-up in [PAPER.md](PAPER.md)):

1. **Definition tax** - every tool schema enters context before the first question
2. **Payload tax** - raw JSON pages transit the context window
3. **Round-trip tax** - each tool call re-reads the growing conversation (billed input grows ~quadratically)

CDC compiles definitions into a greppable index and moves fetch/filter/aggregate into a sandbox. Context cost becomes **O(answer)**, not **O(data)**. On the live run, that also fixed a wrong floating-point sum: arithmetic belongs on a CPU.

**MCP still wins** for credential brokering, non-HTTP/stateful tools, server-pushed resources, and org-level allowlists. A pragmatic hybrid: MCP as transport, code execution as the consumption pattern - which is what CDC packages when you convert an MCP server.

---

## Repo layout

```
bin/cdc.js              CLI entry (npm bin: cdc)
lib/compile-openapi.js  OpenAPI -> CDC
lib/compile-mcp.js      MCP tools/list -> CDC (+ probe + mcp-call helper)
lib/stats.js            savings estimator
lib/tokens.js           BPE-approximating token estimator
examples/               sample MCP tools dump
cdc/                    prebuilt packages (github, petstore, stripe, demo)
agents/                 benchmark harnesses (MCP-style vs codecall)
benchmark*.js           reproducible paper benchmarks
PAPER.md                full paper
```

```bash
npm test                # smoke tests (no network)
node benchmark.js       # full simulated suite
```

---

## License

MIT

<p align="center">
  <img src="assets/logo.svg" width="128" height="128" alt="CDC logo">
</p>

<h1 align="center">CDC</h1>

<p align="center">
  <strong>Code-Call Descriptors</strong> &mdash; use your MCP servers without paying the MCP tax.
</p>

<p align="center">
  Convert any MCP &rarr; a tiny Claude Code skill.<br>
  The agent writes a script. Only the answer enters context.
</p>

<p align="center">
  <a href="#convert-mcp--cdc">Quick start</a> &middot;
  <a href="#benchmarks">Benchmarks</a> &middot;
  <a href="PAPER.md">Paper</a> &middot;
  <a href="#cli">CLI</a>
</p>

<p align="center">
  <img alt="Node 18+" src="https://img.shields.io/badge/node-%3E%3D18-brightgreen">
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="Zero deps" src="https://img.shields.io/badge/deps-0-lightgrey">
</p>

---

## The idea in 10 seconds

| | **MCP** | **CDC** |
|---|---|---|
| Context starts with | every tool schema | ~400&ndash;900 token skill |
| Data flows through | the model | a sandbox |
| Aggregation | in the model's head | in code (exact) |
| Cost as data grows | superlinear | **flat** |

```
MCP tools/list  --cdc from-mcp-->  skill folder
                                   +-- SKILL.md   tiny preamble (always loaded)
                                   +-- CDC.md     one line per tool (grep lazily)
```

Claude Code loads the skill &rarr; greps the tool it needs &rarr; writes one script &rarr; prints the answer.

---

## Convert MCP &rarr; CDC

**3 commands.** Node 18+, no install required.

```bash
# 1. clone
git clone https://github.com/nassimkhatiba-ai/cdc.git && cd cdc

# 2. convert a live MCP server (or pass a tools.json dump)
node bin/cdc.js from-mcp \
  --probe npx --arg -y --arg "@modelcontextprotocol/server-github" \
  --name github

# 3. install into Claude Code
node bin/cdc.js install github
# → ~/.claude/skills/github-cdc/
```

Done. In Claude Code:

> Using the github-cdc skill, how many stars does torvalds/linux have?

### Or from a tools dump

```bash
# any MCP tools/list JSON
node bin/cdc.js from-mcp my-tools.json --name myserver
node bin/cdc.js install myserver
node bin/cdc.js --stats --package myserver   # see what you would have saved
```

### Try the sample (no network)

```bash
node bin/cdc.js from-mcp examples/sample-mcp-tools.json --name demo
node bin/cdc.js --stats --package demo --paper
node bin/cdc.js install demo
```

<details>
<summary><b>What does the package look like?</b></summary>

```
cdc/demo/
  SKILL.md            # Claude Code skill (~definition tax only)
  CDC.md              # one line per tool, grouped by tag
  stats.json          # compression numbers
  mcp-call.js         # tiny client scripts can require()
  mcp-manifest.json   # how to reach the original MCP server
```

Example <code>CDC.md</code> line:

```
list_orders(page:integer, per_page:integer, user_id:integer, status:...) - List orders...
```

</details>

<details>
<summary><b>Also works from OpenAPI</b></summary>

```bash
node bin/cdc.js make https://petstore3.swagger.io/api/v3/openapi.json --name petstore
node bin/cdc.js install petstore
```

GitHub's official 12.7 MB OpenAPI (1,196 endpoints) &rarr; <strong>909-token</strong> skill (<strong>3,502&times;</strong> compression).

</details>

---

## Benchmarks

Same 5 analytics tasks, same mock store API (2,000 orders). Answers verified equal.

### Simulated suite &mdash; interaction pattern cost

| | MCP-style | CDC | ratio |
|---|---:|---:|---:|
| **Billed input tokens** | 7,673,993 | 4,127 | **1,860&times;** |
| Context footprint | 720,960 | 3,179 | **227&times;** |
| Model round trips | 75 | 10 | **7.5&times;** |
| Modeled cost (Sonnet $) | $23.06 | $0.04 | **586&times;** |

3 of 5 MCP tasks needed **216k&ndash;233k** context &mdash; they don't fit a 200k window. CDC finishes each under **1k**.

### Live model &mdash; claude-opus-4-6, nothing scripted

| | MCP-style | CDC |
|---|---:|---:|
| Correct answers | 2 / 3 | **3 / 3** |
| Billed input tokens | 146,291 | **931** (**157&times;**) |
| Wall time | 329 s | **56 s** (**5.8&times;**) |

MCP got <code>total_revenue</code> **wrong** (&minus;$1,045). It paged 356 floats into context and summed them in attention. CDC's 15-line script got the exact value.

### Cost stays flat as data grows

| orders | MCP billed input | CDC billed input | ratio |
|---:|---:|---:|---:|
| 250 | 319,714 | 4,121 | 78&times; |
| 1,000 | 2,214,159 | 4,122 | 537&times; |
| 2,000 | 7,673,993 | 4,127 | **1,860&times;** |
| 4,000 | 28,371,367 | 4,127 | **6,875&times;** |

CDC is flat to four significant figures. The script scales; the context does not.

### Compile real APIs

| API | source size | tools / endpoints | skill tokens | compression |
|---|---:|---:|---:|---:|
| Petstore | 17 KB | 19 | 438 | 20&times; |
| Stripe | 7.9 MB | 587 | 420 | **4,682&times;** |
| GitHub | 12.7 MB | 1,196 | 909 | **3,502&times;** |

Full tables &rarr; [results.md](results.md) &middot; [results-live.md](results-live.md) &middot; [results-scale.md](results-scale.md)  
Reproduce &rarr; <code>node benchmark.js</code>

---

## See your savings

```bash
node bin/cdc.js --stats --paper
```

```
==============================================================
  CDC -- estimated savings vs MCP interaction pattern
==============================================================

  Definition tax     MCP 1,863   CDC   680    2.7x
  Billed input       MCP 1.6M    CDC  16k   104x
  Est. cost          MCP $5.02   CDC $0.07   67x

  You would have saved ~1,635,825 billed input tokens ($4.95).
```

---

## CLI

```bash
node bin/cdc.js from-mcp <tools.json|--probe CMD> --name <name>
node bin/cdc.js make <openapi-url-or-path> --name <name>
node bin/cdc.js install <name>                 # → ~/.claude/skills/<name>-cdc
node bin/cdc.js --stats [--paper] [--package name]
node bin/cdc.js list
```

Optional global install:

```bash
npm link          # exposes `cdc` on your PATH
cdc --help
```

---

## Why this works (short)

MCP charges three taxes every session:

1. **Definition** &mdash; all schemas enter context before the first question
2. **Payload** &mdash; raw JSON pages transit the model
3. **Round-trip** &mdash; each tool call re-reads the growing conversation

CDC compiles definitions into a greppable index and moves fetch / filter / aggregate into a sandbox. Context cost becomes **O(answer)**, not **O(data)**. Arithmetic runs on a CPU &mdash; which is why the live run was both cheaper *and* more accurate.

MCP still wins for credential brokering, non-HTTP/stateful tools, and org allowlists. Hybrid is fine: MCP as transport, code as the consumption pattern.

---

## Go deeper

| | |
|---|---|
| **[PAPER.md](PAPER.md)** | Full write-up &mdash; design, related work, all five benchmark layers, limitations |
| **[results.md](results.md)** | Per-task simulated tables |
| **[results-live.md](results-live.md)** | Live frontier-model run |
| **[results-scale.md](results-scale.md)** | Scaling sweep 250 &rarr; 4,000 orders |
| **`cdc/`** | Prebuilt packages: github, stripe, petstore, demo |

```bash
npm test                 # smoke tests, no network
node benchmark.js        # full simulated suite
```

---

<p align="center">
  <sub>MIT &middot; <a href="https://github.com/nassimkhatiba-ai/cdc">nassimkhatiba-ai/cdc</a></sub>
</p>

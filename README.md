<p align="center">
  <img src="assets/logo.svg" width="128" height="128" alt="CDC logo">
</p>

<h1 align="center">CDC</h1>

<p align="center">
  <strong>Code-Call Descriptors</strong> &mdash; stop loading MCPs into context.<br>
  Convert them into <strong>Agent Skills</strong> for Claude Code and Codex instead.
</p>

<p align="center">
  <a href="#quick-start--make-a-cdc-skill-in-claude-code">Quick start</a> &middot;
  <a href="#what-changes">Skill vs MCP</a> &middot;
  <a href="#benchmarks">Benchmarks</a> &middot;
  <a href="PAPER.md">Paper</a>
</p>

<p align="center">
  <img alt="Node 18+" src="https://img.shields.io/badge/node-%3E%3D18-brightgreen">
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="Zero deps" src="https://img.shields.io/badge/deps-0-lightgrey">
</p>

---

## What changes

| | **Load as MCP** | **Load as CDC skill** |
|---|---|---|
| How Claude sees it | connected MCP server | normal Agent Skill folder |
| Context starts with | every tool schema | ~400&ndash;900 token `SKILL.md` |
| Finding a tool | already in context | grep `CDC.md` (lazy) |
| Calling tools | model round-trip per call | one sandboxed script |
| Data path | payloads &rarr; model | payloads &rarr; sandbox |
| Cost as data grows | superlinear | **flat** |

```
  your MCP server
        |
        |  cdc-skill-creator  /  cdc tui
        v
  ~/.claude/skills/github-cdc/     <-- Claude loads THIS (a skill)
        SKILL.md                   <-- tiny preamble
        CDC.md                     <-- one line per tool
        mcp-call.js                <-- optional bridge back to MCP
```

**You are not "connecting an MCP" in Claude Code.**  
You install a skill. Claude opens the skill, greps the tool index, writes a script, prints the answer. Schemas and raw JSON never flood the window.

---

## Quick start — make a CDC skill in Claude Code

**Easiest path:** install the creator skill once, then just ask Claude Code **or Codex**.

```bash
git clone https://github.com/nassimkhatiba-ai/cdc.git && cd cdc
node bin/cdc.js install-creator --target both
# -> ~/.claude/skills + ~/.codex/skills
```

Then in Claude Code or Codex (restart Codex after install):

> Convert my GitHub MCP into a CDC skill  
> (`npx -y @modelcontextprotocol/server-github`)

or:

> Use cdc-skill-creator on this tools.json

Claude runs the bundled converter and installs:

```
~/.claude/skills/github-cdc/     <-- loads as a SKILL, not an MCP connection
```

Next message:

> Using the github-cdc skill, how many stars does torvalds/linux have?

### What just happened

```
  MCP server / tools dump
           |
           |  cdc-skill-creator  (Claude Code skill)
           v
  ~/.claude/skills/<name>-cdc/
        SKILL.md      tiny preamble Claude loads first
        CDC.md        one line per tool (grep lazily)
        mcp-call.js   optional bridge back to the MCP process
```

You are **not** connecting an MCP in Claude Code. You installed a skill.
Schemas and raw JSON never flood the window.

<details>
<summary><b>Alternative: TUI / CLI (no Claude needed)</b></summary>

```bash
node bin/cdc.js            # interactive TUI
# or
node bin/cdc.js from-mcp --probe npx --arg -y --arg "@modelcontextprotocol/server-github" --name github
node bin/cdc.js install github
```

```bash
# tools dump
node bin/cdc.js from-mcp my-tools.json --name myserver && node bin/cdc.js install myserver

# OpenAPI
node bin/cdc.js make https://petstore3.swagger.io/api/v3/openapi.json --name petstore
node bin/cdc.js install petstore
```

</details>

<details>
<summary><b>What does a generated skill look like?</b></summary>

```
~/.claude/skills/demo-cdc/
  SKILL.md            # Claude Code skill (~definition tax only)
  CDC.md              # one line per tool, grouped by tag
  stats.json          # compression numbers
  mcp-call.js         # tiny client scripts can require()
  mcp-manifest.json   # how to reach the original MCP server (if needed)
```

Example <code>CDC.md</code> line:

```
list_orders(page:integer, per_page:integer, user_id:integer, status:...) - List orders...
```

</details>

---

## Benchmarks

Same 5 analytics tasks, same mock store API (2,000 orders). Answers verified equal.

### Simulated suite &mdash; interaction pattern cost

| | MCP-style | CDC skill | ratio |
|---|---:|---:|---:|
| **Billed input tokens** | 7,673,993 | 4,127 | **1,860&times;** |
| Context footprint | 720,960 | 3,179 | **227&times;** |
| Model round trips | 75 | 10 | **7.5&times;** |
| Modeled cost (Sonnet $) | $23.06 | $0.04 | **586&times;** |

3 of 5 MCP tasks needed **216k&ndash;233k** context &mdash; they don't fit a 200k window. CDC finishes each under **1k**.

### Live model &mdash; claude-opus-4-6, nothing scripted

| | MCP-style | CDC skill |
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

  Definition tax     MCP 1,863   CDC skill  680    2.7x
  Billed input       MCP 1.6M    CDC skill 16k   104x
  Est. cost          MCP $5.02   CDC skill $0.07  67x

  You would have saved ~1,635,825 billed input tokens ($4.95).
```

---

## CLI

Preferred for most people: the **cdc-skill-creator** Claude Code skill above.

```bash
cdc | cdc tui | cdc new                    # interactive skill builder
cdc from-mcp <tools.json|--probe CMD> --name <name>
cdc make <openapi-url-or-path> --name <name>
cdc install <name>                         # -> ~/.claude/skills/<name>-cdc
cdc --stats [--paper] [--package name]
cdc list
```

---

## Why this works (short)

MCP-as-tool-bus charges three taxes every session:

1. **Definition** &mdash; all schemas enter context before the first question
2. **Payload** &mdash; raw JSON pages transit the model
3. **Round-trip** &mdash; each tool call re-reads the growing conversation

A **CDC skill** compiles definitions into a greppable index and moves fetch / filter / aggregate into a sandbox. Context cost becomes **O(answer)**, not **O(data)**. Arithmetic runs on a CPU &mdash; which is why the live run was both cheaper *and* more accurate.

MCP still wins for credential brokering, non-HTTP/stateful tools, and org allowlists. Hybrid is fine: keep MCP as transport behind `mcp-call.js`, but **consume it as a skill**.

---

## Go deeper

| | |
|---|---|
| **[PAPER.md](PAPER.md)** | Full write-up &mdash; design, related work, all five benchmark layers, limitations |
| **[results.md](results.md)** | Per-task simulated tables |
| **[results-live.md](results-live.md)** | Live frontier-model run |
| **[results-scale.md](results-scale.md)** | Scaling sweep 250 &rarr; 4,000 orders |
| **`cdc/`** | Prebuilt skill packages: github, stripe, petstore, demo |

```bash
npm test                 # smoke tests, no network
node benchmark.js        # full simulated suite
```

---

<p align="center">
  <sub>MIT &middot; <a href="https://github.com/nassimkhatiba-ai/cdc">nassimkhatiba-ai/cdc</a></sub>
</p>

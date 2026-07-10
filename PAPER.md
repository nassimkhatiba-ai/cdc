# CDC: Code-Call Descriptors — Replacing the MCP Interaction Pattern with Compiled API Descriptors and Sandboxed Code Execution

**Nassim Khatiba** — July 2026
*Artifacts: this repository. All benchmarks reproducible with `node benchmark.js`, `node benchmark-scale.js`, `node benchmark-live.js`, `node benchmark-cdc-live.js`.*

## Abstract

The Model Context Protocol (MCP) standardized how LLM agents reach external services, but its interaction pattern — tool schemas loaded upfront, one tool call per model round trip, every raw payload routed through the model's context window — imposes costs that grow with data volume rather than with question complexity. We describe **CDC (Code-Call Descriptor)**, a pattern in which an API is represented by a compiled, token-minimal descriptor and consumed by the agent *writing sandboxed code* against it, so that only derived answers enter context. We contribute (1) `cdc-make`, a compiler from OpenAPI specifications to CDC packages installable as Claude Code skills; and (2) a four-layer benchmark. Against a controlled mock API, the MCP pattern consumed **227× more context** and **1,860× more billed input tokens** than CDC, and its per-task context footprint exceeded a 200k window on 3 of 5 tasks. In a live experiment with a frontier model (claude-opus-4-6) making all decisions, CDC answered 3/3 tasks correctly using 931 input tokens, while the MCP pattern used 157× more input tokens, ran 5.8× slower, and **returned a wrong answer** on an aggregation task — the model mis-summed 356 floating-point values that the pattern forced through its context. Compiling GitHub's official 12.7MB OpenAPI specification (1,196 endpoints) yields a CDC whose upfront context cost is 909 tokens (a 3,502× reduction), with which the same model answered 3/3 questions against the real GitHub API in one shot each, 2,685 input tokens total. We argue the failure is architectural: MCP makes the model the *data bus*, while code execution makes it the *orchestrator*.

## 1. Introduction

An agent connected to services through MCP pays three distinct taxes:

1. **Definition tax.** Every connected server injects its full tool schemas into context before the first user request. Multi-server setups routinely start sessions tens of thousands of tokens deep.
2. **Payload tax.** Tool results — entire JSON pages — enter the context window whether or not the question needs them verbatim. The model then "computes" over data it must hold in attention.
3. **Round-trip tax.** Each tool call is a full model inference that re-reads the whole conversation. Billed input therefore grows *quadratically* in the number of calls when payloads accumulate.

These taxes scale with the **size of the data touched**, not the **difficulty of the question**. "What is total revenue?" is a one-line reduction, but under MCP it costs as much as reading every order aloud.

The alternative is old and simple: let the model write a program. The program fetches, filters, and aggregates inside a sandbox; the model sees only what the program prints. This paper packages that idea into a deployable pattern (CDC), builds the compiler that makes it practical for arbitrary REST APIs, and measures the difference carefully.

## 2. Related Work

- **CodeAct** (Wang et al., 2024, arXiv:2402.01030) showed that expressing agent actions as executable code outperforms JSON tool calling on multi-step tasks.
- **Cloudflare "Code Mode"** (2025) converts MCP tool inventories into TypeScript APIs the model programs against, motivated by the same token blow-up.
- **Anthropic, "Code execution with MCP"** (engineering blog, Nov 2025) reported ~98% token reductions when agents call MCP servers from generated code rather than direct tool calls, and popularized progressive disclosure of tool definitions.
- **Agent Skills** (Anthropic, 2025) established folder-of-instructions distribution with lazy loading — the delivery vehicle CDC uses for Claude Code.

CDC differs from these in compiling *the API's own OpenAPI contract* (not an MCP server wrapping it) directly into a minimal descriptor, skipping the protocol layer entirely for read/compute workloads.

## 3. The CDC Pattern

A **Code-Call Descriptor** is a compiled representation of an API optimized for token cost under the code-execution consumption model:

```
OpenAPI spec (MBs)  --cdc-make-->  CDC package
                                    ├── SKILL.md   ~400–900 tokens: base URL, auth
                                    │              contract, script rules, tag directory
                                    └── CDC.md     one line per endpoint, grouped by tag;
                                                   read/grepped lazily, never loaded whole
```

An endpoint line encodes method, path, query parameters (`*` = required), request-body shape, and top-level response shape:

```
GET /orgs/{org}/repos?type&sort&direction&per_page&page -> [{id,node_id,name,full_name,license,...}] — List organization repositories
```

**Consumption contract.** The agent (a) reads the SKILL preamble; (b) optionally retrieves only the CDC sections relevant to the question; (c) writes one script per question that performs *all* filtering, aggregation, and arithmetic in code; (d) prints only the final answer. Credentials live in environment variables read by the sandbox — they never transit the model's context.

**Compiler.** `cdc-make` (this repo) parses OpenAPI 3.x JSON, resolves intra-document `$ref`s with cycle guarding, renders compact shape signatures, extracts the auth scheme into a header recipe, and emits the package plus compression statistics. The 12.7MB GitHub spec compiles in seconds.

## 4. Experimental Setup

**Mock API.** A deterministic seeded e-commerce service (users/orders/products, paginated at 100/page) lets us compare paradigms with exact ground truth. Five analytics tasks span reductions (total revenue), filtered counts, grouped aggregations, and joins (top spender's email).

**Paradigm A: MCP-style harness.** Tool schemas written at the verbosity of published MCP servers are loaded upfront; the agent calls tools page by page; every payload is appended to the conversation; aggregation happens in-model. In the *simulated* benchmark the call sequence is scripted (we measure the pattern, not model IQ); in the *live* benchmark a real model chooses every call via the Anthropic tool-use API.

**Paradigm B: CDC/codecall harness.** Upfront context is the compact descriptor; the model (scripted in simulation, real in live runs) writes one Node script; a subprocess executes it; stdout returns.

**Accounting.** Context footprint = final conversation size. Billed input = Σ over round trips of conversation-so-far (how APIs bill without caching). Simulated tokens use one BPE-approximating estimator for both sides (ratios robust to its error); live tokens come from the API's own `usage` field. Live runs use `claude-opus-4-6` through an Anthropic-compatible router (AgentRouter), answers checked against ground truth computed independently.

## 5. Results

### 5.1 Simulated suite at full scale (2,000 orders; 5 tasks)

| metric | MCP-style | CDC | ratio |
| --- | --- | --- | --- |
| model round trips | 75 | 10 | 7.5× |
| context footprint (tokens) | 720,960 | 3,179 | **226.8×** |
| billed input tokens | 7,673,993 | 4,127 | **1,859.5×** |
| modeled end-to-end latency | 127.0 s | 42.6 s | 3.0× |
| modeled cost (Sonnet-class pricing) | $23.06 | $0.039 | **586×** |

Three of five tasks individually require 216k–233k tokens of context under MCP — **they do not fit in a 200k window at all**.

### 5.2 Scaling sweep (orders = 250 → 4,000)

| orders | MCP billed input | CDC billed input | ratio | MCP max task ctx | fits 200k? |
| --- | --- | --- | --- | --- | --- |
| 250 | 319,714 | 4,121 | 78× | 44,642 | yes |
| 500 | 721,362 | 4,121 | 175× | 71,381 | yes |
| 1,000 | 2,214,159 | 4,122 | 537× | 125,018 | yes |
| 2,000 | 7,673,993 | 4,127 | 1,859× | 233,289 | **no** |
| 4,000 | 28,371,367 | 4,127 | 6,875× | 449,866 | **no** |

MCP cost grows superlinearly (more pages × larger context per trip). CDC is **flat to four significant figures**: the script scales; the context does not.

### 5.3 Live run — real model on the mock API (50 users / 400 orders, 3 tasks)

| metric | MCP-style | CDC | ratio |
| --- | --- | --- | --- |
| correct answers | 2/3 | **3/3** | — |
| round trips | 11 | 3 | 3.7× |
| input tokens (API-reported) | 146,291 | 931 | **157×** |
| wall time (incl. model) | 329.1 s | 56.4 s | **5.8×** |

The MCP agent behaved competently — it parallelized tool calls and paged correctly — yet answered `total_revenue` **wrong**: $288,907.70 vs the true $289,953.42 (−$1,045.72). The pattern forced it to sum 356 floats held in attention. The CDC agent's 15-line script computed the exact value. In an initial run without continuation nudges, the MCP agent also repeatedly exhausted its output budget mid-arithmetic (0/3); we report the *repaired* harness above to be conservative.

### 5.4 Compiling real-world specs

| API | spec size | endpoints | spec tokens | CDC.md tokens | SKILL.md tokens | spec→SKILL compression |
| --- | --- | --- | --- | --- | --- | --- |
| Swagger Petstore | 17 KB | 19 | 8,614 | 994 | 438 | 19.7× |
| Stripe | 7.9 MB | 587 | 1,966,556 | 43,650 | 420 | **4,682×** |
| GitHub | 12.7 MB | 1,196 | 3,183,737 | 82,577 | 909 | **3,502×** |

The upfront context cost of "connect the entire GitHub API" under CDC is 909 tokens — less than two typical MCP tool definitions.

### 5.5 Live CDC against the real GitHub API

`claude-opus-4-6`, given only the generated 909-token SKILL preamble (with CDC sections available on request), answered against live `api.github.com`:

| task | trips | input tok | wall | correct |
| --- | --- | --- | --- | --- |
| user_public_repos | 1 | 889 | 12.2 s | ✔ |
| newest_org_repo | 1 | 898 | 10.3 s | ✔ |
| org_total_stars (paginated sum) | 1 | 898 | 10.7 s | ✔ |
| **total** | 3 | **2,685** | 33.2 s | **3/3** |

Notably the model requested **zero** CDC sections: the preamble plus REST convention sufficed, and every script was correct on the first attempt — including the paginated star-count aggregation. The lazy layer exists for the hard cases and cost nothing here.

## 6. Discussion

**The model-as-data-bus failure mode.** The live wrong answer (§5.3) is the paper's most important result. It is not a capability failure — the same model produced a correct exact algorithm in §5.3's CDC arm and in §5.5. It is an *architectural* failure: MCP routes bulk data through a probabilistic text processor and then asks it to do floating-point bookkeeping. Under CDC the arithmetic runs on a CPU, where it belongs. Efficiency and *accuracy* are therefore not separate axes here; the token-hungry pattern is also the error-prone one.

**Where the gap comes from.** CDC wins on three multiplicative fronts simultaneously: upfront definitions (compiled away, ~40–4,700×), payload transit (eliminated, unbounded×), and round trips (collapsed to ~1–3). The quadratic term in billed input (§5.2) dominates at scale.

**What MCP still does better.** CDC as presented covers read/compute workloads over HTTP APIs. MCP retains genuine advantages for: (a) credential brokering and per-tool permissioning enforced *outside* the agent; (b) non-HTTP or stateful integrations (browsers, databases with sessions, local applications); (c) server-pushed context (resources, notifications); (d) organizational governance — an allowlisted tool is easier to audit than arbitrary generated code. A pragmatic deployment is hybrid: MCP as the *authenticated transport*, code execution as the *consumption pattern* — which Anthropic's own code-execution-with-MCP proposal effectively is. CDC shows the transport can often be plain HTTPS plus an environment variable.

**Sandbox as the new trust boundary.** CDC moves risk from "which tools may the model call" to "what may generated code do." Our sandbox is a bare subprocess; production use needs egress-restricted, resource-limited execution (the design space of Cloudflare isolates, Firecracker, gVisor). Secrets stay out of context by construction, which is a *security improvement* over MCP results that echo tokens and PII into conversation logs.

## 7. Limitations

- Simulated-suite decisions are scripted; only §5.3/§5.5 let the model err on tool choice. Live evaluation is small (3 tasks × 2 paradigms × 1 model, single run; no confidence intervals).
- Simulated token counts use an estimator, not a served tokenizer (live counts are API-reported).
- Prompt caching was disabled on both sides; it would compress MCP's billed-input ratio toward its context-footprint ratio (~227×) but cannot recover the context-window ceiling or the accuracy failure.
- A well-designed MCP server exposing pre-aggregated endpoints (`get_revenue`) would close the gap on anticipated questions; CDC's advantage is precisely the *unanticipated* ones.
- `cdc-make` handles OpenAPI 3.x JSON with intra-document refs; YAML, multi-file refs, OAuth flows, and webhook/streaming endpoints are future work. Stripe's spec compiles but its tag structure is degenerate (one tag), weakening lazy sectioning.
- One live task's ground truth (star counts) drifts in real time; we allow 1% tolerance.

## 8. Conclusion

The costs that make MCP feel heavy are not incidental — they follow from routing definitions and data through the context window. Compiling the API contract into a Code-Call Descriptor and consuming it through sandboxed code turns O(data) context costs into O(answer), collapses round trips, keeps secrets out of the transcript, and — empirically — *raises answer accuracy* by letting arithmetic run on hardware designed for it. A 12.7MB API surface becomes a 909-token skill. The breakthrough the community is circling is not a better protocol for tool calls; it is the recognition that for most API work, **the tool call was never the right primitive — the program was.**

## References

1. Anthropic. *Code execution with MCP: building more efficient agents.* Engineering blog, Nov 2025.
2. Cloudflare. *Code Mode: the better way to use MCP.* Blog, Sept 2025.
3. X. Wang et al. *Executable Code Actions Elicit Better LLM Agents.* ICML 2024, arXiv:2402.01030.
4. Anthropic. *Equipping agents for the real world with Agent Skills.* Oct 2025.
5. Model Context Protocol specification. modelcontextprotocol.io, 2024–2026.

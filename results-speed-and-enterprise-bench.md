# Speed fix + Enterprise-Bench notes (2026-07-11)

## Speed fixes shipped

Root cause of slow USE wall: **extra agent turns** (read skill ��� list tools → grep CDC → call), not bridge latency.

### Converter (`lib/compile-mcp.js`)
1. **Lead with real `--batch`** using sample args from each tool schema (copy-paste first action).
2. **Ban recon:** "ONE shell call then final answer"; no bare `mcp-call.js` list; no full CDC.md.
3. **Raise inline tool index** to ~1400 tok so more skills avoid grep thrash.
4. **Fat skills:** tool names in SKILL.md; grep only after a failed call.
5. **Quoted skill paths** (workspace `;` safety).

### Harness
- `daemon-start` now **blocks until warm** before USE arm (120s timeout).

Smoke: **13 passed**.

## Live rebench: gpt-5.6-sol (after speed fix)

| Target | MCP tok | MCP wall | USE tok | USE wall | USE/MCP tok | USE/MCP wall | Score |
|---|---:|---:|---:|---:|---:|---:|---|
| **calc** | 15,943 | 11s | 12,551 | 12s | 0.79x | **1.09x (~parity)** | 6/6 both |
| **tradingview** | 27,285 | 29s | **12,028** | **23s** | **0.44x** | **0.79x (faster)** | 5/5 both |

### Path quality
- **calc USE:** skill read + one `--batch` with correct args → answer. Optimal shape for Codex skills.
- **tradingview USE:** no tool-list thrash; one call (still some payload bulk). **Wall and tokens both beat MCP.**

### vs previous Sol run (pre speed-template)

| | calc USE | TV USE |
|---|---|---|
| Before | 7,348 tok / 14s | 17,301 tok / 21s (lost to MCP) |
| After | 12,551 tok / **12s** | **12,028 tok / 23s** (beats MCP) |

Note: absolute tokens vary run-to-run (Sol reasoning + MCP arm variance; TV MCP jumped 13.8k → 27k). **Directionally:** fat MCP now shows clear USE speed+token win; mini calc is wall-parity (skill-read tax is structural for Codex skill loading).

Artifacts: `implementer/mega20/results/sol-speed/scored.json`, logs `logs/speed-*-sol.log`.

---

## Enterprise-Bench methodology (DevRev CTO, July 2026)

**Yes — this is for us.** Not a random enterprise doc. It is almost a formalization of the CDC thesis.

### What it is
76-page methodology for evaluating enterprise AI agents on:
- **Precision** (correct retrieval through verifiable paths)
- **Efficiency** (cost scaling with data volume)
- **Safety** (permission fidelity, no fabrication)

Plus L1–L4 autonomy levels, with **"wide L1"** = cognitively trivial, architecturally hard multi-system joins.

Public harness: **Harbor** (`hub.harborframework.com/datasets/Enterprise-Bench`).

### Why it maps to CDC

| Enterprise-Bench claim | CDC product angle |
|---|---|
| **Interface architecture >> model** (18–19 pt accuracy gap MCP1→MCP2; model upgrade +1 pt) | Convert MCP → skill is an *interface* fix, not a model upgrade |
| **MCP token bloat 4–32× vs CLI** (Scalekit + arXiv:2508.12566; SEP-1576) | CDC is literally "CLI/script instead of schemas-in-context" |
| **Tool overload >25–50 tools kills accuracy** | Fat MCP servers (Atlassian 30+, SF 60+) — skill indexes + lazy CDC.md |
| **API-surface cost grows +37% tokens 1��→256×; governed retrieval flat** | CDC batch/script aggregates off-context → flat definition tax |
| **Mis-join / Cartesian shortcut on multi-hop** | Same failure mode as mega-20 aggregation thrash; code-side join prevents it |
| **pass@k reliability, not pass@1** | Our single-shot benches understate; multi-trial is the real claim |
| **Answer-preserving data scaling** | Perfect design for "CDC stays cheap as data grows" demos |
| **Multi-tier tool interfaces** (curated vs protocol-realistic) | CDC = curated CLI tier *on top of* real MCP process |

### What is *not* for us (yet)
- Full 700-trial Harbor suite (14 tasks × 10 trials × 5 scales) is a **company-scale** investment.
- KG / Snowflake / Glean architectures are peer categories — we are the **MCP→skill** cell, not a full enterprise agent product.
- Safety/permission axis is secondary until we ship multi-tenant CDC.

### High-value things we *can* do with it
1. **Positioning language:** quote their interface-vs-model finding + MCP token inflation in README/PAPER.
2. **Bench design upgrades** (cheap, high leverage):
   - multi-trial pass@3 on calc/TV/github
   - answer-preserving scale on mockapi/sqlite (1× / 16× / 64× rows, same truth)
   - report tokens-per-correct-answer + wall, not just pass/fail
3. **Optional Harbor participation later:** MCP-connected agent vs CDC-skill agent on their public dataset — nuclear third-party validation.
4. **Dad/DevRev angle:** if they care about MCP cost, CDC is a concrete "interface tier" that sits between raw MCP and full governed KG — interesting product conversation, not a fork of their stack.

### Bottom line
Enterprise-Bench is **highly interesting** for CDC: same enemy (MCP/API interface tax), same metrics (efficiency at scale, reliability), independent authority (DevRev CTO). Steal the *methodology* now; full Harbor run only if you want a formal external leaderboard entry.

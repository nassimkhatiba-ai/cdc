# Complex MCP vs CDC skill — Codex A/B

**Model:** `gpt-5.6-sol`  
**Server:** `acme-ops-complex` — **47 tools**, multi-hop SLA / CRM / eng join task  
**When:** 2026-07-11  
**Harness:** `implementer/complex/run-complex-ab.js`

## What we built

A deliberately hard MCP (not a toy calculator):

| surface | tools (examples) |
|---------|------------------|
| CRM | list/get/search accounts, tiers, regions |
| Support | tickets, open P1 list, age, ticket→account |
| Engineering | issues, components, products, open-by-component |
| SLA | policies, reference_now, evaluate_ticket_sla |
| Noise | KB, incidents, deploys, usage, subject-join **trap** |
| Meta | server_info, describe_data_model, categories |

- **Page size 8** → multi-call pagination required  
- **No “answer the bench” tool** — agent must join and compute  
- **Trap:** `suggest_related_issues_by_subject` (wrong join path)  
- **Truth:** 12 open P1, **9 breaches**, unique ARR at risk **1,354,494**, top = Aperture

## Flow

1. **BEFORE** — Codex with MCP registered (`mcp-home`)  
2. **Convert** — `create-cdc-skill from-mcp` → `skills/complex-cdc/`  
3. **AFTER** — Codex with skill only, MCP off (`use-home`)

## Ground truth

| key | value |
|-----|-------|
| open_p1_count | 12 |
| breach_count | 9 |
| arr_at_risk | 1,354,494 |
| top_account_at_risk | Aperture (209,659) |
| accounts_in_breach | Aperture, Cyberdyne, Globex, Initech, Northwind, Stark Industries, Tyrell, Vantara, Wayne Enterprises |

Non-breaches among open P1: Hooli (Growth under 2h), Umbrella (Enterprise under 30m), Soylent (Starter / no SLA).

## Results (perfect accuracy both arms)

| arm | tokens | wall | accuracy | interface |
|-----|--------|------|----------|-----------|
| **BEFORE MCP** | **18,641** | 35s | **7/7** | ~70 MCP tool calls |
| **AFTER skill CDC** | **10,994** | 35s | **7/7** | openSession/callPaged + --batch (0 MCP) |

### Delta

| metric | value |
|--------|-------|
| **Token ratio MCP / CDC** | **1.70×** |
| **Token savings** | **41%** |
| Wall ratio | 1.0× (same 35s) |
| Accuracy delta | 0 (both perfect) |

## Why tokens dropped (definition tax)

- MCP arm pays **full tools/list schemas for 47 verbose tools** every turn.  
- CDC skill front-loads a **compact name list** in `SKILL.md` (~2.6 KB) + on-demand `CDC.md` (~4.9 KB).  
- USE purity: `mcp_tool_calls=0`, `openSession=6`, `callPaged=6`, `--batch=4` — multi-hop in **one Node session** instead of dozens of protocol round-trips in context.

## Why wall did not move

Both arms finished in ~35s on sol. Work is dominated by model reasoning + sequential joins (12 tickets × evaluate/account), not schema bytes alone. Token win is clear; wall needs harder multi-page / more hops or colder starts to separate further (Enterprise-Bench style pass@k + longer tasks).

## How to re-run

```bash
# all phases
CODEX_MODEL=gpt-5.6-sol PHASE=all node implementer/complex/run-complex-ab.js

# or step-wise
PHASE=setup node implementer/complex/run-complex-ab.js
PHASE=prebuild node implementer/complex/run-complex-ab.js
PHASE=mcp node implementer/complex/run-complex-ab.js
PHASE=use node implementer/complex/run-complex-ab.js
PHASE=score node implementer/complex/run-complex-ab.js
```

Truth probe: `node implementer/complex/bin/complex-mcp.js --truth`

## Artifacts

| path | role |
|------|------|
| `implementer/complex/bin/complex-mcp.js` | 47-tool server + truth |
| `implementer/complex/skills/complex-cdc/` | converted CDC skill |
| `implementer/complex/homes/complex/mcp-home/` | Codex home MCP-on |
| `implementer/complex/homes/complex/use-home/` | Codex home skill-only |
| `implementer/complex/homes/complex/out/{mcp,use}.log` | full transcripts |
| `implementer/complex/results/scored.json` | machine score |
| `implementer/complex/results/results-complex-ab.md` | this report |

## Bottom line

On a **real multi-system, multi-hop MCP with 47 tools**, converting to a CDC skill and **disabling MCP** cut session tokens by **~41% (1.7×)** with **identical perfect accuracy**. Wall time was flat on this task; the win is definition-tax / context, matching the product story: **fewer tokens for the same hard work**.

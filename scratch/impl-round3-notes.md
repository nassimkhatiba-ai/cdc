# impl-round3 notes

## Nova accuracy 0/7 — invent join tools (product fix)

**Date:** 2026-07-11
**Files:** `lib/compile-mcp.js` (+ sync `skills/cdc-skill-creator/scripts/lib/compile-mcp.js`)

### Root cause
Agent invented `get_incident_account` / `get_billing_account` join chains even when those tools were missing or when `evaluate_incident_slo` already returned `is_breach` + `mrr`. Failed MCP "not found" → grep thrash → give up → 0/7.

### Product fixes (general — no target-name branches)
1. **Multi-hop Rules** (+ SKILL Call template + CDC Multi-step comment):
   - Rule 6: Only call tool names listed under Tools / Evaluate helpers — never invent get_* tools.
   - Rule 7: If evaluate_* already returns risk fields (mrr, arr, account_id, is_breach), use those — do not invent join tools.
   - Template comment: Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed.
   - Multi-hop also documents "Daemon warm" (smoke + agent orientation).

2. **`collectEvaluateHelpers` tightened:**
   - Keep all evaluate_* (and SLA/SLO evaluate-by-desc) with full `toolLine`.
   - get_* helpers only if `/^get_(ticket|incident|billing_)?account/i` OR `/^get_.*_account$/i`.
   - Extra noise guard: exclude fraud|usage|runbook|signal|metric|quota.
   - Cap **4** get helpers; evaluate_* uncapped.
   - Exported for unit tests.

### Verification
- Unit: noise tools (`get_usage_for_account`, `get_fraud_signal`, `get_runbook`) excluded; account joins kept ≤4; rules present in SKILL/CDC.
- `node test/smoke.js` → **14 passed** (+ async callPaged ok).

### Intent for nova
When evaluate_incident_slo already ships is_breach + mrr, agent should aggregate those fields in one openSession — not invent a join chain that may not exist or double work.

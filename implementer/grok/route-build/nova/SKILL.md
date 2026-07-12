---
name: nova-cdc
description: Fast CDC for nova (48 tools). Multi-hop: ONE node openSession script; max 1 shell. No MCP schemas. Use nova-cdc skill.
---

# nova

**No connected MCP.** Skill only. **ONE shell → compact JSON answer.**

## Call (multi-hop: ONE openSession)

```bash
node - <<'EOF'
const { openSession, callPaged } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'list_open_sev1_incidents', {}); // ALL pages
  const one = await s.call('list_tool_categories', {}); // join/filter in-process
  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed
  console.log(JSON.stringify(/* answer keys only */));
  s.close();
})();
EOF
```

Daemon warm. Prefer Tools / Evaluate helpers only — never invent tool names.

## Rules

1. **ONE openSession script** for multi-hop (callPaged + joins + sum). **Max 1 shell.** Print answer keys once.
2. `--batch` only for tiny independent probes. CLI never for bulk lists — rows must not enter chat.
3. Paginate with callPaged(`list_open_sev1_incidents`) — never page 1 only. Prefer list/search tools for callPaged, never patch/update/create.
4. Names below; grep one tool in CDC.md only after a failed call. Max **2** shells.
5. When using evaluate_* tools, read returned keys (is_breach / is_breached / breach) from the actual result object — do not invent field names.
6. **Only call tool names listed under Tools / Evaluate helpers — never invent get_* tools.**
7. **If evaluate_* already returns risk fields (mrr, arr, account_id, is_breach), use those — do not invent join tools.**
8. **Never cat/sed/rg/read mcp-call.js source.** Black-box require only. Do not recon the bridge.
9. **This SKILL.md is the hot path** — do not switch to optical images or SKILL.text.md unless SKILL.md is missing.

## Evaluate / join helpers

- evaluate_incident_slo(incident_id*) — Per-incident SLO: age_minutes, threshold, is_breach, mrr
- get_incident_account(incident_id*) — Incident ��� billing account
- get_billing_account(account_id*) — Account by id
- get_account_by_name(name*) — Exact name lookup

Use server field names from tool results (e.g. is_breach, mrr, arr). Do not invent boolean field names.

## Tools (names)

List tools: list_tool_categories list_regions list_slo_policies list_services list_incidents list_open_sev1_incidents list_billing_accounts list_changes list_open_high_risk_changes list_employees list_metrics list_plans list_severities list_incident_statuses search_incidents search_accounts …

compute: compute_incident_age_minutes
count: count_incidents count_accounts
describe: describe_data_model
evaluate: evaluate_incident_slo
get(15): get_reference_now get_slo_for_region get_service get_incident ...
health: health_check
list: list_tool_categories list_regions list_slo_policies list_services list_incidents list_open_sev1_incidents list_billing_accounts list_changes list_open_high_risk_changes list_employees list_metrics list_plans list_severities list_incident_statuses list_deployments list_runbooks list_oncall list_payment_rails list_fraud_signals list_feature_flags list_compliance_controls
misc: ping
resolve: resolve_entity
search: search_incidents search_accounts
server: server_info
suggest: suggest_related_changes_by_title
Full names: CDC.md `_index`.

Args on fail: `grep -A 12 "^## <tool>" '__SKILL_DIR__/CDC.md'` once.

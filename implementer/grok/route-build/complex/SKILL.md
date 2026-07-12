---
name: complex-cdc
description: Fast CDC for complex (47 tools). Multi-hop: ONE node openSession script; max 1 shell. No MCP schemas. Use complex-cdc skill.
---

# complex

**No connected MCP.** Skill only. **ONE shell → compact JSON answer.**

## Call (multi-hop: ONE openSession)

```bash
node - <<'EOF'
const { openSession, callPaged } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'list_open_issues_for_component', {}); // ALL pages
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
3. Paginate with callPaged(`list_open_issues_for_component`) — never page 1 only. Prefer list/search tools for callPaged, never patch/update/create.
4. Names below; grep one tool in CDC.md only after a failed call. Max **2** shells.
5. When using evaluate_* tools, read returned keys (is_breach / is_breached / breach) from the actual result object — do not invent field names.
6. **Only call tool names listed under Tools / Evaluate helpers — never invent get_* tools.**
7. **If evaluate_* already returns risk fields (mrr, arr, account_id, is_breach), use those — do not invent join tools.**
8. **Never cat/sed/rg/read mcp-call.js source.** Black-box require only. Do not recon the bridge.
9. **This SKILL.md is the hot path** — do not switch to optical images or SKILL.text.md unless SKILL.md is missing.

## Evaluate / join helpers

- evaluate_ticket_sla(ticket_id*) — Per-ticket SLA evaluation: age_hours, threshold_hours, is_breach, hours_overdue
- get_account(account_id*) — Fetch a single CRM account by id (acc-####)
- get_account_by_name(name*) — Exact account name lookup
- get_ticket_account(ticket_id*) — Resolve ticket → account foreign key join (ticket_id → account object)
- get_contract_for_account(account_id*) — Contract for account_id

Use server field names from tool results (e.g. is_breach, mrr, arr). Do not invent boolean field names.

## Tools (names)

List tools: list_tool_categories list_accounts search_accounts list_regions list_tiers list_tickets list_open_p1_tickets list_ticket_priorities list_ticket_statuses list_issues list_open_issues_for_component list_components list_products list_sla_policies list_employees list_teams …

server_info list_tool_categories describe_data_model list_accounts get_account get_account_by_name search_accounts count_accounts list_regions list_tiers list_tickets get_ticket list_open_p1_tickets get_ticket_account compute_ticket_age_hours count_tickets list_ticket_priorities list_ticket_statuses list_issues get_issue list_open_issues_for_component get_issue_component list_components get_component list_products get_product list_sla_policies get_sla_for_tier get_reference_now evaluate_ticket_sla list_employees get_employee list_teams list_deals get_deal list_contracts get_contract_for_account list_articles get_article search_articles list_incidents get_incident list_deployments get_usage_for_account resolve_entity health_check suggest_related_issues_by_subject

Args on fail: `grep -A 12 "^## <tool>" '__SKILL_DIR__/CDC.md'` once.

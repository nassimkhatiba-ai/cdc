---
name: complex-cdc
description: Fast CDC for complex. ONE shell --batch (no MCP schemas). Use complex-cdc skill.
---

# complex

**No connected MCP.** Skill only. **Speed: ONE shell call, then final answer.**

## Call (do this first)

```bash
node '/Users/nesbes/mcp-a;t/implementer/complex/skills/complex-cdc/mcp-call.js' --batch '[{"tool":"server_info","args":{}},{"tool":"list_tool_categories","args":{}},{"tool":"describe_data_model","args":{"section":"all"}},{"tool":"list_accounts","args":{"page":1,"per_page":1,"region":"x"}}]'
```

Single tool: `node '/Users/nesbes/mcp-a;t/implementer/complex/skills/complex-cdc/mcp-call.js' server_info '{}'`

Daemon is warm (install pre-start). Do **not** list tools first — names are below.

## Multi-step only if batch cannot aggregate

```bash
node - <<'EOF'
const { openSession, callPaged } = require('/Users/nesbes/mcp-a;t/implementer/complex/skills/complex-cdc/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'server_info', { /* filters */ }); // ALL pages
  const one = await s.call('server_info', {});
  console.log(JSON.stringify(/* compact answer */));
  s.close();
})();
EOF
```

## Rules

1. **Prefer ONE `--batch`** for 1–N tools. openSession only for loops/pages.
2. Paginated lists (e.g. `server_info`): callPaged — never page 1 only.
3. Tool names are below — do **not** run bare `mcp-call.js` to list first.
4. No full CDC.md. Grep one tool only after a failed call. Max **2** shell runs.

## Tools (names)

server_info, list_tool_categories, describe_data_model, list_accounts, get_account, get_account_by_name, search_accounts, count_accounts, list_regions, list_tiers, list_tickets, get_ticket, list_open_p1_tickets, get_ticket_account, compute_ticket_age_hours, count_tickets, list_ticket_priorities, list_ticket_statuses, list_issues, get_issue, list_open_issues_for_component, get_issue_component, list_components, get_component, list_products, get_product, list_sla_policies, get_sla_for_tier, get_reference_now, evaluate_ticket_sla, list_employees, get_employee, list_teams, list_deals, get_deal, list_contracts, get_contract_for_account, list_articles, get_article, search_articles, list_incidents, get_incident, list_deployments, get_usage_for_account, resolve_entity, health_check, suggest_related_issues_by_subject

Args: only if a call fails, `grep -A 12 "^## <tool>" '/Users/nesbes/mcp-a;t/implementer/complex/skills/complex-cdc/CDC.md'` once. Do not cat CDC.md.

Groups:
- compute (1)
- count (2)
- describe (1)
- evaluate (1)
- get (16)
- health (1)
- list (20)
- resolve (1)
- search (2)
- server (1)
- suggest (1)

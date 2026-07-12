# complex - CDC

Source: MCP tools/list (47 tools)
Prefer: ONE openSession script that does ALL work then prints ONLY answer keys; callPaged for list_open_issues_for_component. --batch only for tiny independent probes.

## Multi-step (primary for multi-hop)

```bash
node - <<'EOF'
const { openSession, callPaged } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'list_open_issues_for_component', { /* filters */ }); // ALL pages
  const one = await s.call('list_tool_categories', { /* real args */ });
  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed
  // Answer helper: print JSON once; never dump tool results to chat.
  console.log(JSON.stringify(/* compact answer only */));
  s.close();
})();
EOF
```

## compute
compute_ticket_age_hours(ticket_id*) — Age of ticket in hours relative to server reference_now (not wall clock)

## count
count_accounts(tier, region) — Count accounts with optional tier/region filters
count_tickets(priority, status) — Count tickets with optional priority/status filters

## describe
describe_data_model(section:"all"|"crm"|"support"|"eng"|"sla") — Verbose multi-system data model documentation: entities, keys, join paths, SLA rules by…

## evaluate
evaluate_ticket_sla(ticket_id*) — Per-ticket SLA evaluation: age_hours, threshold_hours, is_breach, hours_overdue

## get
get_account(account_id*) — Fetch a single CRM account by id (acc-####)
get_account_by_name(name*) — Exact account name lookup
get_ticket(ticket_id*) — Get ticket by id (tkt-####)
get_ticket_account(ticket_id*) — Resolve ticket → account foreign key join (ticket_id → account object)
get_issue(issue_id*) — Get engineering issue by id (iss-####)
get_issue_component(issue_id*) — Issue ��� component metadata
get_component(component_id*) — Component by id
get_product(product_id*) — Product by id
get_sla_for_tier(tier*) — SLA policy for a single tier name
get_reference_now() — Canonical clock for age/SLA math
get_employee(employee_id*) — Employee by id
get_deal(deal_id*) — Deal by id. Returns JSON
get_contract_for_account(account_id*) — Contract for account_id
get_article(article_id*) — Full article body by id
get_incident(incident_id*) — Incident by id
get_usage_for_account(account_id*) — Synthetic product usage metrics for an account (noise for wrong-path agents)

## health
health_check() — Liveness probe

## list
list_tool_categories() — High-level grouping of available tools for discovery
list_accounts(page:integer, per_page:integer, region, tier:"Enterprise"|"Growth"|"Starter", status) — List CRM accounts (paginated)
list_regions() — List region codes used by accounts and employees
list_tiers() — List commercial tiers (not full SLA policy — use list_sla_policies)
list_tickets(page:integer, per_page:integer, priority:"P1"|"P2"|"P3"|"P4", status:"open"|"pending"|"solved"|"closed", account_id, component_id) — List support tickets paginated
list_open_p1_tickets(page:integer, per_page:integer) — Convenience: open P1 tickets only (still paginated)
list_ticket_priorities() — Enumerate priority enum values
list_ticket_statuses() — Enumerate ticket status enum values
list_issues(page:integer, per_page:integer, status, severity, component_id) — List engineering issues paginated
list_open_issues_for_component(component_id*) — Open+in_progress issues for a component_id
list_components(page:integer, per_page:integer) — List product components (join key component_id)
list_products() — Products and nested component id lists
list_sla_policies() — MSA tier → first_response_minutes
list_employees(page:integer, per_page:integer, team) — Employees paginated
list_teams() — Distinct team names
list_deals(page:integer, per_page:integer, stage) — Pipeline deals paginated
list_contracts(page:integer, per_page:integer) — Contracts / MSA tier bindings per account
list_articles(page:integer, per_page:integer, tag) — Knowledge articles paginated (titles only)
list_incidents(page:integer, per_page:integer, status) — Ops incidents paginated
list_deployments(page:integer, per_page:integer) — Recent deployments paginated

## resolve
resolve_entity(ref*) — Ambiguous resolver: tries account/ticket/issue by id prefix

## search
search_accounts(q*, page:integer, per_page:integer) — Substring search on account name
search_articles(q*, page:integer) — Search KB titles

## server
server_info() — Server metadata: name, version, reference_now clock used for SLA age calculations, page…

## suggest
suggest_related_issues_by_subject(ticket_id*) — HEURISTIC ONLY — matches issues by title token overlap with ticket subject

## _index
compute_ticket_age_hours
count_accounts
count_tickets
describe_data_model
evaluate_ticket_sla
get_account
get_account_by_name
get_article
get_component
get_contract_for_account
get_deal
get_employee
get_incident
get_issue
get_issue_component
get_product
get_reference_now
get_sla_for_tier
get_ticket
get_ticket_account
get_usage_for_account
health_check
list_accounts
list_articles
list_components
list_contracts
list_deals
list_deployments
list_employees
list_incidents
list_issues
list_open_issues_for_component
list_open_p1_tickets
list_products
list_regions
list_sla_policies
list_teams
list_ticket_priorities
list_ticket_statuses
list_tickets
list_tiers
list_tool_categories
resolve_entity
search_accounts
search_articles
server_info
suggest_related_issues_by_subject

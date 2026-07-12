# nova - CDC

Source: MCP tools/list (48 tools)
Prefer: ONE openSession script that does ALL work then prints ONLY answer keys; callPaged for list_open_sev1_incidents. --batch only for tiny independent probes.

## Multi-step (primary for multi-hop)

```bash
node - <<'EOF'
const { openSession, callPaged } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'list_open_sev1_incidents', { /* filters */ }); // ALL pages
  const one = await s.call('list_tool_categories', { /* real args */ });
  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed
  // Answer helper: print JSON once; never dump tool results to chat.
  console.log(JSON.stringify(/* compact answer only */));
  s.close();
})();
EOF
```

## compute
compute_incident_age_minutes(incident_id*) — Age minutes vs reference_now

## count
count_incidents(severity, status) — Count with filters
count_accounts(plan) — Count accounts

## describe
describe_data_model(section) — Join paths and SLO table

## evaluate
evaluate_incident_slo(incident_id*) — Per-incident SLO: age_minutes, threshold, is_breach, mrr

## get
get_reference_now() — Canonical clock
get_slo_for_region(region*) — SLO for one region
get_service(service_id*) — Service by id
get_incident(incident_id*) — Incident by id
get_incident_account(incident_id*) — Incident ��� billing account
get_billing_account(account_id*) — Account by id
get_account_by_name(name*) — Exact name lookup
get_change(change_id*) — Change by id
get_employee(employee_id*) — Employee by id
get_metrics_for_service(service_id*) — Metrics for service
get_service_region(service_id*) — Service → region
get_usage_for_account(account_id*) — Usage noise. Returns JSON
get_runbook(runbook_id*) — Runbook body
get_fraud_signal(signal_id*) — Fraud detail
get_feature_flag(flag*) — Flag detail. Returns JSON

## health
health_check() — Liveness. Returns JSON

## list
list_tool_categories() — Tool groups. Returns JSON
list_regions() — Region codes
list_slo_policies() — Region → sev1_ack_minutes
list_services(page:integer, per_page:integer, region) — Services paginated
list_incidents(page:integer, per_page:integer, severity, status, service_id) — Incidents paginated
list_open_sev1_incidents(page:integer, per_page:integer) — Open SEV1 only (paginated)
list_billing_accounts(page:integer, per_page:integer, plan) — Billing accounts paginated
list_changes(page:integer, per_page:integer, service_id, status) — Change tickets paginated
list_open_high_risk_changes(service_id*) — Open+high risk changes for service_id
list_employees(page:integer, per_page:integer) — Employees paginated
list_metrics() — Service metrics
list_plans() — Plan enum. Returns JSON
list_severities() — Severity enum
list_incident_statuses() — Status enum. Returns JSON
list_deployments(page:integer) — Deploy noise
list_runbooks(page:integer) — Runbook titles
list_oncall() — Oncall roster
list_payment_rails() — Payment rail noise
list_fraud_signals(page:integer) — Fraud noise. Returns JSON
list_feature_flags() — Flags noise. Returns JSON
list_compliance_controls() — Compliance noise

## misc
ping() — Ping. Returns JSON

## resolve
resolve_entity(ref*) — Ambiguous id resolver

## search
search_incidents(q*, page:integer) — Substring search titles
search_accounts(q*, page:integer) — Substring search accounts

## server
server_info() — Server metadata and reference_now

## suggest
suggest_related_changes_by_title(incident_id*) — HEURISTIC title overlap ��� unreliable

## _index
compute_incident_age_minutes
count_accounts
count_incidents
describe_data_model
evaluate_incident_slo
get_account_by_name
get_billing_account
get_change
get_employee
get_feature_flag
get_fraud_signal
get_incident
get_incident_account
get_metrics_for_service
get_reference_now
get_runbook
get_service
get_service_region
get_slo_for_region
get_usage_for_account
health_check
list_billing_accounts
list_changes
list_compliance_controls
list_deployments
list_employees
list_feature_flags
list_fraud_signals
list_incident_statuses
list_incidents
list_metrics
list_oncall
list_open_high_risk_changes
list_open_sev1_incidents
list_payment_rails
list_plans
list_regions
list_runbooks
list_services
list_severities
list_slo_policies
list_tool_categories
ping
resolve_entity
search_accounts
search_incidents
server_info
suggest_related_changes_by_title

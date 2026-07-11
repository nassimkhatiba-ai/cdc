#!/usr/bin/env node
/**
 * nova-complex-mcp.js — NEW hard multi-system MCP (distinct from acme-ops).
 *
 * Fleet / payments / risk surface (~50 tools). Multi-hop:
 * open SEV1 incidents → service → region SLO → billing accounts ARR → related change tickets.
 *
 * Env: NOVA_PAGE_SIZE (default 6), NOVA_SEED (default 7)
 * CLI: --truth | --tools
 */
'use strict';

const readline = require('readline');
const PAGE = Math.max(2, parseInt(process.env.NOVA_PAGE_SIZE || '6', 10));
const SEED = parseInt(process.env.NOVA_SEED || '7', 10);
const REF_NOW = '2026-07-11T18:00:00.000Z';
const REF_MS = Date.parse(REF_NOW);

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const id = (p, n) => `${p}-${String(n).padStart(4, '0')}`;

const REGIONS = ['us-east', 'us-west', 'eu-west', 'ap-south'];
const SLO = {
  'us-east': { sev1_ack_minutes: 15 },
  'us-west': { sev1_ack_minutes: 20 },
  'eu-west': { sev1_ack_minutes: 30 },
  'ap-south': { sev1_ack_minutes: 45 },
};

function build() {
  const services = [
    { id: 'svc-edge', name: 'Edge Gateway', region: 'us-east' },
    { id: 'svc-pay', name: 'Payments Core', region: 'us-east' },
    { id: 'svc-ledger', name: 'Ledger', region: 'eu-west' },
    { id: 'svc-risk', name: 'Risk Engine', region: 'us-west' },
    { id: 'svc-notify', name: 'Notify Hub', region: 'ap-south' },
    { id: 'svc-auth', name: 'AuthN', region: 'us-west' },
    { id: 'svc-search', name: 'Search', region: 'eu-west' },
    { id: 'svc-ml', name: 'Fraud ML', region: 'us-east' },
  ];

  const accounts = [
    'Helios Bank', 'Nimbus Pay', 'Orbit Retail', 'Quasar Cloud', 'Atlas Freight',
    'Cobalt Health', 'Delta Logistics', 'Echo Media', 'Flux Energy', 'Granite Soft',
    'Harbor Fintech', 'Ion Labs', 'Jade Markets', 'Kite Travel', 'Lumen Hosting',
    'Mesa Commerce', 'Nova Credit', 'Orchid SaaS', 'Prism Ads', 'Quartz HR',
  ].map((name, i) => ({
    id: id('bill', i + 1),
    name,
    plan: i % 3 === 0 ? 'enterprise' : i % 3 === 1 ? 'pro' : 'starter',
    region: REGIONS[i % REGIONS.length],
    mrr: 5000 + Math.floor(rand() * 120000),
    status: i % 9 === 0 ? 'past_due' : 'active',
  }));

  const changes = [];
  let cn = 1;
  for (const s of services) {
    for (let k = 0; k < 3; k++) {
      changes.push({
        id: id('chg', cn++),
        service_id: s.id,
        title: `${s.name} change ${k + 1}`,
        status: pick(['open', 'merged', 'open', 'abandoned']),
        risk: pick(['high', 'medium', 'low']),
      });
    }
  }

  // noise incidents
  const incidents = [];
  let inN = 1;
  for (let i = 0; i < 60; i++) {
    const svc = pick(services);
    const sev = pick(['SEV2', 'SEV3', 'SEV3', 'SEV1']);
    const status = pick(['open', 'mitigated', 'closed', 'open']);
    // avoid random open SEV1 polluting planted set
    const finalSev = sev === 'SEV1' && status === 'open' ? 'SEV2' : sev;
    const ageH = 0.2 + rand() * 48;
    incidents.push({
      id: id('inc', inN++),
      title: `Noise ${finalSev} on ${svc.name} #${i}`,
      severity: finalSev,
      status,
      service_id: svc.id,
      service_name: svc.name,
      region: svc.region,
      created_at: new Date(REF_MS - ageH * 3600 * 1000).toISOString(),
      acked_at: status === 'open' ? null : new Date(REF_MS - ageH * 1800 * 1000).toISOString(),
      billing_account_id: pick(accounts).id,
    });
  }

  // planted open SEV1s
  const planted = [
    { svc: 'svc-pay', ageMin: 90, acc: 'Helios Bank' }, // us-east 15m → breach
    { svc: 'svc-edge', ageMin: 40, acc: 'Nimbus Pay' }, // us-east breach
    { svc: 'svc-risk', ageMin: 50, acc: 'Orbit Retail' }, // us-west 20m breach
    { svc: 'svc-ledger', ageMin: 25, acc: 'Quasar Cloud' }, // eu-west 30m NOT breach
    { svc: 'svc-notify', ageMin: 120, acc: 'Atlas Freight' }, // ap-south 45m breach
    { svc: 'svc-auth', ageMin: 10, acc: 'Cobalt Health' }, // us-west NOT breach
    { svc: 'svc-ml', ageMin: 200, acc: 'Delta Logistics' }, // us-east breach
    { svc: 'svc-search', ageMin: 100, acc: 'Echo Media' }, // eu-west breach
    { svc: 'svc-pay', ageMin: 5, acc: 'Flux Energy' }, // fresh NOT
    { svc: 'svc-edge', ageMin: 180, acc: 'Granite Soft' }, // breach
  ];
  for (const p of planted) {
    const svc = services.find((s) => s.id === p.svc);
    const acc = accounts.find((a) => a.name === p.acc);
    incidents.push({
      id: id('inc', inN++),
      title: `SEV1 ${svc.name} ${p.acc}`,
      severity: 'SEV1',
      status: 'open',
      service_id: svc.id,
      service_name: svc.name,
      region: svc.region,
      created_at: new Date(REF_MS - p.ageMin * 60 * 1000).toISOString(),
      acked_at: null,
      billing_account_id: acc.id,
    });
  }

  // ensure open high-risk change per planted service
  for (const p of planted) {
    const open = changes.find((c) => c.service_id === p.svc && c.status === 'open' && c.risk === 'high');
    if (!open) {
      changes.push({
        id: id('chg', cn++),
        service_id: p.svc,
        title: `Hotfix for ${p.svc}`,
        status: 'open',
        risk: 'high',
      });
    }
  }

  const employees = Array.from({ length: 15 }, (_, i) => ({
    id: id('emp', i + 1),
    name: `Oncall ${String.fromCharCode(65 + i)}`,
    team: pick(['SRE', 'Payments', 'Risk', 'Platform']),
  }));

  const metrics = services.map((s) => ({
    service_id: s.id,
    p99_ms: 50 + Math.floor(rand() * 400),
    error_rate: +(rand() * 0.05).toFixed(4),
  }));

  return { services, accounts, changes, incidents, employees, metrics, regions: REGIONS, slo: SLO };
}

const W = build();

function ageMinutes(iso) {
  return (REF_MS - Date.parse(iso)) / 60000;
}

function computeTruth() {
  const openSev1 = W.incidents.filter((i) => i.severity === 'SEV1' && i.status === 'open');
  const breaches = [];
  for (const inc of openSev1) {
    const slo = W.slo[inc.region];
    const age = ageMinutes(inc.created_at);
    if (age > slo.sev1_ack_minutes && !inc.acked_at) {
      const acc = W.accounts.find((a) => a.id === inc.billing_account_id);
      const openHigh = W.changes.filter(
        (c) => c.service_id === inc.service_id && c.status === 'open' && c.risk === 'high',
      );
      breaches.push({
        incident_id: inc.id,
        title: inc.title,
        service_id: inc.service_id,
        service_name: inc.service_name,
        region: inc.region,
        age_minutes: +age.toFixed(2),
        slo_minutes: slo.sev1_ack_minutes,
        account_name: acc.name,
        mrr: acc.mrr,
        open_high_risk_change_count: openHigh.length,
        open_high_risk_change_ids: openHigh.map((c) => c.id).sort(),
      });
    }
  }
  breaches.sort((a, b) => a.title.localeCompare(b.title));
  const byAcc = new Map();
  for (const b of breaches) byAcc.set(b.account_name, b.mrr);
  const mrrAtRisk = [...byAcc.values()].reduce((s, n) => s + n, 0);
  let top = null;
  for (const [name, mrr] of byAcc) {
    if (!top || mrr > top.mrr) top = { name, mrr };
  }
  return {
    reference_now: REF_NOW,
    open_sev1_count: openSev1.length,
    breach_count: breaches.length,
    mrr_at_risk: mrrAtRisk,
    top_account_at_risk: top ? top.name : null,
    top_account_mrr: top ? top.mrr : null,
    breach_titles_sorted: breaches.map((b) => b.title),
    accounts_in_breach_sorted: [...byAcc.keys()].sort(),
    tool_count: null,
    seed: SEED,
  };
}

const TRUTH = computeTruth();

function pageOf(arr, page = 1, per_page = PAGE) {
  const p = Math.max(1, Number(page) || 1);
  const pp = Math.min(50, Math.max(1, Number(per_page) || PAGE));
  const start = (p - 1) * pp;
  return {
    data: arr.slice(start, start + pp),
    page: p,
    per_page: pp,
    total: arr.length,
    total_pages: Math.max(1, Math.ceil(arr.length / pp)),
    has_more: start + pp < arr.length,
  };
}

const LONG = (s) =>
  s +
  ' Returns JSON. Paginate with page/per_page. Join via foreign keys (service_id, billing_account_id, region). ' +
  'Never invent IDs. Use get_reference_now for age math. Nova Fleet multi-system surface.';

const TOOLS = [
  { name: 'server_info', description: LONG('Server metadata and reference_now.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'list_tool_categories', description: LONG('Tool groups.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'describe_data_model', description: LONG('Join paths and SLO table.'), inputSchema: { type: 'object', properties: { section: { type: 'string' } } } },
  { name: 'get_reference_now', description: LONG('Canonical clock.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'list_regions', description: LONG('Region codes.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'list_slo_policies', description: LONG('Region → sev1_ack_minutes.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'get_slo_for_region', description: LONG('SLO for one region.'), inputSchema: { type: 'object', properties: { region: { type: 'string' } }, required: ['region'] } },
  { name: 'list_services', description: LONG('Services paginated.'), inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' }, region: { type: 'string' } } } },
  { name: 'get_service', description: LONG('Service by id.'), inputSchema: { type: 'object', properties: { service_id: { type: 'string' } }, required: ['service_id'] } },
  { name: 'list_incidents', description: LONG('Incidents paginated. Filter severity/status/service_id.'), inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' }, severity: { type: 'string' }, status: { type: 'string' }, service_id: { type: 'string' } } } },
  { name: 'list_open_sev1_incidents', description: LONG('Open SEV1 only (paginated). No breach computation.'), inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' } } } },
  { name: 'get_incident', description: LONG('Incident by id.'), inputSchema: { type: 'object', properties: { incident_id: { type: 'string' } }, required: ['incident_id'] } },
  { name: 'evaluate_incident_slo', description: LONG('Per-incident SLO: age_minutes, threshold, is_breach, mrr.'), inputSchema: { type: 'object', properties: { incident_id: { type: 'string' } }, required: ['incident_id'] } },
  { name: 'get_incident_account', description: LONG('Incident ��� billing account.'), inputSchema: { type: 'object', properties: { incident_id: { type: 'string' } }, required: ['incident_id'] } },
  { name: 'list_billing_accounts', description: LONG('Billing accounts paginated.'), inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' }, plan: { type: 'string' } } } },
  { name: 'get_billing_account', description: LONG('Account by id.'), inputSchema: { type: 'object', properties: { account_id: { type: 'string' } }, required: ['account_id'] } },
  { name: 'get_account_by_name', description: LONG('Exact name lookup.'), inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'list_changes', description: LONG('Change tickets paginated.'), inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' }, service_id: { type: 'string' }, status: { type: 'string' } } } },
  { name: 'list_open_high_risk_changes', description: LONG('Open+high risk changes for service_id.'), inputSchema: { type: 'object', properties: { service_id: { type: 'string' } }, required: ['service_id'] } },
  { name: 'get_change', description: LONG('Change by id.'), inputSchema: { type: 'object', properties: { change_id: { type: 'string' } }, required: ['change_id'] } },
  { name: 'list_employees', description: LONG('Employees paginated.'), inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' } } } },
  { name: 'get_employee', description: LONG('Employee by id.'), inputSchema: { type: 'object', properties: { employee_id: { type: 'string' } }, required: ['employee_id'] } },
  { name: 'list_metrics', description: LONG('Service metrics.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'get_metrics_for_service', description: LONG('Metrics for service.'), inputSchema: { type: 'object', properties: { service_id: { type: 'string' } }, required: ['service_id'] } },
  { name: 'count_incidents', description: LONG('Count with filters.'), inputSchema: { type: 'object', properties: { severity: { type: 'string' }, status: { type: 'string' } } } },
  { name: 'count_accounts', description: LONG('Count accounts.'), inputSchema: { type: 'object', properties: { plan: { type: 'string' } } } },
  { name: 'health_check', description: LONG('Liveness.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'resolve_entity', description: LONG('Ambiguous id resolver.'), inputSchema: { type: 'object', properties: { ref: { type: 'string' } }, required: ['ref'] } },
  // trap
  { name: 'suggest_related_changes_by_title', description: LONG('HEURISTIC title overlap ��� unreliable. Use service_id.'), inputSchema: { type: 'object', properties: { incident_id: { type: 'string' } }, required: ['incident_id'] } },
  // more noise tools to inflate definition tax
  { name: 'list_plans', description: LONG('Plan enum.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'list_severities', description: LONG('Severity enum.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'list_incident_statuses', description: LONG('Status enum.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'search_incidents', description: LONG('Substring search titles.'), inputSchema: { type: 'object', properties: { q: { type: 'string' }, page: { type: 'integer' } }, required: ['q'] } },
  { name: 'search_accounts', description: LONG('Substring search accounts.'), inputSchema: { type: 'object', properties: { q: { type: 'string' }, page: { type: 'integer' } }, required: ['q'] } },
  { name: 'get_service_region', description: LONG('Service → region.'), inputSchema: { type: 'object', properties: { service_id: { type: 'string' } }, required: ['service_id'] } },
  { name: 'list_deployments', description: LONG('Deploy noise.'), inputSchema: { type: 'object', properties: { page: { type: 'integer' } } } },
  { name: 'get_usage_for_account', description: LONG('Usage noise.'), inputSchema: { type: 'object', properties: { account_id: { type: 'string' } }, required: ['account_id'] } },
  { name: 'list_runbooks', description: LONG('Runbook titles.'), inputSchema: { type: 'object', properties: { page: { type: 'integer' } } } },
  { name: 'get_runbook', description: LONG('Runbook body.'), inputSchema: { type: 'object', properties: { runbook_id: { type: 'string' } }, required: ['runbook_id'] } },
  { name: 'list_oncall', description: LONG('Oncall roster.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'compute_incident_age_minutes', description: LONG('Age minutes vs reference_now.'), inputSchema: { type: 'object', properties: { incident_id: { type: 'string' } }, required: ['incident_id'] } },
  { name: 'list_payment_rails', description: LONG('Payment rail noise.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'list_fraud_signals', description: LONG('Fraud noise.'), inputSchema: { type: 'object', properties: { page: { type: 'integer' } } } },
  { name: 'get_fraud_signal', description: LONG('Fraud detail.'), inputSchema: { type: 'object', properties: { signal_id: { type: 'string' } }, required: ['signal_id'] } },
  { name: 'list_feature_flags', description: LONG('Flags noise.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'get_feature_flag', description: LONG('Flag detail.'), inputSchema: { type: 'object', properties: { flag: { type: 'string' } }, required: ['flag'] } },
  { name: 'list_compliance_controls', description: LONG('Compliance noise.'), inputSchema: { type: 'object', properties: {} } },
  { name: 'ping', description: LONG('Ping.'), inputSchema: { type: 'object', properties: {} } },
];

TRUTH.tool_count = TOOLS.length;

function callTool(name, args = {}) {
  switch (name) {
    case 'server_info':
      return { name: 'nova-fleet-complex', version: '2.0.0', reference_now: REF_NOW, default_page_size: PAGE, tool_count: TOOLS.length };
    case 'list_tool_categories':
      return { categories: { incidents: ['list_open_sev1_incidents', 'evaluate_incident_slo'], billing: ['list_billing_accounts'], slo: ['list_slo_policies'] } };
    case 'describe_data_model':
      return {
        join_paths: [
          'incident.service_id -> service.id -> service.region -> slo',
          'incident.billing_account_id -> account.id',
          'change.service_id -> service.id',
        ],
        slo: W.slo,
        warning: 'Use service_id for change joins, not title heuristics.',
      };
    case 'get_reference_now':
      return { reference_now: REF_NOW, unix_ms: REF_MS };
    case 'list_regions':
      return { regions: W.regions };
    case 'list_slo_policies':
      return { data: Object.entries(W.slo).map(([region, v]) => ({ region, ...v })) };
    case 'get_slo_for_region': {
      const s = W.slo[args.region];
      if (!s) throw new Error('unknown region');
      return { region: args.region, ...s };
    }
    case 'list_services': {
      let arr = W.services.slice();
      if (args.region) arr = arr.filter((s) => s.region === args.region);
      return pageOf(arr, args.page, args.per_page);
    }
    case 'get_service': {
      const s = W.services.find((x) => x.id === args.service_id);
      if (!s) throw new Error('not found');
      return s;
    }
    case 'list_incidents': {
      let arr = W.incidents.slice();
      if (args.severity) arr = arr.filter((i) => i.severity === args.severity);
      if (args.status) arr = arr.filter((i) => i.status === args.status);
      if (args.service_id) arr = arr.filter((i) => i.service_id === args.service_id);
      return pageOf(arr, args.page, args.per_page);
    }
    case 'list_open_sev1_incidents':
      return pageOf(
        W.incidents.filter((i) => i.severity === 'SEV1' && i.status === 'open'),
        args.page,
        args.per_page,
      );
    case 'get_incident': {
      const i = W.incidents.find((x) => x.id === args.incident_id);
      if (!i) throw new Error('not found');
      return i;
    }
    case 'evaluate_incident_slo': {
      const i = W.incidents.find((x) => x.id === args.incident_id);
      if (!i) throw new Error('not found');
      const slo = W.slo[i.region];
      const age = ageMinutes(i.created_at);
      const acc = W.accounts.find((a) => a.id === i.billing_account_id);
      const breach = i.severity === 'SEV1' && i.status === 'open' && !i.acked_at && age > slo.sev1_ack_minutes;
      return {
        incident_id: i.id,
        region: i.region,
        age_minutes: +age.toFixed(4),
        threshold_minutes: slo.sev1_ack_minutes,
        is_breach: breach,
        account_name: acc.name,
        mrr: acc.mrr,
        service_id: i.service_id,
      };
    }
    case 'get_incident_account': {
      const i = W.incidents.find((x) => x.id === args.incident_id);
      if (!i) throw new Error('not found');
      return { incident_id: i.id, account: W.accounts.find((a) => a.id === i.billing_account_id) };
    }
    case 'list_billing_accounts': {
      let arr = W.accounts.slice();
      if (args.plan) arr = arr.filter((a) => a.plan === args.plan);
      return pageOf(arr, args.page, args.per_page);
    }
    case 'get_billing_account': {
      const a = W.accounts.find((x) => x.id === args.account_id);
      if (!a) throw new Error('not found');
      return a;
    }
    case 'get_account_by_name': {
      const a = W.accounts.find((x) => x.name === args.name);
      if (!a) throw new Error('not found');
      return a;
    }
    case 'list_changes': {
      let arr = W.changes.slice();
      if (args.service_id) arr = arr.filter((c) => c.service_id === args.service_id);
      if (args.status) arr = arr.filter((c) => c.status === args.status);
      return pageOf(arr, args.page, args.per_page);
    }
    case 'list_open_high_risk_changes': {
      const arr = W.changes.filter(
        (c) => c.service_id === args.service_id && c.status === 'open' && c.risk === 'high',
      );
      return { service_id: args.service_id, data: arr, count: arr.length };
    }
    case 'get_change': {
      const c = W.changes.find((x) => x.id === args.change_id);
      if (!c) throw new Error('not found');
      return c;
    }
    case 'list_employees':
      return pageOf(W.employees, args.page, args.per_page);
    case 'get_employee': {
      const e = W.employees.find((x) => x.id === args.employee_id);
      if (!e) throw new Error('not found');
      return e;
    }
    case 'list_metrics':
      return { data: W.metrics };
    case 'get_metrics_for_service': {
      const m = W.metrics.find((x) => x.service_id === args.service_id);
      if (!m) throw new Error('not found');
      return m;
    }
    case 'count_incidents': {
      let arr = W.incidents;
      if (args.severity) arr = arr.filter((i) => i.severity === args.severity);
      if (args.status) arr = arr.filter((i) => i.status === args.status);
      return { count: arr.length };
    }
    case 'count_accounts': {
      let arr = W.accounts;
      if (args.plan) arr = arr.filter((a) => a.plan === args.plan);
      return { count: arr.length };
    }
    case 'health_check':
    case 'ping':
      return { ok: true, reference_now: REF_NOW };
    case 'resolve_entity': {
      const ref = String(args.ref || '');
      if (ref.startsWith('inc-')) return { type: 'incident', entity: W.incidents.find((i) => i.id === ref) || null };
      if (ref.startsWith('bill-')) return { type: 'account', entity: W.accounts.find((a) => a.id === ref) || null };
      if (ref.startsWith('svc-')) return { type: 'service', entity: W.services.find((s) => s.id === ref) || null };
      return { type: 'unknown', entity: null };
    }
    case 'suggest_related_changes_by_title': {
      const i = W.incidents.find((x) => x.id === args.incident_id);
      if (!i) throw new Error('not found');
      const tokens = i.title.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const scored = W.changes.map((c) => ({
        change: c,
        hits: tokens.filter((t) => c.title.toLowerCase().includes(t)).length,
      }));
      scored.sort((a, b) => b.hits - a.hits);
      return { warning: 'heuristic', suggestions: scored.slice(0, 5).map((s) => s.change) };
    }
    case 'list_plans':
      return { plans: ['enterprise', 'pro', 'starter'] };
    case 'list_severities':
      return { severities: ['SEV1', 'SEV2', 'SEV3'] };
    case 'list_incident_statuses':
      return { statuses: ['open', 'mitigated', 'closed'] };
    case 'search_incidents': {
      const q = String(args.q || '').toLowerCase();
      return pageOf(
        W.incidents.filter((i) => i.title.toLowerCase().includes(q)),
        args.page,
        10,
      );
    }
    case 'search_accounts': {
      const q = String(args.q || '').toLowerCase();
      return pageOf(
        W.accounts.filter((a) => a.name.toLowerCase().includes(q)),
        args.page,
        10,
      );
    }
    case 'get_service_region': {
      const s = W.services.find((x) => x.id === args.service_id);
      if (!s) throw new Error('not found');
      return { service_id: s.id, region: s.region };
    }
    case 'list_deployments':
      return pageOf(
        Array.from({ length: 20 }, (_, i) => ({ id: id('dep', i + 1), service: pick(W.services).name, ok: true })),
        args.page,
        PAGE,
      );
    case 'get_usage_for_account': {
      const a = W.accounts.find((x) => x.id === args.account_id);
      if (!a) throw new Error('not found');
      return { account_id: a.id, api_calls: a.mrr * 3 };
    }
    case 'list_runbooks':
      return pageOf(
        Array.from({ length: 15 }, (_, i) => ({ id: id('rb', i + 1), title: `Runbook ${i + 1}` })),
        args.page,
        PAGE,
      );
    case 'get_runbook':
      return { id: args.runbook_id, body: 'omitted' };
    case 'list_oncall':
      return { data: W.employees.slice(0, 5) };
    case 'compute_incident_age_minutes': {
      const i = W.incidents.find((x) => x.id === args.incident_id);
      if (!i) throw new Error('not found');
      return { incident_id: i.id, age_minutes: +ageMinutes(i.created_at).toFixed(4) };
    }
    case 'list_payment_rails':
      return { rails: ['card', 'ach', 'wire'] };
    case 'list_fraud_signals':
      return pageOf(
        Array.from({ length: 12 }, (_, i) => ({ id: id('frd', i + 1), score: rand() })),
        args.page,
        PAGE,
      );
    case 'get_fraud_signal':
      return { id: args.signal_id, score: 0.1 };
    case 'list_feature_flags':
      return { flags: ['nova_v2', 'risk_shadow', 'pay_retry'] };
    case 'get_feature_flag':
      return { flag: args.flag, enabled: true };
    case 'list_compliance_controls':
      return { controls: ['SOC2', 'PCI'] };
    default:
      throw new Error('unknown tool ' + name);
  }
}

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

if (process.argv.includes('--truth')) {
  console.log(JSON.stringify(TRUTH, null, 2));
  process.exit(0);
}
if (process.argv.includes('--tools')) {
  console.log(JSON.stringify(TOOLS.map((t) => t.name), null, 2));
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  const { id: rid, method, params } = msg;
  try {
    if (method === 'initialize') {
      return send({
        jsonrpc: '2.0',
        id: rid,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'nova-fleet-complex', version: '2.0.0' },
        },
      });
    }
    if (method && method.startsWith('notifications/')) return;
    if (method === 'tools/list') return send({ jsonrpc: '2.0', id: rid, result: { tools: TOOLS } });
    if (method === 'tools/call') {
      const result = callTool(params.name, params.arguments || {});
      return send({
        jsonrpc: '2.0',
        id: rid,
        result: { content: [{ type: 'text', text: JSON.stringify(result) }] },
      });
    }
    if (rid !== undefined) send({ jsonrpc: '2.0', id: rid, error: { code: -32601, message: 'Method not found' } });
  } catch (e) {
    if (rid !== undefined) send({ jsonrpc: '2.0', id: rid, error: { code: -32000, message: String(e.message || e) } });
  }
});

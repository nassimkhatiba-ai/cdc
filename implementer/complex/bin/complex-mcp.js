#!/usr/bin/env node
/**
 * complex-mcp.js — intentionally hard multi-system MCP for CDC A/B.
 *
 * ~47 tools, verbose schemas, paginated lists, NO single "answer the bench" tool.
 * Multi-hop joins required: tickets → accounts → SLA → eng issues by component.
 *
 * Env:
 *   COMPLEX_PAGE_SIZE   default 8 (small pages force multi-call)
 *   COMPLEX_SEED        default 42
 */
'use strict';

const readline = require('readline');

const PAGE = Math.max(2, parseInt(process.env.COMPLEX_PAGE_SIZE || '8', 10));
const SEED = parseInt(process.env.COMPLEX_SEED || '42', 10);
const REF_NOW = '2026-07-11T12:00:00.000Z';
const REF_MS = Date.parse(REF_NOW);

// ---------- deterministic PRNG ----------
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
const id = (prefix, n) => `${prefix}-${String(n).padStart(4, '0')}`;

// ---------- seed data (answer-preserving hard task) ----------
const TIERS = [
  { tier: 'Enterprise', first_response_minutes: 30, arr_min: 100000 },
  { tier: 'Growth', first_response_minutes: 120, arr_min: 20000 },
  { tier: 'Starter', first_response_minutes: null, arr_min: 0 }, // no contractual SLA
];
const REGIONS = ['NA', 'EMEA', 'APAC', 'LATAM'];
const COMPONENTS = [
  { id: 'cmp-auth', name: 'Auth Service', product: 'Platform' },
  { id: 'cmp-billing', name: 'Billing Engine', product: 'Platform' },
  { id: 'cmp-search', name: 'Search Index', product: 'Search' },
  { id: 'cmp-ingest', name: 'Data Ingest', product: 'Pipeline' },
  { id: 'cmp-ui', name: 'Web UI', product: 'Frontend' },
  { id: 'cmp-api', name: 'Public API', product: 'Platform' },
  { id: 'cmp-notify', name: 'Notifications', product: 'Platform' },
  { id: 'cmp-ml', name: 'ML Scoring', product: 'Intelligence' },
];
const ACCOUNT_NAMES = [
  'Vantara', 'Northwind', 'Globex', 'Initech', 'Umbrella', 'Stark Industries',
  'Wayne Enterprises', 'Soylent', 'Hooli', 'Pied Piper', 'Massive Dynamic',
  'Cyberdyne', 'Aperture', 'Tyrell', 'Oscorp', 'Wonka', 'Acme Retail',
  'BlueSun', 'Buy n Large', 'Dunder Mifflin', 'Prestige Worldwide', 'InGen',
];

// Force tiers for planted SLA cases (index-based default would mis-tier Soylent).
const TIER_FORCE = {
  Vantara: 'Enterprise',
  'Stark Industries': 'Enterprise',
  'Wayne Enterprises': 'Enterprise',
  Umbrella: 'Enterprise',
  Northwind: 'Growth',
  Globex: 'Growth',
  Hooli: 'Growth',
  Soylent: 'Starter',
  Initech: 'Enterprise',
  Cyberdyne: 'Growth',
  Aperture: 'Enterprise',
  Tyrell: 'Growth',
};

function buildWorld() {
  const accounts = ACCOUNT_NAMES.map((name, i) => {
    const tier = TIER_FORCE[name] || TIERS[i % 3].tier;
    const base = tier === 'Enterprise' ? 150000 : tier === 'Growth' ? 45000 : 8000;
    // Deterministic ARR from name hash so reordering never changes truth keys we care about
    const arr = base + Math.floor(rand() * 80000);
    return {
      id: id('acc', i + 1),
      name,
      tier,
      region: REGIONS[i % REGIONS.length],
      arr,
      owner_employee_id: id('emp', (i % 12) + 1),
      status: i % 11 === 0 ? 'churn_risk' : 'active',
      created_at: '2024-01-15T00:00:00.000Z',
    };
  });

  const employees = Array.from({ length: 12 }, (_, i) => ({
    id: id('emp', i + 1),
    name: `Agent ${String.fromCharCode(65 + i)}`,
    team: pick(['Support', 'Engineering', 'CSM', 'Sales']),
    region: REGIONS[i % REGIONS.length],
  }));

  const products = [
    { id: 'prd-platform', name: 'Platform', components: ['cmp-auth', 'cmp-billing', 'cmp-api', 'cmp-notify'] },
    { id: 'prd-search', name: 'Search', components: ['cmp-search'] },
    { id: 'prd-pipeline', name: 'Pipeline', components: ['cmp-ingest'] },
    { id: 'prd-frontend', name: 'Frontend', components: ['cmp-ui'] },
    { id: 'prd-intel', name: 'Intelligence', components: ['cmp-ml'] },
  ];

  const issues = [];
  let issueN = 1;
  for (const c of COMPONENTS) {
    const n = 2 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k++) {
      const open = rand() > 0.35;
      issues.push({
        id: id('iss', issueN++),
        title: `${c.name} defect ${k + 1}`,
        component_id: c.id,
        component_name: c.name,
        status: open ? pick(['open', 'in_progress']) : 'closed',
        severity: pick(['S1', 'S2', 'S3']),
        created_at: '2026-06-01T00:00:00.000Z',
      });
    }
  }

  const tickets = [];
  let ticketN = 1;
  const subjects = [
    'Login loop after SSO',
    'Invoice double charge',
    'Search returns empty',
    'Ingest lag spike',
    'UI blank on Safari',
    'API 500 on /v2/export',
    'Email notifications delayed',
    'ML score NaN',
    'Rate limit false positive',
    'Webhook retries stuck',
    'Dashboard timeout',
    'Permission denied on admin',
  ];

  // Noise tickets: force non-P1 or non-open so planted cases dominate open-P1 set.
  // A few open P2/P3 keep list endpoints busy without polluting SLA breach set.
  for (let i = 0; i < 90; i++) {
    const acc = pick(accounts);
    const cmp = pick(COMPONENTS);
    const priority = pick(['P2', 'P2', 'P3', 'P3', 'P4', 'P1']);
    // Open P1 only rarely and only for Starter (no SLA) so they never become breaches
    let status = pick(['open', 'open', 'pending', 'solved', 'closed']);
    if (priority === 'P1' && status === 'open') {
      // re-roll to non-open OR attach to Starter-only path below
      status = pick(['pending', 'solved', 'closed']);
    }
    const ageH = 1 + Math.floor(rand() * 200);
    const created = new Date(REF_MS - ageH * 3600 * 1000).toISOString();
    tickets.push({
      id: id('tkt', ticketN++),
      subject: `${pick(subjects)} #${i}`,
      priority,
      status,
      account_id: acc.id,
      component_id: cmp.id,
      component_name: cmp.name,
      created_at: created,
      first_response_at: status === 'open' && rand() > 0.5 ? null : created,
    });
  }

  // Planted open P1s designed for SLA breaches / joins (deterministic)
  const planted = [
    // Enterprise 30m SLA — old → breach
    { acc: 'Vantara', cmp: 'cmp-auth', subject: 'P1 SSO outage Vantara', ageH: 5 },
    { acc: 'Stark Industries', cmp: 'cmp-billing', subject: 'P1 Billing halt Stark', ageH: 8 },
    { acc: 'Wayne Enterprises', cmp: 'cmp-api', subject: 'P1 API cascade Wayne', ageH: 3 },
    // Growth 120m SLA — old → breach
    { acc: 'Northwind', cmp: 'cmp-search', subject: 'P1 Search blackhole Northwind', ageH: 6 },
    { acc: 'Globex', cmp: 'cmp-ingest', subject: 'P1 Ingest stalled Globex', ageH: 10 },
    // Growth ��� 1h old ��� NOT breach (under 2h)
    { acc: 'Hooli', cmp: 'cmp-ui', subject: 'P1 UI crash Hooli', ageH: 1 },
    // Starter — no SLA — never breach
    { acc: 'Soylent', cmp: 'cmp-notify', subject: 'P1 Notify lag Soylent', ageH: 48 },
    // Enterprise — 20 min ��� NOT breach
    { acc: 'Umbrella', cmp: 'cmp-ml', subject: 'P1 ML offline Umbrella', ageH: 0.3 },
    // Extra open P1 breaches for multi-page paging
    { acc: 'Initech', cmp: 'cmp-auth', subject: 'P1 Auth flapping Initech', ageH: 12 },
    { acc: 'Cyberdyne', cmp: 'cmp-api', subject: 'P1 API latency Cyberdyne', ageH: 4 },
    { acc: 'Aperture', cmp: 'cmp-billing', subject: 'P1 Invoice stuck Aperture', ageH: 7 },
    { acc: 'Tyrell', cmp: 'cmp-ingest', subject: 'P1 Pipeline backpressure Tyrell', ageH: 9 },
  ];

  for (const p of planted) {
    const acc = accounts.find((a) => a.name === p.acc);
    const cmp = COMPONENTS.find((c) => c.id === p.cmp);
    const created = new Date(REF_MS - p.ageH * 3600 * 1000).toISOString();
    tickets.push({
      id: id('tkt', ticketN++),
      subject: p.subject,
      priority: 'P1',
      status: 'open',
      account_id: acc.id,
      component_id: cmp.id,
      component_name: cmp.name,
      created_at: created,
      first_response_at: null,
    });
  }

  // Ensure each planted component has at least one OPEN eng issue
  for (const p of planted) {
    const open = issues.find((i) => i.component_id === p.cmp && i.status !== 'closed');
    if (!open) {
      issues.push({
        id: id('iss', issueN++),
        title: `Open tracker for ${p.cmp}`,
        component_id: p.cmp,
        component_name: COMPONENTS.find((c) => c.id === p.cmp).name,
        status: 'open',
        severity: 'S1',
        created_at: '2026-06-15T00:00:00.000Z',
      });
    }
  }

  const deals = accounts.slice(0, 15).map((a, i) => ({
    id: id('deal', i + 1),
    account_id: a.id,
    name: `${a.name} expansion`,
    stage: pick(['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
    amount: 10000 + Math.floor(rand() * 200000),
  }));

  const contracts = accounts.map((a, i) => ({
    id: id('ctr', i + 1),
    account_id: a.id,
    msa_tier: a.tier,
    renewal_at: '2027-01-01T00:00:00.000Z',
    auto_renew: true,
  }));

  const articles = Array.from({ length: 40 }, (_, i) => ({
    id: id('kb', i + 1),
    title: `Runbook ${i + 1}: ${pick(COMPONENTS).name}`,
    tags: [pick(['sla', 'p1', 'billing', 'auth', 'api'])],
    body: 'Long article body intentionally omitted from list endpoints; use get_article.',
  }));

  const incidents = Array.from({ length: 20 }, (_, i) => ({
    id: id('inc', i + 1),
    title: `Incident ${i + 1}`,
    severity: pick(['SEV1', 'SEV2', 'SEV3']),
    status: pick(['open', 'mitigated', 'closed']),
    component_id: pick(COMPONENTS).id,
  }));

  const deployments = Array.from({ length: 30 }, (_, i) => ({
    id: id('dep', i + 1),
    service: pick(COMPONENTS).name,
    version: `1.${i}.0`,
    at: new Date(REF_MS - i * 86400000).toISOString(),
    status: pick(['success', 'success', 'rollback']),
  }));

  return {
    accounts,
    employees,
    products,
    components: COMPONENTS,
    issues,
    tickets,
    deals,
    contracts,
    articles,
    incidents,
    deployments,
    tiers: TIERS,
    regions: REGIONS,
  };
}

const W = buildWorld();

// ---------- ground truth for the hard bench task ----------
function hoursBetween(iso) {
  return (REF_MS - Date.parse(iso)) / 3600000;
}

function computeTruth() {
  const openP1 = W.tickets.filter((t) => t.priority === 'P1' && t.status === 'open');
  const breaches = [];
  for (const t of openP1) {
    const acc = W.accounts.find((a) => a.id === t.account_id);
    const sla = W.tiers.find((x) => x.tier === acc.tier);
    if (sla.first_response_minutes == null) continue; // Starter
    const ageH = hoursBetween(t.created_at);
    const thresholdH = sla.first_response_minutes / 60;
    if (ageH > thresholdH) {
      const related = W.issues.filter(
        (i) => i.component_id === t.component_id && i.status !== 'closed',
      );
      breaches.push({
        ticket_id: t.id,
        subject: t.subject,
        account_name: acc.name,
        account_tier: acc.tier,
        arr: acc.arr,
        age_hours: +ageH.toFixed(2),
        sla_hours: thresholdH,
        hours_overdue: +(ageH - thresholdH).toFixed(2),
        component_id: t.component_id,
        component_name: t.component_name,
        related_open_issue_count: related.length,
        related_open_issue_ids: related.map((r) => r.id).sort(),
      });
    }
  }
  breaches.sort((a, b) => a.subject.localeCompare(b.subject));
  // Unique account ARR at risk (do not double-count multi-ticket accounts)
  const accArr = new Map();
  for (const b of breaches) accArr.set(b.account_name, b.arr);
  const arrAtRisk = [...accArr.values()].reduce((s, n) => s + n, 0);
  let top = null;
  for (const [name, arr] of accArr) {
    if (!top || arr > top.arr) top = { account_name: name, arr };
  }
  // Expected breaches from planted set (for docs)
  // Enterprise/Growth planted old enough: Vantara, Stark, Wayne, Northwind, Globex,
  // Initech, Cyberdyne, Aperture, Tyrell = 9. Hooli under SLA, Umbrella under, Soylent no SLA.
  return {
    reference_now: REF_NOW,
    open_p1_count: openP1.length,
    breach_count: breaches.length,
    arr_at_risk: arrAtRisk,
    top_account_at_risk: top ? top.account_name : null,
    top_account_arr: top ? top.arr : null,
    breach_subjects_sorted: breaches.map((b) => b.subject),
    accounts_in_breach_sorted: [...accArr.keys()].sort(),
    breaches,
  };
}

const TRUTH = computeTruth();

// ---------- helpers ----------
function pageOf(arr, page = 1, per_page = PAGE) {
  const p = Math.max(1, Number(page) || 1);
  const pp = Math.min(50, Math.max(1, Number(per_page) || PAGE));
  const start = (p - 1) * pp;
  const slice = arr.slice(start, start + pp);
  return {
    data: slice,
    page: p,
    per_page: pp,
    total: arr.length,
    total_pages: Math.max(1, Math.ceil(arr.length / pp)),
    has_more: start + pp < arr.length,
  };
}

function textResult(obj) {
  return { content: [{ type: 'text', text: JSON.stringify(obj) }] };
}

// Verbose descriptions inflate MCP definition tax (the point of this fixture).
const LONG = (s) =>
  s +
  ' Returns JSON. Respect pagination via page/per_page when present. ' +
  'Do not invent identifiers. Prefer exact id lookups over fuzzy search. ' +
  'Cross-entity joins must use foreign keys (account_id, component_id), never subject-text matching. ' +
  'This tool is part of the Acme Ops multi-system surface (CRM, Support, Engineering, SLA, KB, Deploys).';

// ---------- tools (~47) ----------
const TOOLS = [
  {
    name: 'server_info',
    description: LONG('Server metadata: name, version, reference_now clock used for SLA age calculations, page size defaults.'),
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_tool_categories',
    description: LONG('High-level grouping of available tools for discovery. Does not replace tools/list.'),
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'describe_data_model',
    description: LONG('Verbose multi-system data model documentation: entities, keys, join paths, SLA rules by tier. Large payload.'),
    inputSchema: { type: 'object', properties: { section: { type: 'string', enum: ['all', 'crm', 'support', 'eng', 'sla'] } } },
  },
  {
    name: 'list_accounts',
    description: LONG('List CRM accounts (paginated). Fields: id, name, tier, region, arr, status, owner_employee_id.'),
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', description: '1-based page' },
        per_page: { type: 'integer', description: 'page size 1-50' },
        region: { type: 'string' },
        tier: { type: 'string', enum: ['Enterprise', 'Growth', 'Starter'] },
        status: { type: 'string' },
      },
    },
  },
  {
    name: 'get_account',
    description: LONG('Fetch a single CRM account by id (acc-####).'),
    inputSchema: { type: 'object', properties: { account_id: { type: 'string' } }, required: ['account_id'] },
  },
  {
    name: 'get_account_by_name',
    description: LONG('Exact account name lookup. Case-sensitive.'),
    inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
  },
  {
    name: 'search_accounts',
    description: LONG('Substring search on account name. Prefer get_account_by_name when exact.'),
    inputSchema: { type: 'object', properties: { q: { type: 'string' }, page: { type: 'integer' }, per_page: { type: 'integer' } }, required: ['q'] },
  },
  {
    name: 'count_accounts',
    description: LONG('Count accounts with optional tier/region filters.'),
    inputSchema: { type: 'object', properties: { tier: { type: 'string' }, region: { type: 'string' } } },
  },
  {
    name: 'list_regions',
    description: LONG('List region codes used by accounts and employees.'),
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_tiers',
    description: LONG('List commercial tiers (not full SLA policy — use list_sla_policies).'),
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_tickets',
    description: LONG('List support tickets paginated. Optional filters: priority, status, account_id, component_id. Open P1 detection requires combining filters and paging ALL pages.'),
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        per_page: { type: 'integer' },
        priority: { type: 'string', enum: ['P1', 'P2', 'P3', 'P4'] },
        status: { type: 'string', enum: ['open', 'pending', 'solved', 'closed'] },
        account_id: { type: 'string' },
        component_id: { type: 'string' },
      },
    },
  },
  {
    name: 'get_ticket',
    description: LONG('Get ticket by id (tkt-####).'),
    inputSchema: { type: 'object', properties: { ticket_id: { type: 'string' } }, required: ['ticket_id'] },
  },
  {
    name: 'list_open_p1_tickets',
    description: LONG('Convenience: open P1 tickets only (still paginated). Does NOT include account ARR or SLA breach computation.'),
    inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' } } },
  },
  {
    name: 'get_ticket_account',
    description: LONG('Resolve ticket → account foreign key join (ticket_id → account object).'),
    inputSchema: { type: 'object', properties: { ticket_id: { type: 'string' } }, required: ['ticket_id'] },
  },
  {
    name: 'compute_ticket_age_hours',
    description: LONG('Age of ticket in hours relative to server reference_now (not wall clock).'),
    inputSchema: { type: 'object', properties: { ticket_id: { type: 'string' } }, required: ['ticket_id'] },
  },
  {
    name: 'count_tickets',
    description: LONG('Count tickets with optional priority/status filters.'),
    inputSchema: { type: 'object', properties: { priority: { type: 'string' }, status: { type: 'string' } } },
  },
  {
    name: 'list_ticket_priorities',
    description: LONG('Enumerate priority enum values.'),
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_ticket_statuses',
    description: LONG('Enumerate ticket status enum values.'),
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_issues',
    description: LONG('List engineering issues paginated. Filter by status, severity, component_id.'),
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        per_page: { type: 'integer' },
        status: { type: 'string' },
        severity: { type: 'string' },
        component_id: { type: 'string' },
      },
    },
  },
  {
    name: 'get_issue',
    description: LONG('Get engineering issue by id (iss-####).'),
    inputSchema: { type: 'object', properties: { issue_id: { type: 'string' } }, required: ['issue_id'] },
  },
  {
    name: 'list_open_issues_for_component',
    description: LONG('Open+in_progress issues for a component_id. Correct join key for ticket���issue correlation.'),
    inputSchema: { type: 'object', properties: { component_id: { type: 'string' } }, required: ['component_id'] },
  },
  {
    name: 'get_issue_component',
    description: LONG('Issue ��� component metadata.'),
    inputSchema: { type: 'object', properties: { issue_id: { type: 'string' } }, required: ['issue_id'] },
  },
  {
    name: 'list_components',
    description: LONG('List product components (join key component_id).'),
    inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' } } },
  },
  {
    name: 'get_component',
    description: LONG('Component by id.'),
    inputSchema: { type: 'object', properties: { component_id: { type: 'string' } }, required: ['component_id'] },
  },
  {
    name: 'list_products',
    description: LONG('Products and nested component id lists.'),
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_product',
    description: LONG('Product by id.'),
    inputSchema: { type: 'object', properties: { product_id: { type: 'string' } }, required: ['product_id'] },
  },
  {
    name: 'list_sla_policies',
    description: LONG('MSA tier → first_response_minutes. Starter has null (no contractual SLA).'),
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_sla_for_tier',
    description: LONG('SLA policy for a single tier name.'),
    inputSchema: { type: 'object', properties: { tier: { type: 'string' } }, required: ['tier'] },
  },
  {
    name: 'get_reference_now',
    description: LONG('Canonical clock for age/SLA math. Always use this, not local time.'),
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'evaluate_ticket_sla',
    description: LONG('Per-ticket SLA evaluation: age_hours, threshold_hours, is_breach, hours_overdue. Requires correct tier join.'),
    inputSchema: { type: 'object', properties: { ticket_id: { type: 'string' } }, required: ['ticket_id'] },
  },
  {
    name: 'list_employees',
    description: LONG('Employees paginated.'),
    inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' }, team: { type: 'string' } } },
  },
  {
    name: 'get_employee',
    description: LONG('Employee by id.'),
    inputSchema: { type: 'object', properties: { employee_id: { type: 'string' } }, required: ['employee_id'] },
  },
  {
    name: 'list_teams',
    description: LONG('Distinct team names.'),
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_deals',
    description: LONG('Pipeline deals paginated.'),
    inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' }, stage: { type: 'string' } } },
  },
  {
    name: 'get_deal',
    description: LONG('Deal by id.'),
    inputSchema: { type: 'object', properties: { deal_id: { type: 'string' } }, required: ['deal_id'] },
  },
  {
    name: 'list_contracts',
    description: LONG('Contracts / MSA tier bindings per account.'),
    inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' } } },
  },
  {
    name: 'get_contract_for_account',
    description: LONG('Contract for account_id.'),
    inputSchema: { type: 'object', properties: { account_id: { type: 'string' } }, required: ['account_id'] },
  },
  {
    name: 'list_articles',
    description: LONG('Knowledge articles paginated (titles only).'),
    inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' }, tag: { type: 'string' } } },
  },
  {
    name: 'get_article',
    description: LONG('Full article body by id.'),
    inputSchema: { type: 'object', properties: { article_id: { type: 'string' } }, required: ['article_id'] },
  },
  {
    name: 'search_articles',
    description: LONG('Search KB titles.'),
    inputSchema: { type: 'object', properties: { q: { type: 'string' }, page: { type: 'integer' } }, required: ['q'] },
  },
  {
    name: 'list_incidents',
    description: LONG('Ops incidents paginated.'),
    inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' }, status: { type: 'string' } } },
  },
  {
    name: 'get_incident',
    description: LONG('Incident by id.'),
    inputSchema: { type: 'object', properties: { incident_id: { type: 'string' } }, required: ['incident_id'] },
  },
  {
    name: 'list_deployments',
    description: LONG('Recent deployments paginated.'),
    inputSchema: { type: 'object', properties: { page: { type: 'integer' }, per_page: { type: 'integer' } } },
  },
  {
    name: 'get_usage_for_account',
    description: LONG('Synthetic product usage metrics for an account (noise for wrong-path agents).'),
    inputSchema: { type: 'object', properties: { account_id: { type: 'string' } }, required: ['account_id'] },
  },
  {
    name: 'resolve_entity',
    description: LONG('Ambiguous resolver: tries account/ticket/issue by id prefix. Prefer dedicated get_* tools.'),
    inputSchema: { type: 'object', properties: { ref: { type: 'string' } }, required: ['ref'] },
  },
  {
    name: 'health_check',
    description: LONG('Liveness probe.'),
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'suggest_related_issues_by_subject',
    description: LONG('HEURISTIC ONLY — matches issues by title token overlap with ticket subject. Unreliable for production joins; component_id is the correct key. Included to tempt agents into Cartesian/wrong joins.'),
    inputSchema: { type: 'object', properties: { ticket_id: { type: 'string' } }, required: ['ticket_id'] },
  },
];

function filterTickets(args = {}) {
  let arr = W.tickets.slice();
  if (args.priority) arr = arr.filter((t) => t.priority === args.priority);
  if (args.status) arr = arr.filter((t) => t.status === args.status);
  if (args.account_id) arr = arr.filter((t) => t.account_id === args.account_id);
  if (args.component_id) arr = arr.filter((t) => t.component_id === args.component_id);
  return arr;
}

function filterIssues(args = {}) {
  let arr = W.issues.slice();
  if (args.status) arr = arr.filter((i) => i.status === args.status);
  if (args.severity) arr = arr.filter((i) => i.severity === args.severity);
  if (args.component_id) arr = arr.filter((i) => i.component_id === args.component_id);
  return arr;
}

function callTool(name, args = {}) {
  switch (name) {
    case 'server_info':
      return {
        name: 'acme-ops-complex',
        version: '1.0.0',
        reference_now: REF_NOW,
        default_page_size: PAGE,
        tool_count: TOOLS.length,
        systems: ['crm', 'support', 'engineering', 'sla', 'kb', 'deploys'],
      };
    case 'list_tool_categories':
      return {
        categories: {
          meta: ['server_info', 'list_tool_categories', 'describe_data_model', 'health_check'],
          crm: ['list_accounts', 'get_account', 'get_account_by_name', 'search_accounts', 'count_accounts'],
          support: ['list_tickets', 'get_ticket', 'list_open_p1_tickets', 'get_ticket_account', 'evaluate_ticket_sla'],
          engineering: ['list_issues', 'list_open_issues_for_component', 'list_components', 'list_products'],
          sla: ['list_sla_policies', 'get_sla_for_tier', 'get_reference_now'],
        },
      };
    case 'describe_data_model': {
      const all = {
        join_paths: [
          'ticket.account_id -> account.id',
          'ticket.component_id -> component.id -> issue.component_id',
          'account.tier -> sla_policies.tier',
        ],
        warning: 'Never join tickets to issues via subject text. Use component_id.',
        sla: W.tiers,
        entities: {
          accounts: W.accounts.length,
          tickets: W.tickets.length,
          issues: W.issues.length,
          components: W.components.length,
        },
      };
      if (!args.section || args.section === 'all') return all;
      if (args.section === 'sla') return { sla: W.tiers, reference_now: REF_NOW };
      if (args.section === 'crm') return { accounts: W.accounts.length, fields: ['id', 'name', 'tier', 'arr'] };
      if (args.section === 'support') return { tickets: W.tickets.length, priorities: ['P1', 'P2', 'P3', 'P4'] };
      if (args.section === 'eng') return { issues: W.issues.length, components: W.components };
      return all;
    }
    case 'list_accounts': {
      let arr = W.accounts.slice();
      if (args.region) arr = arr.filter((a) => a.region === args.region);
      if (args.tier) arr = arr.filter((a) => a.tier === args.tier);
      if (args.status) arr = arr.filter((a) => a.status === args.status);
      return pageOf(arr, args.page, args.per_page);
    }
    case 'get_account': {
      const a = W.accounts.find((x) => x.id === args.account_id);
      if (!a) throw new Error('account not found');
      return a;
    }
    case 'get_account_by_name': {
      const a = W.accounts.find((x) => x.name === args.name);
      if (!a) throw new Error('account not found');
      return a;
    }
    case 'search_accounts': {
      const q = String(args.q || '').toLowerCase();
      return pageOf(
        W.accounts.filter((a) => a.name.toLowerCase().includes(q)),
        args.page,
        args.per_page,
      );
    }
    case 'count_accounts': {
      let arr = W.accounts;
      if (args.tier) arr = arr.filter((a) => a.tier === args.tier);
      if (args.region) arr = arr.filter((a) => a.region === args.region);
      return { count: arr.length };
    }
    case 'list_regions':
      return { regions: W.regions };
    case 'list_tiers':
      return { tiers: W.tiers.map((t) => t.tier) };
    case 'list_tickets':
      return pageOf(filterTickets(args), args.page, args.per_page);
    case 'get_ticket': {
      const t = W.tickets.find((x) => x.id === args.ticket_id);
      if (!t) throw new Error('ticket not found');
      return t;
    }
    case 'list_open_p1_tickets':
      return pageOf(
        W.tickets.filter((t) => t.priority === 'P1' && t.status === 'open'),
        args.page,
        args.per_page,
      );
    case 'get_ticket_account': {
      const t = W.tickets.find((x) => x.id === args.ticket_id);
      if (!t) throw new Error('ticket not found');
      const a = W.accounts.find((x) => x.id === t.account_id);
      return { ticket_id: t.id, account: a };
    }
    case 'compute_ticket_age_hours': {
      const t = W.tickets.find((x) => x.id === args.ticket_id);
      if (!t) throw new Error('ticket not found');
      return { ticket_id: t.id, age_hours: +hoursBetween(t.created_at).toFixed(4), reference_now: REF_NOW };
    }
    case 'count_tickets':
      return { count: filterTickets(args).length };
    case 'list_ticket_priorities':
      return { priorities: ['P1', 'P2', 'P3', 'P4'] };
    case 'list_ticket_statuses':
      return { statuses: ['open', 'pending', 'solved', 'closed'] };
    case 'list_issues':
      return pageOf(filterIssues(args), args.page, args.per_page);
    case 'get_issue': {
      const i = W.issues.find((x) => x.id === args.issue_id);
      if (!i) throw new Error('issue not found');
      return i;
    }
    case 'list_open_issues_for_component': {
      const arr = W.issues.filter(
        (i) => i.component_id === args.component_id && i.status !== 'closed',
      );
      return { component_id: args.component_id, data: arr, count: arr.length };
    }
    case 'get_issue_component': {
      const i = W.issues.find((x) => x.id === args.issue_id);
      if (!i) throw new Error('issue not found');
      const c = W.components.find((x) => x.id === i.component_id);
      return { issue_id: i.id, component: c };
    }
    case 'list_components':
      return pageOf(W.components, args.page, args.per_page);
    case 'get_component': {
      const c = W.components.find((x) => x.id === args.component_id);
      if (!c) throw new Error('component not found');
      return c;
    }
    case 'list_products':
      return { data: W.products };
    case 'get_product': {
      const p = W.products.find((x) => x.id === args.product_id);
      if (!p) throw new Error('product not found');
      return p;
    }
    case 'list_sla_policies':
      return { data: W.tiers, reference_now: REF_NOW };
    case 'get_sla_for_tier': {
      const s = W.tiers.find((x) => x.tier === args.tier);
      if (!s) throw new Error('unknown tier');
      return s;
    }
    case 'get_reference_now':
      return { reference_now: REF_NOW, unix_ms: REF_MS };
    case 'evaluate_ticket_sla': {
      const t = W.tickets.find((x) => x.id === args.ticket_id);
      if (!t) throw new Error('ticket not found');
      const a = W.accounts.find((x) => x.id === t.account_id);
      const sla = W.tiers.find((x) => x.tier === a.tier);
      const ageH = hoursBetween(t.created_at);
      if (sla.first_response_minutes == null) {
        return {
          ticket_id: t.id,
          account_tier: a.tier,
          age_hours: +ageH.toFixed(4),
          threshold_hours: null,
          is_breach: false,
          hours_overdue: 0,
          reason: 'no_contractual_sla',
        };
      }
      const th = sla.first_response_minutes / 60;
      const breach = ageH > th;
      return {
        ticket_id: t.id,
        account_id: a.id,
        account_name: a.name,
        account_tier: a.tier,
        arr: a.arr,
        age_hours: +ageH.toFixed(4),
        threshold_hours: th,
        is_breach: breach,
        hours_overdue: breach ? +(ageH - th).toFixed(4) : 0,
      };
    }
    case 'list_employees': {
      let arr = W.employees;
      if (args.team) arr = arr.filter((e) => e.team === args.team);
      return pageOf(arr, args.page, args.per_page);
    }
    case 'get_employee': {
      const e = W.employees.find((x) => x.id === args.employee_id);
      if (!e) throw new Error('employee not found');
      return e;
    }
    case 'list_teams':
      return { teams: [...new Set(W.employees.map((e) => e.team))].sort() };
    case 'list_deals': {
      let arr = W.deals;
      if (args.stage) arr = arr.filter((d) => d.stage === args.stage);
      return pageOf(arr, args.page, args.per_page);
    }
    case 'get_deal': {
      const d = W.deals.find((x) => x.id === args.deal_id);
      if (!d) throw new Error('deal not found');
      return d;
    }
    case 'list_contracts':
      return pageOf(W.contracts, args.page, args.per_page);
    case 'get_contract_for_account': {
      const c = W.contracts.find((x) => x.account_id === args.account_id);
      if (!c) throw new Error('contract not found');
      return c;
    }
    case 'list_articles': {
      let arr = W.articles;
      if (args.tag) arr = arr.filter((a) => a.tags.includes(args.tag));
      return pageOf(
        arr.map(({ id, title, tags }) => ({ id, title, tags })),
        args.page,
        args.per_page,
      );
    }
    case 'get_article': {
      const a = W.articles.find((x) => x.id === args.article_id);
      if (!a) throw new Error('article not found');
      return a;
    }
    case 'search_articles': {
      const q = String(args.q || '').toLowerCase();
      return pageOf(
        W.articles.filter((a) => a.title.toLowerCase().includes(q)).map(({ id, title }) => ({ id, title })),
        args.page,
        10,
      );
    }
    case 'list_incidents': {
      let arr = W.incidents;
      if (args.status) arr = arr.filter((i) => i.status === args.status);
      return pageOf(arr, args.page, args.per_page);
    }
    case 'get_incident': {
      const i = W.incidents.find((x) => x.id === args.incident_id);
      if (!i) throw new Error('incident not found');
      return i;
    }
    case 'list_deployments':
      return pageOf(W.deployments, args.page, args.per_page);
    case 'get_usage_for_account': {
      const a = W.accounts.find((x) => x.id === args.account_id);
      if (!a) throw new Error('account not found');
      // Deterministic synthetic usage (avoid mutating PRNG mid-session differently)
      const n = parseInt(String(args.account_id).replace(/\D/g, '') || '1', 10);
      return {
        account_id: a.id,
        mau: 1000 + n * 137,
        api_calls_30d: 10000 + n * 999,
        storage_gb: +((n % 50) + 0.5).toFixed(1),
      };
    }
    case 'resolve_entity': {
      const ref = String(args.ref || '');
      if (ref.startsWith('acc-')) return { type: 'account', entity: W.accounts.find((a) => a.id === ref) || null };
      if (ref.startsWith('tkt-')) return { type: 'ticket', entity: W.tickets.find((t) => t.id === ref) || null };
      if (ref.startsWith('iss-')) return { type: 'issue', entity: W.issues.find((i) => i.id === ref) || null };
      return { type: 'unknown', entity: null };
    }
    case 'health_check':
      return { ok: true, reference_now: REF_NOW };
    case 'suggest_related_issues_by_subject': {
      const t = W.tickets.find((x) => x.id === args.ticket_id);
      if (!t) throw new Error('ticket not found');
      const tokens = t.subject.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const scored = W.issues.map((i) => {
        const title = i.title.toLowerCase();
        const hits = tokens.filter((tok) => title.includes(tok)).length;
        return { issue: i, hits };
      });
      scored.sort((a, b) => b.hits - a.hits);
      return {
        warning: 'heuristic_subject_overlap_unreliable',
        ticket_id: t.id,
        suggestions: scored.slice(0, 5).map((s) => s.issue),
      };
    }
    default:
      throw new Error('unknown tool ' + name);
  }
}

// ---------- stdio MCP ----------
function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

if (process.argv.includes('--truth')) {
  const { breaches, ...pub } = TRUTH;
  console.log(JSON.stringify({ ...pub, tool_count: TOOLS.length, seed: SEED }, null, 2));
  process.exit(0);
}
if (process.argv.includes('--tools')) {
  console.log(JSON.stringify(TOOLS.map((t) => t.name), null, 2));
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', async (line) => {
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
          serverInfo: { name: 'acme-ops-complex', version: '1.0.0' },
        },
      });
    }
    if (method === 'notifications/initialized' || (method && method.startsWith('notifications/'))) return;
    if (method === 'tools/list') return send({ jsonrpc: '2.0', id: rid, result: { tools: TOOLS } });
    if (method === 'tools/call') {
      const result = callTool(params.name, params.arguments || {});
      return send({ jsonrpc: '2.0', id: rid, result: textResult(result) });
    }
    if (rid !== undefined) send({ jsonrpc: '2.0', id: rid, error: { code: -32601, message: 'Method not found' } });
  } catch (e) {
    if (rid !== undefined) send({ jsonrpc: '2.0', id: rid, error: { code: -32000, message: String(e.message || e) } });
  }
});

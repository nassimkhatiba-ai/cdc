---
name: github-cdc
description: Call the GitHub v3 REST API API by writing sandboxed Node scripts (CDC pattern — no MCP server, no schemas in context). Use when the user asks to query, analyze, or automate anything involving GitHub v3 REST API. Read only the CDC.md sections you need.
---

# GitHub v3 REST API via CDC

Base URL: https://api.github.com

## How to call this API (CDC pattern)

Write ONE Node.js (18+) script per question. Rules:
1. No auth scheme declared; many endpoints may work unauthenticated.
2. Fetch only what you need; paginate with per_page/page params where offered.
3. Do ALL filtering/aggregation/arithmetic IN THE SCRIPT — never in your head.
4. Print ONLY the final answer to stdout. Raw API payloads must never be
   echoed, logged, or pasted into the conversation.
5. On HTTP errors, print status + first 200 chars of the body and stop.

## Finding endpoints (progressive disclosure — do NOT read all of CDC.md)

CDC.md in this skill folder holds one line per endpoint, grouped under
`## <tag>` headings. Grep it for the tag or path you need, e.g.:

```
grep -A 200 "^## repos" CDC.md | head -50     # section view
grep "GET /users" CDC.md                       # path search
```

Tags available:
- actions (187 endpoints)
- activity (32 endpoints)
- agent-tasks (5 endpoints)
- agents (30 endpoints)
- apps (37 endpoints)
- billing (13 endpoints)
- campaigns (5 endpoints)
- checks (12 endpoints)
- classroom (6 endpoints)
- code-quality (4 endpoints)
- code-scanning (21 endpoints)
- code-security (20 endpoints)
- codes-of-conduct (2 endpoints)
- codespaces (48 endpoints)
- copilot (29 endpoints)
- copilot-spaces (28 endpoints)
- credentials (1 endpoints)
- dependabot (25 endpoints)
- dependency-graph (5 endpoints)
- emojis (1 endpoints)
- enterprise-team-memberships (6 endpoints)
- enterprise-team-organizations (6 endpoints)
- enterprise-teams (5 endpoints)
- gists (20 endpoints)
- git (13 endpoints)
- gitignore (2 endpoints)
- hosted-compute (6 endpoints)
- interactions (14 endpoints)
- issues (55 endpoints)
- licenses (3 endpoints)
- markdown (2 endpoints)
- meta (5 endpoints)
- migrations (22 endpoints)
- oidc (8 endpoints)
- orgs (108 endpoints)
- packages (27 endpoints)
- private-registries (6 endpoints)
- projects (26 endpoints)
- pulls (27 endpoints)
- rate-limit (1 endpoints)
- reactions (15 endpoints)
- repos (203 endpoints)
- search (7 endpoints)
- secret-scanning (9 endpoints)
- security-advisories (10 endpoints)
- teams (32 endpoints)
- users (47 endpoints)

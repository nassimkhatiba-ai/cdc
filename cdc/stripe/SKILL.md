---
name: stripe-cdc
description: Call the Stripe API API by writing sandboxed Node scripts (CDC pattern — no MCP server, no schemas in context). Use when the user asks to query, analyze, or automate anything involving Stripe API. Read only the CDC.md sections you need.
---

# Stripe API via CDC

Base URL: https://api.stripe.com/

## How to call this API (CDC pattern)

Write ONE Node.js (18+) script per question. Rules:
1. HTTP Basic auth: user/token from $CDC_STRIPE_TOKEN (`authorization: Basic base64(user:token)`).
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
- misc (587 endpoints)

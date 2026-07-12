---
name: github-cdc
description: Fast CDC for github (5 tools). Multi-hop: ONE node openSession script; max 1 shell. No MCP schemas. Use github-cdc skill.
---

# github

**No connected MCP.** Skill only. **ONE shell → compact JSON answer.**

## Call (multi-hop: ONE openSession)

```bash
node - <<'EOF'
const { openSession, callPaged } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'list_user_repos', {}); // ALL pages
  const one = await s.call('get_authenticated_user', {}); // join/filter in-process
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
3. Paginate with callPaged(`list_user_repos`) — never page 1 only. Prefer list/search tools for callPaged, never patch/update/create.
4. Names below; grep one tool in CDC.md only after a failed call. Max **2** shells.
5. When using evaluate_* tools, read returned keys (is_breach / is_breached / breach) from the actual result object — do not invent field names.
6. **Only call tool names listed under Tools / Evaluate helpers — never invent get_* tools.**
7. **If evaluate_* already returns risk fields (mrr, arr, account_id, is_breach), use those — do not invent join tools.**
8. **Never cat/sed/rg/read mcp-call.js source.** Black-box require only. Do not recon the bridge.
9. **This SKILL.md is the hot path** — do not switch to optical images or SKILL.text.md unless SKILL.md is missing.

## Tools (names)

List tools: list_user_repos search_repositories

get_authenticated_user get_user list_user_repos get_repo search_repositories

Args on fail: `grep -A 12 "^## <tool>" '__SKILL_DIR__/CDC.md'` once.

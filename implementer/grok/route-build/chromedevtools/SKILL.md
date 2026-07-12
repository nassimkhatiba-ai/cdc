---
name: chromedevtools-cdc
description: Fast CDC for chromedevtools (29 tools). Multi-hop: ONE node openSession script; max 1 shell. No MCP schemas. Use chromedevtools-cdc skill.
---

# chromedevtools

**No connected MCP.** Skill only. **ONE shell → compact JSON answer.**

## Call (multi-hop: ONE openSession)

```bash
node - <<'EOF'
const { openSession } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const one = await s.call('click', {}); // join/filter in-process
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
3. Aggregate in-process; final line is compact answer JSON only.
4. Names below; grep one tool in CDC.md only after a failed call. Max **2** shells.
5. When using evaluate_* tools, read returned keys (is_breach / is_breached / breach) from the actual result object — do not invent field names.
6. **Only call tool names listed under Tools / Evaluate helpers — never invent get_* tools.**
7. **If evaluate_* already returns risk fields (mrr, arr, account_id, is_breach), use those — do not invent join tools.**
8. **Never cat/sed/rg/read mcp-call.js source.** Black-box require only. Do not recon the bridge.
9. **This SKILL.md is the hot path** — do not switch to optical images or SKILL.text.md unless SKILL.md is missing.

## Evaluate / join helpers

- evaluate_script(function*, args:[], filePath, dialogAction) — Evaluate a JavaScript function inside the currently selected page

Use server field names from tool results (e.g. is_breach, mrr, arr). Do not invent boolean field names.

## Tools (names)

List tools: list_console_messages list_network_requests list_pages

click close_page drag emulate evaluate_script fill fill_form get_console_message get_network_request handle_dialog hover lighthouse_audit list_console_messages list_network_requests list_pages navigate_page new_page performance_analyze_insight performance_start_trace performance_stop_trace press_key resize_page select_page take_heapsnapshot take_screenshot take_snapshot type_text upload_file wait_for

Args on fail: `grep -A 12 "^## <tool>" '__SKILL_DIR__/CDC.md'` once.

---
name: playwright-cdc
description: Call playwright via short Node scripts (CDC). Compact tool index; no full MCP schemas in context. Use for playwright.
---

# playwright

Plain calls need NO script: `node /Users/nesbes/mcp-a;t/implementer/mega20/skills/playwright-cdc/mcp-call.js <tool> '<json-args>'` · batch: `--batch '[{"tool":"t","args":{}},...]'`

Multi-step / aggregation — ONE inline script (bash heredoc, never a script file):

```bash
node - <<'EOF'
const { openSession, callPaged } = require('/Users/nesbes/mcp-a;t/implementer/mega20/skills/playwright-cdc/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'list_tool', { /* filters */ }); // fetches ALL pages
  const one = await s.call('tool_name', { /* args */ });
  console.log(JSON.stringify(answer)); // aggregate in code first
  s.close();
})();
EOF
```

A background daemon keeps the server warm: repeat calls skip cold start and server STATE (browser pages, auth sessions) persists across scripts. `daemon-stop` ends it; env `CDC_MCP_DAEMON=0` disables.

Rules:
1. ONE session per script — never one per call.
2. List tools paginate — use callPaged, never just page 1. Aggregate in code; print ONLY the final compact JSON in the EXACT requested shape.
3. Tool prose is not an answer — extract the value. Named resource (id, owner/name)? Direct lookup, never global search.
4. Empty/zero/implausible result = bug: re-check args against the signatures. Max 2 runs.

## Tools

### browser
browser_close() — Close the page
browser_resize(width*:number, height*:number) — Resize the browser window
browser_console_messages(level*:"error"|"warning"|"info"|"debug", all:boolean, filename) — Returns all console messages
browser_handle_dialog(accept*:boolean, promptText) — Handle a dialog
browser_evaluate(element, target, function*, filename) — Evaluate JavaScript expression on page or element
browser_file_upload(paths:[]) — Upload one or multiple files
browser_drop(element, target*, paths:[], data:{}) — Drop files or MIME-typed data onto an element, as if dragged from outside the page
browser_find(text, regex) — Search the accessibility snapshot of the current page for text or a regular expression
browser_fill_form(fields*:[]) — Fill multiple form fields
browser_press_key(key*) — Press a key on the keyboard
browser_type(element, target*, text*, submit:boolean, slowly:boolean) — Type text into editable element
browser_navigate(url*) — Navigate to a URL
browser_navigate_back() — Go back to the previous page in the history
browser_network_requests(static*:boolean, filter, filename) — Returns a numbered list of network requests since loading the page
browser_network_request(index*:integer, part:"request-headers"|"request-body"|"response-headers"|"response-body", filename) — Returns full details (headers and body) of a single network request, or a single part i…
browser_run_code_unsafe(code, filename) — Run a Playwright code snippet
browser_take_screenshot(element, target, type*:"png"|"jpeg", filename, fullPage:boolean, scale*:"css"|"device") — Take a screenshot of the current page
browser_snapshot(target, filename, depth:number, boxes:boolean) — Capture accessibility snapshot of the current page, this is better than screenshot
browser_click(element, target*, doubleClick:boolean, button:"left"|"right"|"middle", modifiers:[]) — Perform click on a web page
browser_drag(startElement, startTarget*, endElement, endTarget*) — Perform drag and drop between two elements
browser_hover(element, target*) — Hover over element on page
browser_select_option(element, target*, values*:[]) — Select an option in a dropdown
browser_tabs(action*:"list"|"new"|"close"|"select", index:number, url) — List, create, close, or select a browser tab
browser_wait_for(time:number, text, textGone) — Wait for text to appear or disappear or a specified time to pass

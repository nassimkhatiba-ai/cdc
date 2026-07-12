# playwright - CDC

Source: MCP tools/list (24 tools)
Prefer: ONE openSession script that does ALL work then prints ONLY answer keys. --batch only for tiny independent probes.

## Multi-step (primary for multi-hop)

```bash
node - <<'EOF'
const { openSession } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const one = await s.call('browser_close', { /* real args */ });
  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed
  // Answer helper: print JSON once; never dump tool results to chat.
  console.log(JSON.stringify(/* compact answer only */));
  s.close();
})();
EOF
```

## browser
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

## _index
browser_click
browser_close
browser_console_messages
browser_drag
browser_drop
browser_evaluate
browser_file_upload
browser_fill_form
browser_find
browser_handle_dialog
browser_hover
browser_navigate
browser_navigate_back
browser_network_request
browser_network_requests
browser_press_key
browser_resize
browser_run_code_unsafe
browser_select_option
browser_snapshot
browser_tabs
browser_take_screenshot
browser_type
browser_wait_for

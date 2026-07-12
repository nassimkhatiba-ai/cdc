# chromedevtools - CDC

Source: MCP tools/list (29 tools)
Prefer: ONE openSession script that does ALL work then prints ONLY answer keys. --batch only for tiny independent probes.

## Multi-step (primary for multi-hop)

```bash
node - <<'EOF'
const { openSession } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const one = await s.call('click', { /* real args */ });
  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed
  // Answer helper: print JSON once; never dump tool results to chat.
  console.log(JSON.stringify(/* compact answer only */));
  s.close();
})();
EOF
```

## close
close_page(pageId*:number) — Closes the page by its index

## evaluate
evaluate_script(function*, args:[], filePath, dialogAction) — Evaluate a JavaScript function inside the currently selected page

## fill
fill_form(elements*:[], includeSnapshot:boolean) — Fill out multiple form elements (inputs, selects, checkboxes, radios) at once

## get
get_console_message(msgid*:number) — Gets a console message by its ID
get_network_request(reqid:number, requestFilePath, responseFilePath) — Gets a network request by an optional reqid, if omitted returns the currently selected …

## handle
handle_dialog(action*:"accept"|"dismiss", promptText) — If a browser dialog was opened, use this command to handle it

## lighthouse
lighthouse_audit(mode:"navigation"|"snapshot", device:"desktop"|"mobile", outputDirPath) — Get Lighthouse score and reports for accessibility, SEO, best practices, and agentic br…

## list
list_console_messages(pageSize:integer, pageIdx:integer, types:[], includePreservedMessages:boolean, serviceWorkerId) — List all console messages for the currently selected page since the last navigation
list_network_requests(pageSize:integer, pageIdx:integer, resourceTypes:[], includePreservedRequests:boolean) — List all requests for the currently selected page since the last navigation
list_pages() — Get a list of pages open in the browser

## misc
click(uid*, dblClick:boolean, includeSnapshot:boolean) — Clicks on the provided element
drag(from_uid*, to_uid*, includeSnapshot:boolean) — Drag an element onto another element
emulate(networkConditions:"Offline"|"Slow 3G"|"Fast 3G"|"Slow 4G"|"Fast 4G", cpuThrottlingRate:number, geolocation, userAgent, colorScheme:"dark"|"light"|"auto", viewport, extraHttpHeaders) — Emulates various features on the selected page
fill(uid*, value*, includeSnapshot:boolean) — Type text into an input, text area or select an option from a <select> element
hover(uid*, includeSnapshot:boolean) — Hover over the provided element

## navigate
navigate_page(type:"url"|"back"|"forward"|"reload", url, ignoreCache:boolean, handleBeforeUnload:"accept"|"decline", initScript, timeout:integer) — Go to a URL, or back, forward, or reload

## new
new_page(url*, background:boolean, isolatedContext, timeout:integer) — Open a new tab and load a URL

## performance
performance_analyze_insight(insightSetId*, insightName*) — Provides more detailed information on a specific Performance Insight of an insight set …
performance_start_trace(reload:boolean, autoStop:boolean, filePath) — Start a performance trace on the selected webpage
performance_stop_trace(filePath) — Stop the active performance trace recording on the selected webpage

## press
press_key(key*, includeSnapshot:boolean) — Press a key or key combination

## resize
resize_page(width*:number, height*:number) — Resizes the selected page's window so that the page has specified dimension

## select
select_page(pageId*:number, bringToFront:boolean) — Select a page as a context for future tool calls

## take
take_heapsnapshot(filePath*) — Capture a heap snapshot of the currently selected page
take_screenshot(format:"png"|"jpeg"|"webp", quality:number, uid, fullPage:boolean, filePath) — Take a screenshot of the page or element
take_snapshot(verbose:boolean, filePath) — Take a text snapshot of the currently selected page based on the a11y tree

## type
type_text(text*, submitKey) — Type text using keyboard into a previously focused input

## upload
upload_file(uid*, filePath*, includeSnapshot:boolean) — Upload a file through a provided element

## wait
wait_for(text*:[], timeout:integer) — Wait for the specified text to appear on the selected page

## _index
click
close_page
drag
emulate
evaluate_script
fill
fill_form
get_console_message
get_network_request
handle_dialog
hover
lighthouse_audit
list_console_messages
list_network_requests
list_pages
navigate_page
new_page
performance_analyze_insight
performance_start_trace
performance_stop_trace
press_key
resize_page
select_page
take_heapsnapshot
take_screenshot
take_snapshot
type_text
upload_file
wait_for

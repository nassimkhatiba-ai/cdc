# puppeteer - CDC

Source: MCP tools/list (7 tools)
Prefer: node mcp-call.js --batch (ONE shell call). Answer: JSON.stringify once; never dump tool results.

## puppeteer
puppeteer_navigate(url*, launchOptions:{}, allowDangerous:boolean) — Navigate to a URL
puppeteer_screenshot(name*, selector, width:number, height:number, encoded:boolean) — Take a screenshot of the current page or a specific element
puppeteer_click(selector*) — Click an element on the page
puppeteer_fill(selector*, value*) — Fill out an input field
puppeteer_select(selector*, value*) — Select an element on the page with Select tag
puppeteer_hover(selector*) — Hover an element on the page
puppeteer_evaluate(script*) — Execute JavaScript in the browser console

## _index
puppeteer_click
puppeteer_evaluate
puppeteer_fill
puppeteer_hover
puppeteer_navigate
puppeteer_screenshot
puppeteer_select

---
name: puppeteer-cdc
description: Fast CDC for puppeteer (7 tools). ONE shell: node mcp-call.js --batch '[{tool,args}...]'. No MCP schemas. Use puppeteer-cdc skill.
---

# puppeteer

**No connected MCP.** Skill only. **ONE shell → compact JSON answer.**

## Call

```bash
node '__SKILL_DIR__/mcp-call.js' --batch '[{"tool":"puppeteer_navigate","args":{}}]'
```

Single: `node '__SKILL_DIR__/mcp-call.js' puppeteer_navigate '{}'`

Daemon warm. Do **not** list tools first. Do **not** cat SKILL.md if already loaded. Fill real args from Tools below — never invent names or placeholder values.

## Rules

1. **Max 1 shell run** for simple tasks: one `--batch` (or one single call) with **real** args. No openSession. No CDC.md. No tool listing.
2. Bridge prints compact one-line JSON. Then print **ONLY** final answer keys once — e.g. `console.log(JSON.stringify({key: value}))`. Never dump raw tool results to chat.
3. Wrong/empty: fix args from Tools below. Max **1** retry (2 shell runs total).
4. **Never cat/sed/rg mcp-call.js** — treat it as a black-box require. API is only: CLI single call, CLI `--batch`, or `require` + `callTool`/`callTools`.

## Tools

### puppeteer
puppeteer_navigate(url*, launchOptions:{}, allowDangerous:boolean) — Navigate to a URL
puppeteer_screenshot(name*, selector, width:number, height:number, encoded:boolean) — Take a screenshot of the current page or a specific element
puppeteer_click(selector*) — Click an element on the page
puppeteer_fill(selector*, value*) — Fill out an input field
puppeteer_select(selector*, value*) — Select an element on the page with Select tag
puppeteer_hover(selector*) — Hover an element on the page
puppeteer_evaluate(script*) — Execute JavaScript in the browser console

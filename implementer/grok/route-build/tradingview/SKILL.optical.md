---
name: tradingview-cdc-optical
description: Optional optical view of tradingview. Prefer SKILL.md (text) as the hot path. Images: tradingview.cdc.png.
---

# tradingview (optical sidecar — optional)

Prefer **SKILL.md** (text) for normal use. Optical pages list tools for vision hosts only.

Images: `tradingview.cdc.png`

Bridge (same as text): `node __SKILL_DIR__/mcp-call.js <tool> '<json>'` · `--batch` · `openSession()`/`callPaged()`.

Never cat/sed mcp-call.js. Grep CDC.md for one tool signature on fail only.

---
name: tradingview-cdc
description: Fast CDC for tradingview (27 tools). Multi-hop: ONE node openSession script; max 1 shell. No MCP schemas. Use tradingview-cdc skill.
---

# tradingview

**No connected MCP.** Skill only. **ONE shell → compact JSON answer.**

## Call (multi-hop: ONE openSession)

```bash
node - <<'EOF'
const { openSession } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const one = await s.call('top_gainers', {}); // join/filter in-process
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

## Tools (names)

top_gainers top_losers bollinger_scan rating_filter coin_analysis consecutive_candles_scan advanced_candle_pattern volume_breakout_scanner volume_confirmation_analysis smart_volume_scanner multi_agent_analysis egx_market_overview egx_sector_scan egx_sector_scanner egx_index_analysis egx_stock_screener egx_trade_plan egx_fibonacci_retracement multi_timeframe_analysis market_sentiment financial_news combined_analysis backtest_strategy compare_strategies walk_forward_backtest_strategy yahoo_price market_snapshot

Args on fail: `grep -A 12 "^## <tool>" '__SKILL_DIR__/CDC.md'` once.

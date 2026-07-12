# tradingview - CDC

Source: MCP tools/list (27 tools)
Prefer: ONE openSession script that does ALL work then prints ONLY answer keys. --batch only for tiny independent probes.

## Multi-step (primary for multi-hop)

```bash
node - <<'EOF'
const { openSession } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const one = await s.call('top_gainers', { /* real args */ });
  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed
  // Answer helper: print JSON once; never dump tool results to chat.
  console.log(JSON.stringify(/* compact answer only */));
  s.close();
})();
EOF
```

## advanced
advanced_candle_pattern(exchange, base_timeframe, pattern_length:integer, min_size_increase:number, limit:integer) — Advanced candle pattern analysis using multi-timeframe data

## backtest
backtest_strategy(symbol*, strategy*, period, initial_capital:number, commission_pct:number, slippage_pct:number, interval, include_trade_log:boolean,...) — Backtest a trading strategy on historical data with institutional-grade metrics

## bollinger
bollinger_scan(exchange, timeframe, bbw_threshold:number, limit:integer) — Scan for assets with low Bollinger Band Width (squeeze detection)

## coin
coin_analysis(symbol*, exchange, timeframe) — Get detailed analysis for a specific asset (coin or stock) on specified exchange and ti…

## combined
combined_analysis(symbol*, exchange, timeframe) — POWER TOOL: TradingView technical analysis + Reddit sentiment + Financial news

## compare
compare_strategies(symbol*, period, initial_capital:number, interval) — Run all 6 strategies (RSI, Bollinger, MACD, EMA Cross, Supertrend, Donchian) and return…

## consecutive
consecutive_candles_scan(exchange, timeframe, pattern_type, candle_count:integer, min_growth:number, limit:integer) — Scan for coins with consecutive growing/shrinking candles pattern

## egx
egx_market_overview(timeframe, limit:integer) — Get a comprehensive overview of the Egyptian Exchange (EGX) market
egx_sector_scan(sector, timeframe, limit:integer) — Scan EGX stocks by sector
egx_sector_scanner(timeframe, top_n_sectors:integer, top_n_stocks:integer, min_stock_score:integer) — Sector rotation scanner for EGX — identifies hot/cold sectors and top picks
egx_index_analysis(index, timeframe, limit:integer) — Analyse an EGX index showing constituent performance with full indicators
egx_stock_screener(timeframe, min_score:integer, index_filter, limit:integer) — Production stock ranking engine for EGX — finds strong stocks with actionable setups
egx_trade_plan(symbol*, timeframe) — Generate a full trade plan for a specific EGX stock
egx_fibonacci_retracement(symbol*, lookback, timeframe) — Fibonacci retracement analysis for EGX stocks

## financial
financial_news(symbol, category, limit:integer) — Real-time financial news from RSS feeds (Reuters, CoinDesk, etc.) Args: symbol: Optiona…

## market
market_sentiment(symbol*, category, limit:integer) — Real-time Reddit sentiment analysis for stocks and crypto
market_snapshot() — Global market overview: major indices, top crypto, FX rates, and key ETFs

## multi
multi_agent_analysis(symbol*, exchange, timeframe) — Run a multi-agent debate (Technical, Sentiment, Risk) for a specific symbol
multi_timeframe_analysis(symbol*, exchange) — Multi-timeframe alignment analysis (Weekly → Daily → 4H → 1H → 15m)

## rating
rating_filter(exchange, timeframe, rating:integer, limit:integer) — Filter coins by Bollinger Band rating

## smart
smart_volume_scanner(exchange, min_volume_ratio:number, min_price_change:number, rsi_range, limit:integer) — Smart volume + technical analysis combination scanner

## top
top_gainers(exchange, timeframe, limit:integer) — Return top gainers for an exchange and timeframe using Bollinger Band analysis
top_losers(exchange, timeframe, limit:integer) — Return top losers for an exchange and timeframe

## volume
volume_breakout_scanner(exchange, timeframe, volume_multiplier:number, price_change_min:number, limit:integer) — Detect coins with volume breakout + price breakout
volume_confirmation_analysis(symbol*, exchange, timeframe) — Detailed volume confirmation analysis for a specific coin

## walk
walk_forward_backtest_strategy(symbol*, strategy*, period, initial_capital:number, commission_pct:number, slippage_pct:number, n_splits:integer, train_ratio:number,...) — Walk-forward backtest to detect overfitting — validates strategy on unseen data

## yahoo
yahoo_price(symbol*) — Real-time price quote from Yahoo Finance for any stock, crypto, ETF or index

## _index
advanced_candle_pattern
backtest_strategy
bollinger_scan
coin_analysis
combined_analysis
compare_strategies
consecutive_candles_scan
egx_fibonacci_retracement
egx_index_analysis
egx_market_overview
egx_sector_scan
egx_sector_scanner
egx_stock_screener
egx_trade_plan
financial_news
market_sentiment
market_snapshot
multi_agent_analysis
multi_timeframe_analysis
rating_filter
smart_volume_scanner
top_gainers
top_losers
volume_breakout_scanner
volume_confirmation_analysis
walk_forward_backtest_strategy
yahoo_price

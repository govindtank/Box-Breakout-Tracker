# 📊 Darvas Box Breakout Tracker

A real-time trading dashboard that detects **Darvas Box** patterns on crypto markets using Binance data. Features live charting, automated backtesting, and performance analytics.

Built with React 19, TypeScript, Vite 6, Tailwind CSS 4, and lightweight-charts (TradingView library).

## Features

- **Darvas Box Detection** — State machine algorithm identifies box tops/bottoms using configurable ghost-day lookback
- **Breakout Trading Signals** — Auto-generates BUY/SELL markers on breakout/breakdown events
- **Backtesting Engine** — Calculates PnL, win rate, profit factor, Sharpe ratio, and max drawdown
- **Live Chart** — TradingView-style candlestick chart with box overlay lines and trade markers
- **Binance Integration** — Fetches historical data and supports WebSocket real-time updates for BTC, ETH, and SOL
- **Risk Management Panel** — Auto-stop loss, position sizing, and capital allocation controls
- **Execution Log** — Real-time trade history with PnL tracking
- **Dark Terminal UI** — Professional dark theme with custom scrollbars and responsive layout

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your GEMINI_API_KEY (optional, for AI features)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build & Deploy

```bash
npm run build    # Outputs to dist/
npm run preview  # Preview production build locally
```

The project is deployed via GitHub Pages at:
👉 **[https://govindtank.github.io/Box-Breakout-Tracker](https://govindtank.github.io/Box-Breakout-Tracker)**

## Tech Stack

| Component | Library |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Charts | lightweight-charts (TradingView) |
| Data | Binance REST + WebSocket APIs |
| Icons | Lucide React |
| Animation | Motion |

## Supported Pairs

- BTC/USDT
- ETH/USDT
- SOL/USDT

## License

MIT

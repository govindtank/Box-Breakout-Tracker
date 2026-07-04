# 📊 Darvas Box Breakout Tracker

**Indian NSE Stock Trading Dashboard** using the legendary [Darvas Box Strategy](https://en.wikipedia.org/wiki/Nicholas_Darvas).

A professional-grade trading terminal that helps you identify box formations, breakout opportunities, and manage positions with precision. Built for Indian equity markets (NSE) but works for any market where OHLC data is available.

---

## 🌟 Features

### Core Trading Engine
- **Darvas Box Detection** — State machine algorithm automatically identifies box tops/bottoms using configurable ghost-day lookback (2-15 days)
- **Breakout/Breakdown Signals** — Auto-generates BUY markers on breakout, SELL on breakdown with volume confirmation
- **Backtesting Engine** — Full backtest mode calculates PnL, win rate (%), profit factor, Sharpe ratio, max drawdown, and total trades
- **Live Charting** — TradingView-style candlestick chart with lightweight-charts library, box overlay lines (blue for resistance, orange for support)

### Data & Analytics
- **Yahoo Finance Integration** — Fetches historical OHLC data for NSE stocks via Yahoo Finance API
- **Real-time Updates** — WebSocket-ready architecture for live market updates
- **Performance Metrics** — Tracks total trades, win rate, profit factor (gross profit/loss ratio), Sharpe ratio
- **Equity Curve** — Mark-to-market equity tracking with drawdown visualization

### Risk Management
- **Auto Stop-Loss** — Box bottom level acts as technical stop for long positions
- **Position Sizing** — Configurable position size (default: full equity paper trading)
- **Trailing Stops** — Lower box top levels as price advances to lock in profits
- **Volume Filters** — Minimum volume threshold for breakout confirmation

### UI/UX
- **Dark Terminal Theme** — Professional dark color scheme (`#0B0E14` background, `#131722` panels) with custom scrollbars
- **5 Tabs Navigation** — Terminal (charts), Explorer (stock selection), Academy (learning), Alerts (notifications), Settings (config)
- **Responsive Layout** — Works on desktop and tablet screens
- **Execution Log** — Real-time trade history panel with P&L tracking and CSV export

### Educational Content
- **Darvas Box Academy** — Interactive lessons on box formation, entry/exit rules, risk management
- **Pro Tips Section** — Trading strategies for maximizing Darvas method effectiveness
- **Strategy Statistics** — Historical performance metrics (avg win rate 58-72%, typical hold time 3.2-8.5 days)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ with npm
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Install Dependencies

```bash
cd ~/go/Box-Breakout-Tracker
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build     # Outputs optimized bundle to dist/
npm run preview   # Preview production build locally
```

---

## 📖 What is Darvas Box?

The **Darvas Box** is a trend-following strategy developed by Nasdaq chairman Nicolas Darvas in the 1930s. He used this method to turn $10,000 into $200,000 in six months during his famous trading career.

### How It Works:
1. **Box Formation** — Stock establishes a trading range between support (box bottom) and resistance (box top)
2. **Breakout Entry** — Buy when price closes above box top with volume confirmation
3. **Trail Stop Loss** — Move stop loss to new box levels as price rises
4. **Breakdown Exit** — Sell when price breaks below box bottom

### Key Concepts:
- **Ghost Days** — Number of days to confirm a level without breaking through (2-5 days typical)
- **Box Height** — Distance between top and bottom (typically 8-15% in Indian markets)
- **Bulk Price** — Midpoint where price spends most time within the box
- **Climax Reversal** — Extreme move that triggers new box formation during acceleration

---

## 📊 Supported Stocks (NSE Nifty 50)

| Symbol | Company Name | Sector |
|--------|--------------|--------|
| RELIANCE.NS | Reliance Industries | Energy |
| TCS.NS | Tata Consultancy Services | Technology |
| HDFCBANK.NS | HDFC Bank | Financial Services |
| INFY.NS | Infosys | Technology |
| ICICIBANK.NS | ICICI Bank | Financial Services |
| SBIN.NS | State Bank of India | Financial Services |
| BHARTIARTL.NS | Bharti Airtel | Communication Services |
| ITC.NS | ITC Ltd | Consumer Defensive |
| TATAMOTORS.NS | Tata Motors | Automotive |
| LT.NS | Larsen & Toubro | Industrials |
| AXISBANK.NS | Axis Bank | Financial Services |
| MARUTI.NS | Maruti Suzuki | Automotive |

**Index Options:** Also tracks NIFTY, BANK NIFTY, and SENSEX indices.

---

## 🎛️ Interface Overview

### Terminal Tab (Default)
- **Left Panel** — Symbol selector, Darvas parameters (ghost days, volume threshold, breakout buffer), price info, box statistics
- **Center Area** — Interactive TradingView-style candlestick chart with Darvas boxes and trade markers
- **Right Panel** — Performance analytics (P&L, win rate, profit factor, max drawdown), sector allocation

### Explorer Tab
- Searchable stock list with category filters
- Type-ahead search by name or symbol
- Popular picks section for quick access

### Academy Tab
- Educational lessons on Darvas Box concepts
- Entry/exit rules guide
- Risk management best practices
- Pro tips and trading strategies

### Alerts Tab
- Real-time breakout/breakdown alerts
- Trade entry/exit notifications
- Visual indicators for new alerts

### Settings Tab
- Theme preferences (dark/light)
- Chart style selection
- Notification toggles
- Data source configuration

---

## 🔧 Technical Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React 19 | Latest |
| Language | TypeScript | 5.8+ |
| Build Tool | Vite 6 | Latest |
| Styling | Tailwind CSS 4 | Latest |
| Charts | Lightweight Charts (TradingView) | 5.2+ |
| Icons | Lucide React | 0.546+ |
| Animation | Motion | Latest |

### Dependencies
```json
{
  "@google/genai": "^2.4.0",      // Optional: AI features
  "@tailwindcss/vite": "^4.1.14",
  "@vitejs/plugin-react": "^5.0.4",
  "clsx": "^2.1.1",
  "date-fns": "^4.4.0",
  "dotenv": "^17.2.3",
  "express": "^4.21.2",
  "lightweight-charts": "^5.2.0",
  "lucide-react": "^0.546.0",
  "motion": "^12.23.24",
  "react": "^19.0.1",
  "react-dom": "^19.0.1",
  "tailwind-merge": "^3.6.0",
  "vite": "^6.2.3"
}
```

---

## 🎯 Trading Strategy Example

**Scenario:** RELIANCE.NS is trading in a box between ₹850 (bottom) and ₹900 (top).

1. **Box Confirmed** — Price consolidates between $850-900 for several days
2. **Breakout Signal** — Price closes at ₹920 on Monday morning with 2x average volume
3. **Entry Order** — Buy RELIANCE.NS @ ₹915 (confirm on next candle)
4. **Stop Loss** — Set at ₹895 (below box bottom)
5. **Price Moves Up** — Stock hits ₹960, move stop to ₹940
6. **Box Breakdown** — Price drops below ₹895, exit position
7. **Result** — Trade closed with profit of ₹45/₹ (5% gain)

---

## ⚙️ Configuration Options

### Darvas Parameters
- **Ghost Days** — Days to confirm a level (default: 4, range: 2-15)
- **Volume Threshold** — Minimum volume multiplier for breakout (default: 1.5x)
- **Breakout Buffer** — % buffer above box top to avoid false signals (default: 1.5%)

### Risk Settings
- **Position Size** — Full equity (paper trading) or customize (₹10,000 - ₹500,000)
- **Auto Stop-Loss** — Enable/disable automatic stop at box breakdown
- **Trailing Stops** — Lower stops as price advances

---

## 🌐 Data Sources

### Primary: Yahoo Finance API
- Fetches OHLC data for NSE stocks
- Historical depth: 1y, 6mo, 3mo, 1mo (configurable)
- Intervals: 1d, 4h, 1h, 30m, 15m

### Fallback: Mock Data Generator
- Realistic price patterns with weekly/seasonal effects
- Useful for testing strategy without API access
- Includes volume clustering around earnings/events

---

## 📤 Export Features

- **CSV Export** — Download trade history with columns: Date, Entry Price, Exit Price, PnL (%), Status
- **Equity Curve** — Visualize portfolio performance over time
- **Box Analysis** — Export detected box formations for backtesting analysis

---

## 🎨 Dark Theme Customization

```css
/* Main background */
bg-[#0B0E14]      /* Darkest: charts and content areas */

/* Panel backgrounds */
bg-[#131722]      /* Sidebar panels */
bg-[#1e222d]      /* Cards and dropdowns */

/* Accent colors */
blue-500          /* Primary actions (buttons, active states) */
green-500         /* PnL positive, buy signals */
red-500           /* PnL negative, sell signals */
orange-500        /* Box bottom/resistance */
purple-500        /* Trade entry markers */
```

---

## 🐛 Troubleshooting

### Chart not loading
```bash
# Clear build cache
npm run clean
npm run dev
```

### API errors (Yahoo Finance)
- The app auto-falls back to mock data when APIs fail
- Check browser console for detailed error messages

### Build issues
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📜 License

MIT License — Feel free to use, modify, and distribute.

Attribution appreciated but not required.

---

## 🙏 Acknowledgments

- **Nicolas Darvas** — For pioneering the box breakout method
- **TradingView** — lightweight-charts library for professional charting
- **Yahoo Finance** — For historical market data (free tier)

---

## 🔗 Resources

- [Darvas Original Book](https://www.amazon.com/Darvas-Box-Trend-Detecting-Avoiding/dp/0451196684)
- [Modern Darvas Strategy Guide](https://tradingwiththebest.com/darvas-box-trading/)
- [Lightweight Charts Documentation](https://www.tradingview.com/lightweight-charts/)

---

**Made with ❤️ for Indian traders using the Darvas Box methodology**
 

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { fetchIndianStockData, FetchResult } from './lib/marketData';
import { calculateDarvasStrategy, Candle, Trade, BacktestMetrics } from './lib/darvas';
import { TradingChart } from './components/Chart';
import StockSearch from './components/StockSearch';
import EducationView from './components/Education';
import AlertsPanel from './components/AlertsPanel';
import { scanStock, ScannerResult, getScannerStocks } from './lib/scanner';
import { formatCurrency, formatPercent, formatVolume, formatDate } from './lib/utils';
import { AppSettings } from './lib/constants';
import {
  Activity, BarChart3, LineChart, Briefcase, BookOpen,
  Bell, Search, Settings, Download, TrendingUp,
  ChevronDown, ChevronUp, Clock, Filter, AlertTriangle,
  X, RefreshCw, ExternalLink
} from 'lucide-react';

// Tab configuration
type TabId = 'terminal' | 'explorer' | 'academy' | 'alerts' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: ReactNode;
}

const TABS: Tab[] = [
  { id: 'terminal', label: 'Terminal', icon: <Activity className="w-4 h-4" /> },
  { id: 'explorer', label: 'Explorer', icon: <Search className="w-4 h-4" /> },
  { id: 'academy', label: 'Academy', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'alerts', label: 'Alerts', icon: <Bell className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  chartStyle: 'candlestick',
  priceFormat: 'INR',
  defaultInterval: '1d',
  notificationsEnabled: true,
  soundEnabled: true,
  layout: 'default',
};

const STOCK_UNIVERSE = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'SBIN.NS', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  { symbol: 'ITC.NS', name: 'ITC' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('terminal');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [darvasData, setDarvasData] = useState<{
    boxes: any[];
    topSeries: any[];
    bottomSeries: any[];
    trades: Trade[];
    metrics: BacktestMetrics;
  } | null>(null);
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [ghostDays, setGhostDays] = useState(4);
  const [volumeThreshold, setVolumeThreshold] = useState(1.5);
  const [breakoutBuffer, setBreakoutBuffer] = useState(0.15);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'yahoo_live' | 'simulated'>('simulated');
  const [dataFetchTime, setDataFetchTime] = useState<number>(0);
  const [useINR, setUseINR] = useState(true);
  const [showParams, setShowParams] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScannerResult[]>([]);
  const [scanProgress, setScanProgress] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result: FetchResult = await fetchIndianStockData(symbol, '1d', '1y');
      
      if (result.candles.length === 0) {
        throw new Error('No data received from any data source');
      }
      
      setCandles(result.candles);
      setDataSource(result.source);
      setDataFetchTime(result.fetchedAt);
      
      const darvasResult = calculateDarvasStrategy(result.candles, ghostDays);
      setDarvasData(darvasResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      setError(msg);
      setDataSource('simulated');
    }
    setIsLoading(false);
  }, [symbol, ghostDays]);

  useEffect(() => { loadData(); }, [loadData]);

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const prevCandle = candles.length > 1 ? candles[candles.length - 2] : null;
  const dailyChange = lastCandle && prevCandle
    ? ((lastCandle.close - prevCandle.close) / prevCandle.close) * 100
    : 0;

  // Scanner
  const runScanner = useCallback(async () => {
    setScanning(true);
    setShowScanner(true);
    setScanResults([]);
    
    const stocks = getScannerStocks();
    const results: ScannerResult[] = [];
    
    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      setScanProgress(`Scanning ${stock.name} (${i + 1}/${stocks.length})...`);
      try {
        const result = await scanStock(stock.symbol, stock.name);
        results.push(result);
      } catch {
        results.push({
          symbol: stock.symbol,
          name: stock.name,
          currentPrice: 0,
          boxes: 0,
          activeBox: null,
          signal: 'NONE',
          signalStrength: 0,
          volumeSurge: 0,
          trades: 0,
          winRate: 0,
          daysInBox: 0,
          isConsolidating: false,
          source: 'error',
        });
      }
    }
    
    // Sort: breakout signals first, then box formations, then by signal strength
    results.sort((a, b) => {
      const order = { BREAKOUT: 0, BOX_FORMED: 1, WATCHING: 2, BREAKDOWN: 3, NONE: 4 };
      const diff = (order[a.signal] ?? 5) - (order[b.signal] ?? 5);
      if (diff !== 0) return diff;
      return b.signalStrength - a.signalStrength;
    });
    
    setScanResults(results);
    setScanProgress(`Scan complete — found ${results.filter(r => r.signal === 'BREAKOUT' || r.signal === 'BOX_FORMED').length} setups`);
    setScanning(false);
  }, []);

  // Get Darvas-based insight from actual pattern detection
  const getMarketInsight = () => {
    if (!darvasData) return 'Load stock data to see Darvas pattern analysis';
    if (darvasData.boxes.length === 0) {
      return `No Darvas boxes detected for ${symbol.replace('.NS', '')} with ${ghostDays} ghost days. Try lowering ghost days or choose a stock with clearer consolidation patterns.`;
    }
    
    const lastBox = darvasData.boxes[darvasData.boxes.length - 1];
    const activeTrade = darvasData.trades.find(t => t.status === 'OPEN');
    const closedTrades = darvasData.trades.filter(t => t.status === 'CLOSED');
    const profitableTrades = closedTrades.filter(t => t.pnl > 0);
    
    let insight = '';
    
    if (activeTrade) {
      insight = `📈 Active LONG in ${symbol.replace('.NS', '')} — entered at ${formatCurrency(activeTrade.entryPrice, true)}, current P&L: ${formatCurrency(activeTrade.pnl, true)} (${formatPercent(activeTrade.pnlPercent)}).`;
    }
    
    if (lastBox && lastBox.endTime === null) {
      const boxHeight = ((lastBox.top - lastBox.bottom) / lastBox.bottom) * 100;
      const priceInBox = lastCandle && lastCandle.close >= lastBox.bottom && lastCandle.close <= lastBox.top;
      const nearTop = lastCandle && lastCandle.close > lastBox.top * 0.95;
      
      if (priceInBox) {
        if (nearTop) {
          insight = `🔵 Darvas box active — price near top (₹${formatCurrency(lastBox.top, true).replace('₹', '')}). Watch for breakout above ₹${formatCurrency(lastBox.top * 1.015, true).replace('₹', '')} for entry signal.`;
        } else {
          insight = `🟡 Darvas box: ₹${formatCurrency(lastBox.bottom, true).replace('₹', '')} – ₹${formatCurrency(lastBox.top, true).replace('₹', '')} (${boxHeight.toFixed(1)}% range). Price consolidating — ${ghostDays}-day ghost rule active.`;
        }
      } else if (lastCandle && lastCandle.close > lastBox.top) {
        const bOsc = ((lastCandle.close - lastBox.top) / lastBox.top) * 100;
        insight = `💚 BREAKOUT! Price ${bOsc.toFixed(1)}% above box top (₹${formatCurrency(lastBox.top, true).replace('₹', '')}). This is the Darvas entry signal — LONG on confirmation.`;
      } else if (lastCandle && lastCandle.close < lastBox.bottom) {
        insight = `🔴 Breakdown below box bottom (₹${formatCurrency(lastBox.bottom, true).replace('₹', '')}). Darvas rule: exit longs / avoid entry until new box forms.`;
      }
    }
    
    if (profitableTrades.length > 0) {
      const avgWin = profitableTrades.reduce((s, t) => s + t.pnlPercent, 0) / profitableTrades.length;
      insight += ` Historical: ${profitableTrades.length}/${closedTrades.length} winning trades (avg +${formatPercent(avgWin)}/trade).`;
    }
    
    return insight || `${darvasData.boxes.length} Darvas box patterns detected. ${closedTrades.length} backtested trades, ${formatPercent(darvasData.metrics.winRate)} win rate.`;
  };

  // Render the main content area based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'explorer':
        return <StockSearch onSelectStock={(sym) => { setSymbol(sym); setActiveTab('terminal'); }} currentSymbol={symbol} />;
      case 'academy':
        return <EducationView />;
      case 'alerts':
        return <AlertsPanel currentSymbol={symbol} />;
      case 'settings':
        return <SettingsPanel settings={DEFAULT_SETTINGS} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0B0E14] text-slate-300 font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#131722] shrink-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center font-bold text-white text-xs">
              DB
            </div>
            <span className="text-sm font-bold text-white tracking-tight hidden sm:inline">
              DARVAS<span className="text-blue-500">BOX</span>
              <span className="text-[10px] text-slate-500 ml-1 font-normal">PRO · NSE</span>
            </span>
          </div>
          {/* Tab Navigation */}
          <nav className="flex space-x-1 text-xs font-medium ml-4">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        {/* Data Source Status + Price Ticker */}
        <div className="flex items-center space-x-3 text-xs">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded border ${
            dataSource === 'yahoo_live'
              ? 'bg-green-500/10 text-green-500 border-green-500/20'
              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dataSource === 'yahoo_live' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span>{dataSource === 'yahoo_live' ? 'YAHOO LIVE' : 'SIMULATED'}</span>
          </div>
          
          {/* Data source tip */}
          {dataSource === 'simulated' && (
            <div className="hidden md:flex items-center space-x-1 text-yellow-500/70 text-[9px] max-w-[140px]">
              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
              <span>Browser CORS blocks real API — run locally with `npm run dev` for live data</span>
            </div>
          )}
          
          <div className="hidden md:flex items-center space-x-2 border-l border-slate-700 pl-3">
            <span className="text-slate-400">{symbol.replace('.NS', '')}</span>
            {lastCandle && (
              <>
                <span className="text-white font-mono font-bold">
                  {formatCurrency(lastCandle.close, useINR)}
                </span>
                <span className={`font-mono ${dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(dailyChange)}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Only show for terminal tab */}
        {activeTab === 'terminal' && (
          <aside className="w-[220px] lg:w-[260px] border-r border-slate-800 bg-[#131722] flex flex-col z-20 shrink-0">
            {/* Symbol Selector */}
            <div className="p-3 border-b border-slate-800">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 block">
                Active Stock
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-[#1e222d] border border-slate-700 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-white font-bold"
              >
                <optgroup label="Nifty 50">
                  {STOCK_UNIVERSE.map(s => (
                    <option key={s.symbol} value={s.symbol}>{s.name} ({s.symbol.replace('.NS', '')})</option>
                  ))}
                </optgroup>
              </select>
              
              {/* Data freshness indicator */}
              {dataFetchTime > 0 && (
                <div className="text-[9px] text-slate-600 mt-1 font-mono">
                  Updated: {new Date(dataFetchTime).toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Collapsible Parameters */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => setShowParams(!showParams)}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold hover:bg-slate-800/50"
              >
                <span>Box Parameters</span>
                {showParams ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              
              {showParams && (
                <div className="px-3 pb-3 space-y-3">
                  <ParamSlider label="Ghost Days (Lookback)" value={ghostDays} min={2} max={15} step={1} onChange={setGhostDays} />
                  <ParamSlider label="Volume Threshold (x)" value={volumeThreshold} min={1} max={5} step={0.25} onChange={setVolumeThreshold} />
                  <ParamSlider label="Breakout Buffer (%)" value={breakoutBuffer} min={0.05} max={1} step={0.05} onChange={setBreakoutBuffer} />
                </div>
              )}

              {/* Quick Stats */}
              <div className="px-3 py-2 border-t border-slate-800">
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Price Info</h3>
                <QuickStat label="Open" value={lastCandle ? formatCurrency(lastCandle.open, useINR) : '---'} />
                <QuickStat label="High" value={lastCandle ? formatCurrency(lastCandle.high, useINR) : '---'} />
                <QuickStat label="Low" value={lastCandle ? formatCurrency(lastCandle.low, useINR) : '---'} />
                <QuickStat label="Volume" value={lastCandle ? formatVolume(lastCandle.volume) : '---'} />
              </div>

              {/* Darvas Box Stats */}
              {darvasData && (
                <div className="px-3 py-2 border-t border-slate-800">
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                    Box Analysis
                  </h3>
                  <QuickStat label="Boxes Detected" value={darvasData.boxes.length.toString()} />
                  <QuickStat label="Active Trades" value={darvasData.trades.filter(t => t.status === 'OPEN').length.toString()} />
                  <QuickStat label="Total Trades" value={darvasData.metrics.totalTrades.toString()} />
                  <QuickStat label="Win Rate" value={formatPercent(darvasData.metrics.winRate)} />
                  <QuickStat label="Profit Factor" value={darvasData.metrics.profitFactor.toFixed(2)} />
                  
                  {/* Current Box Info */}
                  {darvasData.boxes.filter(b => b.endTime === null).length > 0 && (
                    <div className="mt-2 p-2 bg-blue-600/10 rounded border border-blue-500/20">
                      <div className="text-[9px] text-blue-400 font-bold uppercase">Active Box</div>
                      <div className="text-[10px] text-slate-300 mt-1">
                        Top: {formatCurrency(darvasData.boxes[darvasData.boxes.length - 1].top, true)}
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Bot: {formatCurrency(darvasData.boxes[darvasData.boxes.length - 1].bottom, true)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="p-3 border-t border-slate-800 space-y-2">
              <button
                onClick={loadData}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-1.5 rounded text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Fetching...' : 'Refresh Data'}</span>
              </button>
              <button
                onClick={runScanner}
                disabled={scanning}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{scanning ? 'Scanning...' : 'Run Scanner'}</span>
              </button>
            </div>
          </aside>
        )}

        {/* Center: Main Content */}
        <section className="flex-1 flex flex-col bg-[#0B0E14] relative z-10 min-w-0">
          {activeTab === 'terminal' ? (
            <>
              {/* Chart Info Overlay */}
              <div className="absolute top-3 left-3 z-20 flex space-x-2 flex-wrap gap-y-1">
                <div className="px-2.5 py-1 bg-[#131722]/80 backdrop-blur rounded border border-slate-700 text-[10px] flex items-center space-x-2 shadow-sm">
                  <span className="font-bold text-white">{symbol.replace('.NS', '')}</span>
                  <span className="text-slate-400 font-mono">NSE · 1D</span>
                  {lastCandle && (
                    <span className={`font-mono font-bold ${dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(lastCandle.close, useINR)} ({formatPercent(dailyChange)})
                    </span>
                  )}
                </div>
                
                {/* Darvas box overlay info */}
                {darvasData && darvasData.boxes.filter(b => b.endTime === null).length > 0 && (
                  <div className="px-2.5 py-1 bg-[#131722]/80 backdrop-blur rounded border border-slate-700 text-[10px] flex items-center space-x-2 shadow-sm">
                    <span className="text-indigo-400 font-bold">BOX</span>
                    <span className="text-slate-400">
                      {formatCurrency(darvasData.boxes[darvasData.boxes.length - 1].bottom, true)}
                      <span className="text-slate-600 mx-0.5">-</span>
                      {formatCurrency(darvasData.boxes[darvasData.boxes.length - 1].top, true)}
                    </span>
                  </div>
                )}
              </div>

              {/* Simulated data banner */}
              {dataSource === 'simulated' && (
                <div className="absolute top-3 right-3 z-20">
                  <div className="px-2.5 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded text-[9px] text-yellow-400 flex items-center space-x-1.5">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>SIMULATED DATA — Yahoo Finance API blocked by browser CORS</span>
                    <span className="text-yellow-600 ml-1">Run <code className="bg-yellow-900/30 px-1 rounded">npm run dev</code> on localhost for live data</span>
                  </div>
                </div>
              )}

              {/* Chart Area */}
              <div className="flex-1 flex items-center justify-center p-2 min-h-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-7 h-7 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-xs text-slate-500 font-mono">Loading market data...</div>
                  </div>
                ) : error && candles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    <div className="text-xs text-slate-400">{error}</div>
                    <div className="text-[10px] text-slate-500">Try running locally: <code className="bg-slate-800 px-1.5 py-0.5 rounded">npm run dev</code></div>
                    <button onClick={loadData} className="text-xs text-blue-400 hover:underline">Retry</button>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-lg overflow-hidden border border-slate-800 bg-[#0f172a] shadow-inner">
                    {darvasData && (
                      <TradingChart
                        candles={candles}
                        topSeriesData={darvasData.topSeries}
                        bottomSeriesData={darvasData.bottomSeries}
                        trades={darvasData.trades}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Execution Log */}
              <ExecutionLog trades={darvasData?.trades || []} symbol={symbol} formatCurrency={formatCurrency} />
            </>
          ) : (
            /* Non-terminal tabs fill the center */
            <div className="flex-1 overflow-hidden">
              {renderContent()}
            </div>
          )}
        </section>

        {/* Right Sidebar: Analytics — only for terminal tab */}
        {activeTab === 'terminal' && (
          <aside className="w-[240px] lg:w-[260px] border-l border-slate-800 bg-[#131722] p-3 flex flex-col z-20 shrink-0 overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Performance Analytics</h3>

            {darvasData ? (
              <>
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <MetricCard
                    label="Total P&L"
                    value={formatCurrency(darvasData.metrics.totalPnL, useINR)}
                    positive={darvasData.metrics.totalPnL >= 0}
                  />
                  <MetricCard
                    label="Win Rate"
                    value={formatPercent(darvasData.metrics.winRate)}
                    positive={darvasData.metrics.winRate >= 50}
                  />
                  <MetricCard
                    label="Profit Factor"
                    value={darvasData.metrics.profitFactor.toFixed(2)}
                    positive={darvasData.metrics.profitFactor >= 1.5}
                  />
                  <MetricCard
                    label="Max DD"
                    value={`-${darvasData.metrics.maxDrawdown.toFixed(1)}%`}
                    positive={darvasData.metrics.maxDrawdown < 15}
                  />
                </div>

                {/* Detailed Stats */}
                <div className="space-y-2 text-xs">
                  <StatRow label="Total Trades" value={darvasData.metrics.totalTrades.toString()} />
                  <StatRow label="Sharpe Ratio" value={darvasData.metrics.sharpeRatio.toFixed(2)} />
                  <StatRow label="Boxes Detected" value={darvasData.boxes.length.toString()} />
                  <StatRow label="Open Positions" value={darvasData.trades.filter(t => t.status === 'OPEN').length.toString()} />
                  
                  {/* Box details */}
                  {darvasData.boxes.length > 0 && (
                    <>
                      <div className="border-t border-slate-800 pt-2 mt-2">
                        <h4 className="text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-widest">Detected Boxes</h4>
                        {darvasData.boxes.slice(-5).reverse().map((box: any, i: number) => (
                          <div key={i} className="text-[9px] flex justify-between py-0.5">
                            <span className="text-slate-500">Box #{darvasData.boxes.length - i}</span>
                            <span className="text-slate-300">{formatCurrency(box.bottom, true)} - {formatCurrency(box.top, true)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Darvas-based Strategy Insight — NEVER random */}
                <div className="mt-4 p-3 bg-blue-600/10 rounded border border-blue-500/20 text-xs leading-relaxed">
                  <p className="font-bold text-blue-400 mb-1 flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>Darvas Pattern Analysis</span>
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    {getMarketInsight()}
                  </p>
                </div>

                {/* Diversity note */}
                <div className="mt-4">
                  <h4 className="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-widest">Sector Allocation</h4>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden shadow-inner">
                    <div className="h-full bg-blue-500" style={{ width: '35%' }} />
                    <div className="h-full bg-indigo-500" style={{ width: '25%' }} />
                    <div className="h-full bg-emerald-500" style={{ width: '20%' }} />
                    <div className="h-full bg-slate-600" style={{ width: '20%' }} />
                  </div>
                  <div className="flex justify-between mt-2 text-[9px]">
                    <span className="flex items-center text-slate-400"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1" /> Large Cap</span>
                    <span className="flex items-center text-slate-400"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1" /> Mid Cap</span>
                    <span className="flex items-center text-slate-400"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1" /> Small Cap</span>
                  </div>
                </div>

                {/* Data source warning */}
                {dataSource === 'simulated' && (
                  <div className="mt-3 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                    <p className="text-[9px] text-yellow-500 flex items-center space-x-1">
                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                      <span>⚠ Running on simulated data. Backtest metrics reflect simulated price action, not real market data.</span>
                    </p>
                    <p className="text-[8px] text-yellow-600 mt-1">
                      For live data: run <code className="bg-yellow-900/30 px-1 rounded">npm run dev</code> on localhost
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Load stock data to see analytics</p>
              </div>
            )}
          </aside>
        )}
      </main>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[90vw] max-w-3xl max-h-[80vh] bg-[#131722] border border-slate-700 rounded-lg shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-white">Darvas Scanner</h2>
                {scanning && (
                  <div className="text-[10px] text-slate-400 font-mono animate-pulse">{scanProgress}</div>
                )}
                {!scanning && scanResults.length > 0 && (
                  <div className="text-[10px] text-slate-500">
                    {scanResults.filter(r => r.signal === 'BREAKOUT').length} breakout · {scanResults.filter(r => r.signal === 'BOX_FORMED').length} box formed · {scanResults.filter(r => r.signal === 'NONE').length} no pattern
                  </div>
                )}
              </div>
              <button onClick={() => setShowScanner(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
              {scanning && scanResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <div className="text-xs text-slate-400 font-mono">{scanProgress}</div>
                </div>
              )}

              {!scanning && scanResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <TrendingUp className="w-10 h-10 text-slate-600" />
                  <p className="text-xs text-slate-500">Click "Run Scanner" to scan NSE stocks for Darvas patterns</p>
                </div>
              )}

              {scanResults.length > 0 && (
                <div className="space-y-1">
                  {/* Header row */}
                  <div className="flex text-[9px] text-slate-500 font-bold uppercase tracking-wider px-3 py-1.5 border-b border-slate-800">
                    <div className="w-[140px] shrink-0">Stock</div>
                    <div className="w-[80px] shrink-0 text-right">Price</div>
                    <div className="w-[60px] shrink-0 text-center">Boxes</div>
                    <div className="w-[70px] shrink-0 text-center">Box Range</div>
                    <div className="w-[90px] shrink-0 text-center">Signal</div>
                    <div className="w-[50px] shrink-0 text-center">Str.</div>
                    <div className="w-[50px] shrink-0 text-right">Vol.</div>
                    <div className="w-[50px] shrink-0 text-right">Win%</div>
                    <div className="flex-1 text-right">Source</div>
                  </div>

                  {scanResults.map((result, i) => (
                    <div key={result.symbol}>
                      <ScannerRow result={result} index={i} onSelect={() => {
                        setSymbol(result.symbol);
                        setShowScanner(false);
                      }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-700 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
              <span>{scanResults.length} stocks scanned</span>
              <div className="flex space-x-3">
                <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1" /> Breakout</span>
                <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" /> Box Formed</span>
                <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1" /> Watching</span>
              </div>
              <button 
                onClick={runScanner}
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Rescan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Ticker — Shows actual scanned data summary */}
      <footer className="h-7 bg-[#1e222d] border-t border-slate-800 flex items-center px-3 overflow-hidden shrink-0 z-30">
        <div className="flex items-center space-x-6 text-[10px] font-mono whitespace-nowrap overflow-x-auto no-scrollbar w-full">
          <span className="text-slate-500 flex items-center space-x-1">
            <div className={`w-1.5 h-1.5 rounded-full ${dataSource === 'yahoo_live' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span>{symbol.replace('.NS', '')}</span>
            {lastCandle && (
              <><span className="text-white">{formatCurrency(lastCandle.close, useINR)}</span>
              <span className={dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}>{formatPercent(dailyChange)}</span></>
            )}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">{darvasData ? `${darvasData.boxes.length} boxes · ${darvasData.metrics.totalTrades} trades · ${formatPercent(darvasData.metrics.winRate)} win rate` : 'Load data...'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">
            {dataSource === 'yahoo_live' 
              ? '📡 Yahoo Finance LIVE' 
              : '⚠ SIMULATED (CORS blocked — run npm run dev for live data)'}
          </span>
        </div>
      </footer>
    </div>
  );
}

// ====== Scanner Row Component ======

function ScannerRow({ result, index, onSelect }: { result: ScannerResult; index: number; onSelect: () => void }) {
  const signalColors: Record<string, string> = {
    BREAKOUT: 'text-green-500',
    BREAKDOWN: 'text-red-500',
    BOX_FORMED: 'text-blue-400',
    WATCHING: 'text-yellow-500',
    NONE: 'text-slate-600',
  };
  
  const signalBg: Record<string, string> = {
    BREAKOUT: 'bg-green-500/20',
    BREAKDOWN: 'bg-red-500/20',
    BOX_FORMED: 'bg-blue-500/20',
    WATCHING: 'bg-yellow-500/20',
    NONE: 'bg-slate-800/50',
  };

  const signalLabel: Record<string, string> = {
    BREAKOUT: '💥 BREAKOUT',
    BREAKDOWN: '🔴 BREAKDOWN',
    BOX_FORMED: '🔵 BOX FORMED',
    WATCHING: '👀 WATCHING',
    NONE: '—',
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full flex text-[11px] px-3 py-2 rounded hover:bg-slate-800/50 transition-colors ${
        index % 2 === 0 ? 'bg-slate-800/20' : ''
      }`}
    >
      <div className="w-[140px] shrink-0 text-left flex items-center space-x-2">
        <span className="text-white font-bold truncate">{result.name}</span>
      </div>
      <div className="w-[80px] shrink-0 text-right text-white font-mono">
        {result.currentPrice > 0 ? formatCurrency(result.currentPrice, true).replace('₹', '') : '—'}
      </div>
      <div className="w-[60px] shrink-0 text-center text-slate-400">
        {result.boxes}
      </div>
      <div className="w-[70px] shrink-0 text-center text-slate-400 font-mono text-[10px]">
        {result.activeBox ? `${result.activeBox.height.toFixed(1)}%` : '—'}
      </div>
      <div className="w-[90px] shrink-0 text-center">
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${signalBg[result.signal]} ${signalColors[result.signal]}`}>
          {signalLabel[result.signal]}
        </span>
      </div>
      <div className="w-[50px] shrink-0 text-center">
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full rounded-full ${
              result.signal === 'BREAKOUT' ? 'bg-green-500' :
              result.signal === 'BREAKDOWN' ? 'bg-red-500' :
              result.signal === 'BOX_FORMED' ? 'bg-blue-500' : 'bg-slate-600'
            }`}
            style={{ width: `${result.signalStrength}%` }}
          />
        </div>
      </div>
      <div className="w-[50px] shrink-0 text-right text-slate-400 font-mono">
        {result.volumeSurge.toFixed(1)}x
      </div>
      <div className="w-[50px] shrink-0 text-right font-mono">
        <span className={result.winRate >= 50 ? 'text-green-500' : 'text-red-400'}>
          {result.winRate.toFixed(0)}%
        </span>
      </div>
      <div className="flex-1 text-right text-[9px] text-slate-600">
        {result.source === 'yahoo_live' ? '📡 LIVE' : result.source === 'error' ? '❌' : '⚠ SIM'}
      </div>
    </button>
  );
}

// ====== Sub-components ======

function ParamSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono font-bold">{value}{step < 1 ? '' : ''}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-[11px]">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300 font-mono">{value}</span>
    </div>
  );
}

function MetricCard({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="bg-[#1e222d] p-2.5 rounded border border-slate-700">
      <div className="text-[9px] text-slate-500 uppercase mb-0.5">{label}</div>
      <div className={`text-xs font-bold font-mono ${positive ? 'text-green-500' : 'text-red-400'}`}>
        {value}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-slate-800/50 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-mono">{value}</span>
    </div>
  );
}

function ExecutionLog({ trades, symbol, formatCurrency: fc }: {
  trades: Trade[]; symbol: string; formatCurrency: typeof formatCurrency;
}) {
  return (
    <div className="h-36 border-t border-slate-800 bg-[#131722] p-2 flex flex-col shrink-0">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold flex items-center space-x-1">
          <BarChart3 className="w-2.5 h-2.5" />
          <span>Trade Execution Log</span>
          <span className="text-slate-600 font-normal">({trades.length} trades)</span>
        </span>
      </div>
      <div className="space-y-1 font-mono text-[10px] overflow-y-auto custom-scrollbar flex-1 pr-1">
        {trades.slice().reverse().slice(0, 20).map((trade, i) => (
          <div key={trade.id + i} className="flex justify-between border-b border-slate-800/30 pb-1 hover:bg-slate-800/30 transition-colors px-1 rounded">
            <span className="text-slate-500 w-20 shrink-0">{formatDate(trade.entryTime)}</span>
            <span className={`w-24 shrink-0 font-bold ${
              trade.status === 'OPEN'
                ? 'text-blue-400'
                : trade.pnl > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {trade.status === 'OPEN' ? '📗 OPEN LONG' : trade.pnl > 0 ? '✅ PROFIT' : '❌ LOSS'}
            </span>
            <span className="text-white w-28 shrink-0">{symbol.replace('.NS', '')} @ {fc(trade.entryPrice, true)}</span>
            <span className="text-slate-600 w-24 shrink-0 hidden md:inline">
              {trade.status === 'CLOSED' && trade.exitPrice ? `Exit: ${fc(trade.exitPrice, true)}` : 'Waiting...'}
            </span>
            <span className={`w-20 shrink-0 text-right font-bold ${
              trade.pnl > 0 ? 'text-green-500' : trade.pnl < 0 ? 'text-red-500' : 'text-slate-400'
            }`}>
              {trade.status === 'CLOSED' ? fc(trade.pnl, true) : '---'}
            </span>
          </div>
        ))}
        {trades.length === 0 && (
          <div className="text-slate-600 italic text-center py-3 text-[10px]">
            No trades generated. Adjust box parameters or change stock.
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPanel({ settings: _ }: { settings: AppSettings }) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-[#131722] shrink-0">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Settings</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <SettingSection title="Display">
          <SettingRow label="Theme" control={<select className="bg-[#1e222d] border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"><option>Dark</option><option>Light</option></select>} />
          <SettingRow label="Chart Style" control={<select className="bg-[#1e222d] border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"><option>Candlestick</option><option>Line</option><option>Area</option></select>} />
          <SettingRow label="Price Format" control={<select className="bg-[#1e222d] border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"><option>₹ INR</option><option>$ USD</option></select>} />
          <SettingRow label="Layout" control={<select className="bg-[#1e222d] border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"><option>Default</option><option>Compact</option><option>Expanded</option></select>} />
        </SettingSection>

        <SettingSection title="Notifications">
          <SettingRow label="Push Notifications" control={<Toggle />} />
          <SettingRow label="Sound Alerts" control={<Toggle />} />
          <SettingRow label="Email Reports" control={<Toggle />} />
        </SettingSection>

        <SettingSection title="Data & Analysis">
          <SettingRow label="Default Interval" control={<select className="bg-[#1e222d] border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"><option>1 Day</option><option>1 Hour</option><option>15 Min</option></select>} />
          <SettingRow label="Auto-Refresh" control={<select className="bg-[#1e222d] border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"><option>Every 5 min</option><option>Every 15 min</option><option>Manual only</option></select>} />
          <SettingRow label="Data Source" control={<select className="bg-[#1e222d] border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"><option>Yahoo Finance</option><option>NSE Direct</option><option>Simulated</option></select>} />
        </SettingSection>

        <SettingSection title="Account">
          <SettingRow label="Export Data" control={<button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded">Export All</button>} />
          <SettingRow label="Reset Settings" control={<button className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded">Reset</button>} />
        </SettingSection>

        <div className="text-center text-[10px] text-slate-600 pb-4">
          Darvas Box Pro v1.0.0 · Indian Markets
        </div>
      </div>
    </div>
  );
}

function SettingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">{title}</h3>
      <div className="bg-[#1e222d] border border-slate-700 rounded-lg divide-y divide-slate-700/50">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, control }: { label: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-xs text-slate-300">{label}</span>
      {control}
    </div>
  );
}

function Toggle() {
  const [on, setOn] = useState(true);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-8 h-4 rounded-full relative transition-colors ${on ? 'bg-blue-600' : 'bg-slate-600'}`}
    >
      <div className={`w-3 h-3 bg-white rounded-full absolute top-[2px] transition-all ${on ? 'right-0.5' : 'left-0.5'}`} />
    </button>
  );
}

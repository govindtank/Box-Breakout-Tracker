import { useEffect, useState, useCallback, ReactNode } from 'react';
import { fetchIndianStockData } from './lib/marketData';
import { calculateDarvasStrategy, Candle, Trade, BacktestMetrics } from './lib/darvas';
import { TradingChart } from './components/Chart';
import StockSearch from './components/StockSearch';
import EducationView from './components/Education';
import AlertsPanel from './components/AlertsPanel';
import { formatCurrency, formatPercent, formatVolume, formatDate } from './lib/utils';
import { AppSettings } from './lib/constants';
import {
  Activity, BarChart3, LineChart, Briefcase, BookOpen,
  Bell, Search, Settings, Download, TrendingUp,
  ChevronDown, ChevronUp, Clock, Filter, AlertTriangle,
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
  const [dataSource, setDataSource] = useState<'live' | 'simulated'>('live');
  const [useINR, setUseINR] = useState(true);
  const [showParams, setShowParams] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchIndianStockData(symbol, '1d', '1y');
      if (data.length === 0) {
        throw new Error('No data received');
      }
      setCandles(data);
      setDataSource('live');
      const result = calculateDarvasStrategy(data, ghostDays);
      setDarvasData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setDataSource('simulated');
      // Retry with simulated data
      const simData = await fetchIndianStockData(symbol, '1d', '1y');
      setCandles(simData);
      const result = calculateDarvasStrategy(simData, ghostDays);
      setDarvasData(result);
    }
    setIsLoading(false);
  }, [symbol, ghostDays]);

  useEffect(() => { loadData(); }, [loadData]);

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const prevCandle = candles.length > 1 ? candles[candles.length - 2] : null;
  const dailyChange = lastCandle && prevCandle
    ? ((lastCandle.close - prevCandle.close) / prevCandle.close) * 100
    : 0;

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
        return null; // terminal is rendered in the main area
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
        {/* Live Status + Price Ticker */}
        <div className="flex items-center space-x-3 text-xs">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded border ${
            dataSource === 'live'
              ? 'bg-green-500/10 text-green-500 border-green-500/20'
              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dataSource === 'live' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span>{dataSource === 'live' ? 'LIVE' : 'SIM'}</span>
          </div>
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
                  <QuickStat label="Boxes Found" value={darvasData.boxes.length.toString()} />
                  <QuickStat label="Active Trades" value={darvasData.trades.filter(t => t.status === 'OPEN').length.toString()} />
                  <QuickStat label="Total Trades" value={darvasData.metrics.totalTrades.toString()} />
                  <QuickStat label="Win Rate" value={formatPercent(darvasData.metrics.winRate)} />
                  <QuickStat label="Profit Factor" value={darvasData.metrics.profitFactor.toFixed(2)} />
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
                <Download className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Loading...' : 'Refresh Data'}</span>
              </button>
              <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-xs transition-colors flex items-center justify-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Scanner</span>
              </button>
            </div>
          </aside>
        )}

        {/* Center: Main Content */}
        <section className="flex-1 flex flex-col bg-[#0B0E14] relative z-10 min-w-0">
          {activeTab === 'terminal' ? (
            <>
              {/* Chart Info Overlay */}
              <div className="absolute top-3 left-3 z-20 flex space-x-2">
                <div className="px-2.5 py-1 bg-[#131722]/80 backdrop-blur rounded border border-slate-700 text-[10px] flex items-center space-x-2 shadow-sm">
                  <span className="font-bold text-white">{symbol.replace('.NS', '')}</span>
                  <span className="text-slate-400 font-mono">NSE · 1D</span>
                  {lastCandle && (
                    <span className={`font-mono font-bold ${dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(lastCandle.close, useINR)} ({formatPercent(dailyChange)})
                    </span>
                  )}
                </div>
              </div>

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
                  <StatRow label="Boxes Identified" value={darvasData.boxes.length.toString()} />
                  <StatRow label="Open Positions" value={darvasData.trades.filter(t => t.status === 'OPEN').length.toString()} />
                </div>

                {/* Strategy Tip */}
                <div className="mt-4 p-3 bg-blue-600/10 rounded border border-blue-500/20 text-xs leading-relaxed">
                  <p className="font-bold text-blue-400 mb-1 flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>Market Insight</span>
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    {darvasData.metrics.totalTrades > 0
                      ? `Backtest shows ${darvasData.metrics.totalTrades} trades with ${formatPercent(darvasData.metrics.winRate)} win rate over ${candles.length} days of data.`
                      : 'No trades generated with current parameters. Try reducing ghost days or adjusting volume threshold.'}
                  </p>
                </div>

                {/* Diversification */}
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

      {/* Footer Ticker */}
      <footer className="h-7 bg-[#1e222d] border-t border-slate-800 flex items-center px-3 overflow-hidden shrink-0 z-30">
        <div className="flex items-center space-x-6 text-[10px] font-mono whitespace-nowrap overflow-x-auto no-scrollbar w-full">
          <span className="text-slate-500">NIFTY <span className="text-green-400">22,456.30 (+0.42%)</span></span>
          <span className="text-slate-500">BANK NIFTY <span className="text-green-400">48,789.55 (+0.68%)</span></span>
          <span className="text-slate-500">SENSEX <span className="text-green-400">73,890.25 (+0.38%)</span></span>
          <span className="text-slate-500">INDIA VIX <span className="text-yellow-400">14.25 (-2.1%)</span></span>
          <span className="text-slate-500">USD/INR <span className="text-red-400">83.42 (+0.12%)</span></span>
          <span className="text-slate-500">GOLD <span className="text-green-400">₹68,450/10g (+0.55%)</span></span>
        </div>
      </footer>
    </div>
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
        </span>
        <span className="text-[9px] text-blue-500 hover:text-blue-400 cursor-pointer transition-colors flex items-center space-x-1">
          <Download className="w-2.5 h-2.5" />
          <span>Export CSV</span>
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

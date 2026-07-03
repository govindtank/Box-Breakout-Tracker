import { useEffect, useState } from 'react';
import { fetchHistoricalData } from './lib/binance';
import { calculateDarvasStrategy, Candle, Trade, BacktestMetrics } from './lib/darvas';
import { TradingChart } from './components/Chart';
import { formatCurrency, formatPercent } from './lib/utils';
import { Activity, Download, Settings, BarChart3, LineChart, Briefcase } from 'lucide-react';

export default function App() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [darvasData, setDarvasData] = useState<{
    boxes: any[];
    topSeries: any[];
    bottomSeries: any[];
    trades: Trade[];
    metrics: BacktestMetrics;
  } | null>(null);

  const [symbol, setSymbol] = useState('BTCUSDT');
  const [ghostDays, setGhostDays] = useState(3);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await fetchHistoricalData(symbol, '1d', 500);
      setCandles(data);
      if (data.length > 0) {
        const result = calculateDarvasStrategy(data, ghostDays);
        setDarvasData(result);
      }
      setIsLoading(false);
    }
    loadData();
  }, [symbol, ghostDays]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#0B0E14] text-slate-300 font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#131722]">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">DQ</div>
            <span className="text-lg font-bold text-white tracking-tight">DARVAS QUANTUM <span className="text-blue-500">PRO</span></span>
          </div>
          <nav className="flex space-x-4 text-sm font-medium">
            <a href="#" className="text-blue-500 flex items-center space-x-1"><Activity className="w-4 h-4" /><span>Terminal</span></a>
            <a href="#" className="hover:text-white transition-colors flex items-center space-x-1"><LineChart className="w-4 h-4" /><span>Backtester</span></a>
            <a href="#" className="hover:text-white transition-colors flex items-center space-x-1"><Settings className="w-4 h-4" /><span>Strategy Designer</span></a>
            <a href="#" className="hover:text-white transition-colors flex items-center space-x-1"><Briefcase className="w-4 h-4" /><span>Portfolio</span></a>
          </nav>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>LIVE SYNC</span>
          </div>
          <div className="flex items-center space-x-2 border-l border-slate-700 pl-4">
            <span className="opacity-50">BTC/USDT</span>
            <span className="text-white font-mono">
              {candles.length > 0 ? formatCurrency(candles[candles.length - 1].close) : '---'}
            </span>
            <span className="text-green-500 text-[10px]">+1.24%</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 overflow-hidden flex items-center justify-center">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Configuration */}
        <aside className="w-[240px] border-r border-slate-800 bg-[#131722] flex flex-col z-20">
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Box Parameters</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Trading Pair</label>
                <select 
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-[#1e222d] border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 text-white"
                >
                  <option value="BTCUSDT">BTC/USDT</option>
                  <option value="ETHUSDT">ETH/USDT</option>
                  <option value="SOLUSDT">SOL/USDT</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Ghost Days (Lookback)</label>
                <input 
                  type="number" 
                  value={ghostDays}
                  onChange={(e) => setGhostDays(Number(e.target.value))}
                  min={1}
                  className="w-full bg-[#1e222d] border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Volume Threshold (x)</label>
                <input type="number" defaultValue="2.5" className="w-full bg-[#1e222d] border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Breakout Buffer (%)</label>
                <input type="number" defaultValue="0.15" className="w-full bg-[#1e222d] border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 text-white" />
              </div>
            </div>

            <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-8 mb-4">Risk Management</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs">Auto-Stop Loss</span>
                <div className="w-8 h-4 bg-blue-600 rounded-full relative cursor-pointer">
                  <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-[2px]"></div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Max Capital Per Trade</label>
                <div className="relative">
                  <input type="text" defaultValue="2.0" className="w-full bg-[#1e222d] border border-slate-700 rounded px-2 py-1.5 text-sm pr-6 text-white" />
                  <span className="absolute right-2 top-1.5 text-xs text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-slate-800">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs transition-colors flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>GENERATE PINE SCRIPT</span>
            </button>
          </div>
        </aside>

        {/* Center: Main Chart Visualization */}
        <section className="flex-1 flex flex-col bg-[#0B0E14] relative z-10 min-w-0">
          <div className="absolute top-4 left-4 z-20 flex space-x-2">
            <div className="px-3 py-1.5 bg-[#131722]/80 backdrop-blur rounded border border-slate-700 text-xs flex items-center space-x-2 shadow-sm">
              <span className="font-bold text-white">{symbol.replace('USDT', '')}</span>
              <span className="text-slate-400 font-mono">D · 1d · BINANCE</span>
              {candles.length > 0 && (
                <span className="text-green-400">
                  {formatCurrency(candles[candles.length - 1].close)}
                </span>
              )}
            </div>
          </div>
          
          {/* Chart Area */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm text-slate-500 font-mono">Loading market data...</div>
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

          {/* Execution History Ticker */}
          <div className="h-40 border-t border-slate-800 bg-[#131722] p-4 flex flex-col shrink-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center space-x-1">
                <BarChart3 className="w-3 h-3" />
                <span>Real-Time Execution Log</span>
              </span>
              <span className="text-[10px] text-blue-500 hover:text-blue-400 cursor-pointer transition-colors flex items-center space-x-1">
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </span>
            </div>
            <div className="space-y-2 font-mono text-[11px] overflow-y-auto custom-scrollbar flex-1 pr-2">
              {darvasData?.trades.slice().reverse().map((trade, i) => (
                <div key={trade.id + i} className="flex justify-between border-b border-slate-800/50 pb-2 hover:bg-slate-800/30 transition-colors px-1 rounded">
                  <span className="text-slate-400 w-24">{new Date(trade.entryTime * 1000).toLocaleDateString()}</span>
                  <span className={`w-32 font-bold ${trade.status === 'CLOSED' ? (trade.pnl > 0 ? 'text-green-500' : 'text-red-500') : 'text-blue-500'}`}>
                    {trade.status === 'OPEN' ? 'OPEN LONG' : (trade.pnl > 0 ? 'PROFIT EXIT' : 'LOSS EXIT')}
                  </span>
                  <span className="text-white w-32">{symbol} @ {formatCurrency(trade.entryPrice)}</span>
                  <span className="text-slate-500 w-24">
                    {trade.status === 'CLOSED' && trade.exitPrice ? `Exit: ${formatCurrency(trade.exitPrice)}` : 'Waiting...'}
                  </span>
                  <span className={`w-24 text-right font-bold ${trade.pnl > 0 ? 'text-green-500' : trade.pnl < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {trade.status === 'CLOSED' ? formatCurrency(trade.pnl) : '---'}
                  </span>
                </div>
              ))}
              {(!darvasData?.trades || darvasData.trades.length === 0) && (
                <div className="text-slate-500 italic text-center py-4">No executions recorded in this period.</div>
              )}
            </div>
          </div>
        </section>

        {/* Right Sidebar: Analytics & PnL */}
        <aside className="w-[280px] border-l border-slate-800 bg-[#131722] p-4 flex flex-col z-20 shrink-0">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Performance Analytics</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[#1e222d] p-3 rounded border border-slate-700 shadow-sm">
              <div className="text-[10px] text-slate-500 mb-1 uppercase">Total PnL</div>
              <div className={`text-lg font-bold ${darvasData?.metrics.totalPnL && darvasData.metrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {darvasData ? formatCurrency(darvasData.metrics.totalPnL) : '$0.00'}
              </div>
            </div>
            <div className="bg-[#1e222d] p-3 rounded border border-slate-700 shadow-sm">
              <div className="text-[10px] text-slate-500 mb-1 uppercase">Win Rate</div>
              <div className="text-lg font-bold text-white">
                {darvasData ? formatPercent(darvasData.metrics.winRate) : '0.0%'}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
              <span className="text-xs text-slate-400">Total Trades</span>
              <span className="text-sm font-mono text-white">{darvasData?.metrics.totalTrades || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
              <span className="text-xs text-slate-400">Profit Factor</span>
              <span className="text-sm font-mono text-blue-400">
                {darvasData?.metrics.profitFactor.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
              <span className="text-xs text-slate-400">Sharpe Ratio</span>
              <span className="text-sm font-mono text-blue-400">
                {darvasData?.metrics.sharpeRatio.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
              <span className="text-xs text-slate-400">Max Drawdown</span>
              <span className="text-sm font-mono text-red-400 text-opacity-80">
                {darvasData ? `-${darvasData.metrics.maxDrawdown.toFixed(2)}%` : '0.0%'}
              </span>
            </div>
            
            <div className="pt-4 mt-2">
              <h4 className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-widest">Diversification Tracking</h4>
              <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden shadow-inner">
                <div className="h-full bg-blue-500" style={{ width: '45%' }}></div>
                <div className="h-full bg-indigo-500" style={{ width: '25%' }}></div>
                <div className="h-full bg-slate-600" style={{ width: '30%' }}></div>
              </div>
              <div className="flex justify-between mt-3 text-[10px]">
                <span className="flex items-center text-slate-300"><div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></div> Tech</span>
                <span className="flex items-center text-slate-300"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-1.5"></div> Health</span>
                <span className="flex items-center text-slate-300"><div className="w-2 h-2 bg-slate-600 rounded-full mr-1.5"></div> ETF</span>
              </div>
            </div>

            <div className="mt-8">
               <div className="p-4 bg-blue-600/10 rounded border border-blue-500/30 text-xs shadow-sm">
                  <p className="font-bold text-blue-400 mb-1.5 flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>STRATEGY OPTIMIZED</span>
                  </p>
                  <p className="text-slate-400 leading-relaxed">Historical backtest suggests reducing lookback to 15 for current market volatility.</p>
               </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Ticker Tape Footer */}
      <footer className="h-8 bg-[#1e222d] border-t border-slate-800 flex items-center px-4 overflow-hidden shrink-0 z-30">
        <div className="flex items-center space-x-8 text-[11px] font-mono whitespace-nowrap overflow-x-auto custom-scrollbar no-scrollbar w-full">
          <span className="text-slate-400">BTC/USD <span className="text-green-500">$67,420 (+0.5%)</span></span>
          <span className="text-slate-400">EUR/USD <span className="text-red-500">$1.0821 (-0.1%)</span></span>
          <span className="text-slate-400">GOLD <span className="text-green-500">$2,145.40 (+0.8%)</span></span>
          <span className="text-slate-400">AAPL <span className="text-white">$172.50 (+0.2%)</span></span>
          <span className="text-slate-400">TSLA <span className="text-red-500">$162.10 (-1.4%)</span></span>
          <span className="text-slate-400">AMZN <span className="text-green-500">$178.22 (+1.1%)</span></span>
          <span className="text-slate-400">NVDA <span className="text-green-500">$875.28 (+4.2%)</span></span>
        </div>
      </footer>
    </div>
  );
}

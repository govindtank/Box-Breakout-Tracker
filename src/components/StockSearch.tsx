import React from 'react';
import { Search, TrendingUp } from 'lucide-react';

interface StockSearchProps {
  onSelectStock: (symbol: string) => void;
  currentSymbol: string;
}

export default function StockSearch({ onSelectStock, currentSymbol }: StockSearchProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredStocks, setFilteredStocks] = React.useState<any[]>([]);
  
  // NSE stock universe with search categories
  const STOCKS = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', category: 'Energy' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', category: 'Technology' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', category: 'Financial Services' },
    { symbol: 'INFY.NS', name: 'Infosys', category: 'Technology' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', category: 'Financial Services' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', category: 'Financial Services' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', category: 'Communication Services' },
    { symbol: 'ITC.NS', name: 'ITC', category: 'Consumer Defensive' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', category: 'Automotive' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro', category: 'Industrials' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank', category: 'Financial Services' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', category: 'Automotive' },
    { symbol: 'ADANIENT.NS', name: 'Adani Enterprises', category: 'Industrial Conglomerates' },
    { symbol: 'JSWSTEEL.NS', name: 'JSW Steel', category: 'Steel' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', category: 'Financial Services' },
  ];

  const categories = ['All', ...Array.from(new Set(STOCKS.map(s => s.category)))];

  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStocks(STOCKS);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStocks(STOCKS.filter(stock => 
        stock.name.toLowerCase().includes(query) ||
        stock.symbol.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery]);

  const handleSelect = (symbol: string) => {
    setSearchQuery('');
    onSelectStock(symbol);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e222d]">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2">
          <Search className="w-4 h-4 text-blue-400" />
          <span>Stock Explorer</span>
        </h2>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-700">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stocks by name or symbol..."
            className="w-full bg-[#131722] border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-3 py-2 border-b border-slate-700">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSearchQuery('')}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                category === 'All' || searchQuery.trim() === '' && !filteredStocks.length 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Stock List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {filteredStocks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No stocks found matching "{searchQuery}"
          </div>
        ) : (
          <div className="space-y-1">
            {filteredStocks.map(stock => (
              <button
                key={stock.symbol}
                onClick={() => handleSelect(stock.symbol)}
                className={`w-full text-left p-3 rounded transition-colors ${
                  currentSymbol === stock.symbol
                    ? 'bg-blue-600/20 border border-blue-500/50'
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{stock.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{stock.symbol}</div>
                  </div>
                  <div className="text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded">
                    {stock.category}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Popular Picks Section */}
        <div className="mt-4 p-3 border-t border-slate-700">
          <h3 className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>Popular Picks</span>
          </h3>
          <div className="space-y-1">
            {STOCKS.slice(0, 4).map(stock => (
              <button
                key={stock.symbol}
                onClick={() => handleSelect(stock.symbol)}
                className={`w-full text-left p-2 rounded text-xs transition-colors ${
                  currentSymbol === stock.symbol
                    ? 'bg-blue-600/20 border border-blue-500/30'
                    : 'hover:bg-slate-800/30 border border-transparent'
                }`}
              >
                <span className="text-white">{stock.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

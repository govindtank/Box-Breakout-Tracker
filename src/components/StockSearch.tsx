import { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Star, StarOff } from 'lucide-react';
import { POPULAR_STOCKS, SECTORS } from '../lib/constants';
import { searchStocks, StockInfo } from '../lib/marketData';
import { formatCurrency, formatPercent, formatVolume } from '../lib/utils';

interface StockSearchProps {
  onSelectStock: (symbol: string) => void;
  currentSymbol?: string;
}

export default function StockSearch({ onSelectStock, currentSymbol }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [results, setResults] = useState<(StockInfo & { fromList: boolean })[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('darvas_favorites') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('darvas_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const loadResults = async () => {
      if (query.trim().length < 2) {
        const filtered = selectedSector === 'All'
          ? POPULAR_STOCKS
          : POPULAR_STOCKS.filter(s => s.sector === selectedSector);
        setResults(filtered.map(s => ({
          symbol: s.symbol,
          name: s.name,
          price: 500 + Math.random() * 3000,
          change: (Math.random() - 0.5) * 50,
          changePercent: (Math.random() - 0.5) * 4,
          volume: Math.floor(100000 + Math.random() * 10000000),
          high52w: 1000 + Math.random() * 4000,
          low52w: 200 + Math.random() * 800,
          marketCap: ['₹10,000Cr', '₹50,000Cr', '₹1,00,000Cr', '₹5,00,000Cr', '₹10,00,000Cr'][Math.floor(Math.random() * 5)],
          sector: s.sector,
          fromList: true,
        })));
        return;
      }

      setIsSearching(true);
      try {
        const data = await searchStocks(query);
        setResults(data.map(d => ({ ...d, fromList: true })));
      } finally {
        setIsSearching(false);
      }
    };
    loadResults();
  }, [query, selectedSector]);

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  const grouped = useMemo(() => {
    if (query.trim().length >= 2) return null;
    const groups: Record<string, typeof results> = {};
    results.forEach(r => {
      if (!groups[r.sector]) groups[r.sector] = [];
      groups[r.sector].push(r);
    });
    return groups;
  }, [results, query]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-[#131722] space-y-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Indian stocks (e.g., RELIANCE, TCS, HDFCBANK)..."
            className="w-full bg-[#1e222d] border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 text-white placeholder-slate-500"
          />
        </div>
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {SECTORS.map(sector => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector)}
              className={`text-[10px] px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors ${
                selectedSector === sector
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : grouped ? (
          Object.entries(grouped).map(([sector, stocks]) => (
            <div key={sector} className="p-2">
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                {sector} · {stocks.length} stocks
              </div>
              {stocks.map((stock) => (
                <StockRow
                  key={stock.symbol}
                  stock={stock}
                  isActive={currentSymbol === stock.symbol}
                  isFavorite={favorites.includes(stock.symbol)}
                  onSelect={() => onSelectStock(stock.symbol)}
                  onToggleFavorite={() => toggleFavorite(stock.symbol)}
                />
              ))}
            </div>
          ))
        ) : (
          <div className="p-2">
            {results.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No stocks found matching "{query}"
              </div>
            ) : (
              results.map(stock => (
                <StockRow
                  key={stock.symbol}
                  stock={stock}
                  isActive={currentSymbol === stock.symbol}
                  isFavorite={favorites.includes(stock.symbol)}
                  onSelect={() => onSelectStock(stock.symbol)}
                  onToggleFavorite={() => toggleFavorite(stock.symbol)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StockRow({ stock, isActive, isFavorite, onSelect, onToggleFavorite }: {
  stock: StockInfo & { fromList: boolean };
  isActive: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex items-center px-3 py-2.5 rounded-lg transition-all group ${
        isActive
          ? 'bg-blue-500/15 border border-blue-500/30'
          : 'hover:bg-slate-800/50 border border-transparent'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-white truncate">{stock.symbol.replace('.NS', '')}</span>
          <span className="text-[10px] text-slate-500 truncate hidden sm:inline">{stock.name}</span>
        </div>
        <div className="flex items-center space-x-3 mt-0.5">
          <span className="text-[10px] text-slate-500">{stock.sector}</span>
          <span className="text-[10px] text-slate-500">Vol: {formatVolume(stock.volume)}</span>
        </div>
      </div>
      <div className="text-right ml-3">
        <div className="text-sm font-mono font-bold text-white">
          {formatCurrency(stock.price, true)}
        </div>
        <div className={`text-[10px] font-mono flex items-center justify-end space-x-1 ${
          stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
        }`}>
          {stock.changePercent >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          <span>{formatPercent(stock.changePercent)}</span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        className="ml-2 p-1.5 rounded hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
      >
        {isFavorite ? <Star className="w-3.5 h-3.5 text-yellow-500" /> : <StarOff className="w-3.5 h-3.5 text-slate-500" />}
      </button>
    </button>
  );
}

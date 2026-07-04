/**
 * Darvas Scanner — scans NSE stock universe for active Darvas Box patterns
 */
import { fetchIndianStockData } from './marketData';
import { calculateDarvasStrategy, Candle } from './darvas';

export interface ScannerResult {
  symbol: string;
  name: string;
  currentPrice: number;
  boxes: number;
  activeBox: { top: number; bottom: number; height: number } | null;
  signal: 'BREAKOUT' | 'BREAKDOWN' | 'BOX_FORMED' | 'WATCHING' | 'NONE';
  signalStrength: number; // 0-100
  volumeSurge: number; // ratio
  trades: number;
  winRate: number;
  daysInBox: number;
  isConsolidating: boolean;
  source: string;
}

const STOCK_LIST = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'SBIN.NS', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  { symbol: 'ITC.NS', name: 'ITC Ltd' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance' },
];

export function getScannerStocks() {
  return STOCK_LIST;
}

export async function scanStock(symbol: string, name: string): Promise<ScannerResult> {
  const { candles, source } = await fetchIndianStockData(symbol, '1d', '6mo');
  
  const result = calculateDarvasStrategy(candles, 4);
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  
  const currentPrice = lastCandle?.close || 0;
  const activeBoxes = result.boxes.filter(b => b.endTime === null);
  const activeBox = activeBoxes.length > 0 ? activeBoxes[0] : null;
  
  // Determine signal
  let signal: ScannerResult['signal'] = 'NONE';
  let signalStrength = 0;
  let daysInBox = 0;
  
  if (activeBox) {
    daysInBox = Math.floor((candles[candles.length - 1]?.time - activeBox.startTime) / 86400);
    
    const boxHeight = ((activeBox.top - activeBox.bottom) / activeBox.bottom) * 100;
    const pricePosition = ((currentPrice - activeBox.bottom) / (activeBox.top - activeBox.bottom)) * 100;
    
    // Check for breakout signal
    if (currentPrice > activeBox.top) {
      const breakoutPct = ((currentPrice - activeBox.top) / activeBox.top) * 100;
      signal = 'BREAKOUT';
      signalStrength = Math.min(100, breakoutPct * 20 + 50);
    } 
    // Check for breakdown signal
    else if (currentPrice < activeBox.bottom) {
      signal = 'BREAKDOWN';
      signalStrength = 80;
    }
    // Price near top = approaching breakout
    else if (pricePosition > 80) {
      signal = 'BOX_FORMED';
      signalStrength = Math.round(pricePosition);
    }
    // Price near bottom = watching for support
    else if (pricePosition < 20) {
      signal = 'WATCHING';
      signalStrength = Math.round(100 - pricePosition);
    }
    // Price in middle = consolidation
    else {
      signal = 'BOX_FORMED';
      signalStrength = Math.round(50 - Math.abs(50 - pricePosition));
    }
  }
  
  // Volume analysis
  const volumeSurge = calculateVolumeSurge(candles, 5);
  
  // Win rate from backtest
  const winRate = result.metrics.winRate;
  
  return {
    symbol,
    name,
    currentPrice,
    boxes: result.boxes.length,
    activeBox: activeBox ? {
      top: activeBox.top,
      bottom: activeBox.bottom,
      height: activeBox.bottom > 0 ? ((activeBox.top - activeBox.bottom) / activeBox.bottom) * 100 : 0,
    } : null,
    signal,
    signalStrength,
    volumeSurge,
    trades: result.metrics.totalTrades,
    winRate,
    daysInBox,
    isConsolidating: activeBox !== null && signal === 'BOX_FORMED',
    source,
  };
}

function calculateVolumeSurge(candles: Candle[], lookback: number): number {
  if (candles.length < lookback + 1) return 1;
  
  const recent = candles.slice(-lookback);
  const older = candles.slice(-(lookback * 3), -lookback);
  
  const avgRecentVol = recent.reduce((s, c) => s + c.volume, 0) / recent.length;
  const avgOlderVol = older.length > 0 ? older.reduce((s, c) => s + c.volume, 0) / older.length : avgRecentVol;
  
  return avgOlderVol > 0 ? avgRecentVol / avgOlderVol : 1;
}

/**
 * Darvas Scanner — scans NSE stock universe for active Darvas Box patterns
 * Uses pre-computed scanner data from GitHub Actions when available.
 */
import { fetchIndianStockData, fetchScannerData } from './marketData';
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
  // User's custom watchlist
  { symbol: 'MUFIN.NS', name: 'Mufin Green Finance' },
  { symbol: 'NEPHROPLUS.NS', name: 'Nephro Plus' },
  { symbol: 'ZYDUSWELL.NS', name: 'Zydus Wellness' },
  { symbol: 'PIRAMALFIN.NS', name: 'Piramal Finance' },
  { symbol: 'WAAREEENER.NS', name: 'Waaree Energies' },
  { symbol: 'JIOFIN.NS', name: 'Jio Financial Services' },
  { symbol: 'BEL.NS', name: 'Bharat Electronics' },
  { symbol: 'GODAVARIB.NS', name: 'Godavari Biorefineries' },
  { symbol: 'RAIN.NS', name: 'Rain Industries' },
  { symbol: 'BELRISE.NS', name: 'Belrise Industries' },
  { symbol: 'NIITLTD.NS', name: 'NIIT Ltd' },
  { symbol: 'AMAGI.NS', name: 'Amagi' },
];

export function getScannerStocks() {
  return STOCK_LIST;
}

/**
 * Fetch pre-computed scanner results from GitHub Pages static JSON.
 * Falls back to live scanning if static data is unavailable.
 */
export async function fetchPrecomputedScannerResults(): Promise<{
  results: ScannerResult[];
  source: 'api_live' | 'static_json' | 'live';
  updatedAt: string;
}> {
  // 1) Try live API backend scanner endpoint (most current)
  const apiUrl = typeof window !== 'undefined' ? (window as any).BBT_API_URL : undefined;
  if (apiUrl) {
    try {
      const resp = await fetch(`${apiUrl}/api/scanner?limit=50`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.picks && data.picks.length > 0) {
          const results = data.picks.map(mapPickToResult);
          return { results, source: 'api_live', updatedAt: data.updatedAt || new Date().toISOString() };
        }
      }
    } catch {
      // Fall through
    }
  }

  // 2) Try static JSON (from GitHub Actions)
  const scannerData = await fetchScannerData();
  if (scannerData && scannerData.picks && scannerData.picks.length > 0) {
    const results = scannerData.picks.map(mapPickToResult);
    return { results, source: 'static_json', updatedAt: scannerData.updatedAt || '' };
  }

  // 3) Fallback: live scan from browser
  const results: ScannerResult[] = [];
  for (const stock of STOCK_LIST) {
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
    const order = { BREAKOUT: 0, BOX_FORMED: 1, WATCHING: 2, BREAKDOWN: 3, NONE: 4 } as const;
    const diff = (order[a.signal] ?? 5) - (order[b.signal] ?? 5);
    if (diff !== 0) return diff;
    return b.signalStrength - a.signalStrength;
  });

  return { results, source: 'live', updatedAt: new Date().toISOString() };
}

/**
 * Map a scanner.json pick to the ScannerResult interface.
 */
function mapPickToResult(pick: { symbol?: string; name?: string; price?: number; signal?: string; score?: number; uptrend?: boolean; boxTop?: number; boxBottom?: number; volumeRatio?: number; isBreakout?: boolean; boxRange?: number }): ScannerResult {
  const signal = pick.signal || 'ALERT';
  const isBreakout = pick.isBreakout || false;
  const score = pick.score || 0;
  const uptrend = pick.uptrend || false;
  const boxTop = pick.boxTop || 0;
  const boxBottom = pick.boxBottom || 0;
  const boxRange = pick.boxRange || 0;

  // Map the scanner signal to the UI signal
  let uiSignal: ScannerResult['signal'];
  let signalStrength: number;

  if (isBreakout && signal === 'BUY') {
    uiSignal = 'BREAKOUT';
    signalStrength = Math.min(100, score + 20);
  } else if (signal === 'BUY' || isBreakout) {
    uiSignal = 'BREAKOUT';
    signalStrength = Math.min(100, score + 10);
  } else if (uptrend && score >= 50) {
    uiSignal = 'BOX_FORMED';
    signalStrength = score;
  } else if (uptrend) {
    uiSignal = 'WATCHING';
    signalStrength = Math.max(10, score);
  } else {
    uiSignal = 'NONE';
    signalStrength = Math.max(0, score - 20);
  }

  const activeBox = boxTop > 0 && boxBottom > 0
    ? {
        top: boxTop,
        bottom: boxBottom,
        height: boxBottom > 0 ? ((boxTop - boxBottom) / boxBottom) * 100 : 0,
      }
    : null;

  return {
    symbol: pick.symbol || '',
    name: pick.name || pick.symbol || '',
    currentPrice: pick.price || 0,
    boxes: activeBox ? 1 : 0,
    activeBox,
    signal: uiSignal,
    signalStrength,
    volumeSurge: pick.volumeRatio || 1,
    trades: 0,
    winRate: 0,
    daysInBox: 0,
    isConsolidating: activeBox !== null && uiSignal === 'BOX_FORMED',
    source: 'static_json',
  };
}

/**
 * Live scan a single stock (fallback when static JSON is unavailable).
 */
export async function scanStock(symbol: string, name: string): Promise<ScannerResult> {
  const { candles, source } = await fetchIndianStockData(symbol, '1d', '6mo');
  
  const result = calculateDarvasStrategy(candles, 4);
  const lastCandle = candles[candles.length - 1];
  
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

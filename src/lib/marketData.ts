/**
 * Indian Market Data Service
 * Fetches NSE stock data from Yahoo Finance (CORS-compatible)
 * Shows clear indicators when data is live vs simulated
 */

import { Candle } from './darvas';
import type { ScannerResult } from './scanner';

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const DATA_BASE = '/Box-Breakout-Tracker/data';

export type DataSource = 'api_live' | 'static_json' | 'yahoo_live' | 'simulated';

export interface FetchResult {
  candles: Candle[];
  source: DataSource;
  symbol: string;
  fetchedAt: number;
}

export async function fetchIndianStockData(
  symbol: string,
  interval: string = '1d',
  range: string = '1y'
): Promise<FetchResult> {
  const fetchedAt = Date.now();

  // 1) Try live API backend (BBT API — most reliable, server-side yfinance)
  const apiUrl = typeof window !== 'undefined' ? (window as any).BBT_API_URL : undefined;
  if (apiUrl) {
    try {
      const apiData = await fetchFromApi(apiUrl, symbol, interval, range);
      if (apiData && apiData.length > 20) {
        return { candles: apiData, source: 'api_live', symbol, fetchedAt };
      }
    } catch (err) {
      console.warn('Live API unavailable:', err instanceof Error ? err.message : err);
    }
  }

  // 2) Try static JSON from GitHub Pages data (backup source)
  try {
    const staticData = await fetchFromStaticJson(symbol);
    if (staticData && staticData.candles.length > 20) {
      return { candles: staticData.candles, source: 'static_json', symbol, fetchedAt };
    }
  } catch (err) {
    console.warn('Static JSON unavailable:', err instanceof Error ? err.message : err);
  }

  // 2) Try Yahoo Finance directly (works on localhost, may work on production)
  const yahooSymbol = symbol;
  try {
    const yahooData = await fetchFromYahoo(yahooSymbol, interval, range);
    if (yahooData && yahooData.length > 20) {
      return { candles: yahooData, source: 'yahoo_live', symbol, fetchedAt };
    }
  } catch (err) {
    console.warn('Yahoo Finance API failed:', err instanceof Error ? err.message : err);
  }

  // 3) Final fallback: Simulated data
  console.warn(`⚠ Using SIMULATED data for ${symbol} — all API sources unavailable`);
  const simData = generateSimulatedData(symbol, now(), range);
  return { candles: simData, source: 'simulated', symbol, fetchedAt };
}

/**
 * Fetch stock OHLC data from the live Flask API backend via localtunnel.
 * This is the primary data source — server-side yfinance with no CORS issues.
 */
async function fetchFromApi(apiUrl: string, symbol: string, interval: string, range: string): Promise<Candle[]> {
  const url = `${apiUrl}/api/stock/${symbol}?interval=${interval}&range=${range}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  const data = await response.json();
  const candles: Candle[] = (data.candles || []).map((c: { time: number; open: number; high: number; low: number; close: number; volume: number }) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
  if (candles.length === 0) throw new Error('Empty candles from API');
  return candles;
}

/**
 * Fetch stock OHLC data from pre-computed static JSON on GitHub Pages.
 */
async function fetchFromStaticJson(symbol: string): Promise<{ candles: Candle[] } | null> {
  const url = `${DATA_BASE}/stock/${symbol}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Static JSON returned ${response.status}`);
  }
  const data = await response.json();
  const candles: Candle[] = (data.candles || []).map((c: { time: number; open: number; high: number; low: number; close: number; volume: number }) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
  return { candles };
}

/**
 * Fetch pre-computed scanner results from GitHub Pages.
 * Returns the scanner picks directly or null if unavailable.
 */
export async function fetchScannerData(): Promise<{ picks: ScannerResult[]; count: number; scanned: number; updatedAt: string } | null> {
  try {
    const url = `${DATA_BASE}/scanner.json`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function now(): number {
  return Math.floor(Date.now() / 1000);
}

async function fetchFromYahoo(symbol: string, interval: string, range: string): Promise<Candle[]> {
  const url = `${YAHOO_BASE}/${symbol}?interval=${interval}&range=${range}&includePrePost=false`;
  
  // NO custom headers — bare fetch to avoid CORS preflight
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Yahoo API returned ${response.status}${response.status === 429 ? ' (rate limited)' : ''}`);
  }

  const data = await response.json();
  
  // Handle Yahoo Finance error response
  if (data?.chart?.error) {
    throw new Error(`Yahoo error: ${data.chart.error.description || JSON.stringify(data.chart.error)}`);
  }

  const result = data?.chart?.result?.[0];
  if (!result) {
    throw new Error('Empty response from Yahoo Finance');
  }
  
  return parseYahooResult(result);
}

interface YahooFinanceResult {
  timestamp: number[];
  indicators: {
    quote: Array<{ open?: number; high?: number; low?: number; close?: number; volume?: number }>;
    adjclose: Array<{ adjclose?: number[] }>;
  };
}

function parseYahooResult(result: YahooFinanceResult): Candle[] {
  const timestamps: number[] = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};
  const adjclose = result.indicators?.adjclose?.[0]?.adjclose || [];
  
  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = quotes.open?.[i];
    const h = quotes.high?.[i];
    const l = quotes.low?.[i];
    const c = quotes.close?.[i];
    const v = quotes.volume?.[i];
    
    // Skip null/incomplete candles
    if (o == null || h == null || l == null || c == null || v == null) continue;
    if (o === 0 || h === 0 || l === 0 || c === 0) continue; // Skip trading halts
    
    candles.push({
      time: timestamps[i],
      open: o,
      high: h,
      low: l,
      close: c,
      volume: v,
    });
  }
  
  return candles;
}

/**
 * Generate realistic simulated data when Yahoo Finance is unavailable.
 * Uses month-specific seed values to create consistent-ish patterns
 * that at least look like stock data (trend + volatility).
 * 
 * CRITICAL: This is ONLY a fallback when browser CORS blocks Yahoo.
 * The UI clearly shows "SIMULATED" when this path is active.
 */
function generateSimulatedData(symbol: string, endTime: number, range: string): Candle[] {
  const candles: Candle[] = [];
  
  // Use symbol hash for deterministic base price
  let basePrice = 1200;
  const symbolLower = symbol.toLowerCase();
  if (symbolLower.includes('reliance')) basePrice = 2950;
  else if (symbolLower.includes('tcs') || symbolLower.includes('infy')) basePrice = 3850;
  else if (symbolLower.includes('hdfc')) basePrice = 1680;
  else if (symbolLower.includes('icici')) basePrice = 1250;
  else if (symbolLower.includes('sbi')) basePrice = 820;
  else if (symbolLower.includes('bharti')) basePrice = 1450;
  else if (symbolLower.includes('itc')) basePrice = 430;
  else if (symbolLower.includes('tatamotors')) basePrice = 980;
  else if (symbolLower.includes('lt')) basePrice = 3550;
  else if (symbolLower.includes('axis')) basePrice = 1120;
  else if (symbolLower.includes('maruti')) basePrice = 11500;
  else if (symbolLower.includes('adanient')) basePrice = 2750;
  else if (symbolLower.includes('jswsteel')) basePrice = 920;
  else if (symbolLower.includes('bajfinance')) basePrice = 7200;
  
  // Calculate number of days based on range
  let numDays: number;
  switch (range) {
    case '1y': numDays = 252; break;
    case '6mo': numDays = 126; break;
    case '3mo': numDays = 63; break;
    default: numDays = 252;
  }
  
  const daySeconds = 86400;
  const startTime = endTime - (numDays * daySeconds);
  
  // Generate base trend (slightly bullish with some cycles)
  let price = basePrice;
  let trendAngle = 0;
  
  for (let d = 0; d < numDays; d++) {
    const time = startTime + (d * daySeconds);
    const date = new Date(time * 1000);
    const dayOfWeek = date.getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Create a realistic price pattern: trend + cycle + noise
    // Week-based cycle
    const weekNum = Math.floor(d / 5);
    const cyclePhase = (weekNum % 8) / 8 * Math.PI * 2;
    const cycleMove = Math.sin(cyclePhase) * basePrice * 0.03;
    
    // Trend: slightly bullish drift
    trendAngle += (Math.random() - 0.48) * 0.002; // slight upward bias
    
    // Create box-like consolidation periods
    const isConsolidating = (weekNum % 12) > 7 && (weekNum % 12) < 11;
    const volatility = isConsolidating ? 0.005 : 0.018;
    
    // Daily noise
    const noise = (Math.random() - 0.5) * price * volatility;
    const change = price * trendAngle + cycleMove * 0.1 + noise;
    
    price = price + change;
    
    // Ensure price stays within reasonable bounds (don't go to 0 or negative)
    if (price < basePrice * 0.5) price = basePrice * 0.5 + Math.random() * 10;
    if (price > basePrice * 1.8) price = basePrice * 1.8 - Math.random() * 10;
    
    // Build candle with realistic OHLC
    const open = price;
    const dailyRange = price * (isConsolidating ? 0.008 : 0.025);
    const high = price + dailyRange * Math.random();
    const low = price - dailyRange * Math.random();
    const close = open + (Math.random() - 0.46) * dailyRange; // slight up bias
    const volume = Math.floor(500000 + Math.random() * 5000000 * (isConsolidating ? 0.6 : 1.0));
    
    candles.push({
      time,
      open: Math.max(open, 1),
      high: Math.max(high, low + 1),
      low: Math.min(low, high - 1),
      close: Math.max(close, 1),
      volume,
    });
  }
  
  return candles;
}

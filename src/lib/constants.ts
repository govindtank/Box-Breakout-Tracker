/**
 * Application Constants and Settings Types
 */

export interface AppSettings {
  theme: 'dark' | 'light';
  chartStyle: 'candlestick' | 'line' | 'area';
  priceFormat: 'INR' | 'USD';
  defaultInterval: '1d' | '1h' | '15m' | '30m' | '4h';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  layout: 'default' | 'compact' | 'expanded';
}

export type AlertType = 'breakout' | 'breakdown' | 'price_above' | 'price_below' | 'volume_spike' | 'box_formation';

export interface AlertRule {
  id: string;
  type: AlertType;
  symbol: string;
  enabled: boolean;
  createdAt: number;
  lastTriggered: number | null;
  params: {
    target?: number;
    multiplier?: number;
    direction?: 'above' | 'below';
  };
}

export interface DarvasBox {
  top: number;
  bottom: number;
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  height: number;
  midpoint: number;
  breakout?: { time: number; price: number; index: number };
  breakdown?: { time: number; price: number; index: number };
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  chartStyle: 'candlestick',
  priceFormat: 'INR',
  defaultInterval: '1d',
  notificationsEnabled: true,
  soundEnabled: true,
  layout: 'default',
};

export const NSE_STOCK_UNIVERSE = [
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
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance' },
];

export const NIFTY50_INDEX = 'NIFTY.NS';
export const BANK_NIFTY_INDEX = 'BANKNIFTY.NS';
export const SENSEX_INDEX = 'SENSX.NS';

export const DEFAULT_GHOST_DAYS = 4;
export const DEFAULT_VOLUME_THRESHOLD = 1.5;
export const DEFAULT_BREAKOUT_BUFFER = 0.015; // 1.5%

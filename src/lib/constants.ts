/**
 * Indian Market Stock Universe & Configuration
 */
export const NSE_INDICES = [
  'NIFTY 50', 'BANK NIFTY', 'FIN NIFTY', 'MIDCAP 50', 'SENSEX',
];

export const POPULAR_STOCKS = [
  // Nifty 50 - Top by market cap
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking' },
  { symbol: 'INFY.NS', name: 'Infosys', sector: 'IT' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG' },
  { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'Finance' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro', sector: 'Infrastructure' },
  { symbol: 'WIPRO.NS', name: 'Wipro', sector: 'IT' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking' },
  { symbol: 'TITAN.NS', name: 'Titan Company', sector: 'Consumer' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'Consumer' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', sector: 'Automobile' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma', sector: 'Pharma' },
  { symbol: 'NTPC.NS', name: 'NTPC Limited', sector: 'Energy' },
  { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corp', sector: 'Energy' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corp', sector: 'Energy' },
  { symbol: 'M&M.NS', name: 'Mahindra & Mahindra', sector: 'Automobile' },
  { symbol: 'NESTLEIND.NS', name: 'Nestlé India', sector: 'FMCG' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies', sector: 'IT' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Automobile' },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', sector: 'Cement' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel', sector: 'Metals' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel', sector: 'Metals' },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra', sector: 'IT' },
  { symbol: 'COALINDIA.NS', name: 'Coal India', sector: 'Energy' },
  { symbol: 'HDFCLIFE.NS', name: 'HDFC Life Insurance', sector: 'Insurance' },
  { symbol: 'SBILIFE.NS', name: 'SBI Life Insurance', sector: 'Insurance' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', sector: 'Finance' },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports & SEZ', sector: 'Infrastructure' },
  { symbol: 'GRASIM.NS', name: 'Grasim Industries', sector: 'Cement' },
  { symbol: 'DIVISLAB.NS', name: 'Divi\'s Laboratories', sector: 'Pharma' },
  { symbol: 'DRREDDY.NS', name: 'Dr. Reddy\'s Labs', sector: 'Pharma' },
  { symbol: 'BRITANNIA.NS', name: 'Britannia Industries', sector: 'FMCG' },
  { symbol: 'CIPLA.NS', name: 'Cipla', sector: 'Pharma' },
  { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals', sector: 'Healthcare' },
  { symbol: 'HINDALCO.NS', name: 'Hindalco Industries', sector: 'Metals' },
  { symbol: 'EICHERMOT.NS', name: 'Eicher Motors', sector: 'Automobile' },
  { symbol: 'BPCL.NS', name: 'Bharat Petroleum', sector: 'Energy' },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp', sector: 'Automobile' },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank', sector: 'Banking' },
  { symbol: 'TATACONSUM.NS', name: 'Tata Consumer Products', sector: 'FMCG' },
  { symbol: 'HDFCAMC.NS', name: 'HDFC AMC', sector: 'Finance' },
  { symbol: 'DMART.NS', name: 'Avenue Supermarts', sector: 'Retail' },
  { symbol: 'PIDILITIND.NS', name: 'Pidilite Industries', sector: 'Chemicals' },
  { symbol: 'TRENT.NS', name: 'Trent Limited', sector: 'Retail' },
];

export const SECTORS = [
  'All', 'Banking', 'IT', 'FMCG', 'Automobile', 'Pharma', 'Energy',
  'Finance', 'Metals', 'Infrastructure', 'Cement', 'Consumer',
  'Retail', 'Telecom', 'Insurance', 'Healthcare', 'Chemicals',
];

export interface AlertRule {
  id: string;
  symbol: string;
  type: 'breakout' | 'breakdown' | 'price_above' | 'price_below' | 'volume_spike' | 'box_formation';
  params: Record<string, number>;
  enabled: boolean;
  createdAt: number;
  lastTriggered: number | null;
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  createdAt: number;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  chartStyle: 'candlestick' | 'line' | 'area';
  priceFormat: 'INR' | 'USD';
  defaultInterval: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  layout: 'default' | 'compact' | 'expanded';
}

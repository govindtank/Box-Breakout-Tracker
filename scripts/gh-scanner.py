#!/usr/bin/env python3
"""
GitHub Actions Darvas Box Scanner
Scans NSE stocks for Darvas Box patterns and outputs JSON data files.
Runs as a GitHub Action and commits data files to gh-pages branch.

Usage: python scripts/gh-scanner.py [--output-dir data] [--stocks 50]
"""

import os
import sys
import json
import time
import math
import logging
import argparse
from datetime import datetime, timezone

import yfinance as yf
import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [SCANNER] %(levelname)s %(message)s',
)
log = logging.getLogger('gh-scanner')

# ─── NSE Stock Universe ────────────────────────────────────────────────────

NSE_STOCKS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS',
    'BAJFINANCE.NS', 'LT.NS', 'WIPRO.NS', 'AXISBANK.NS', 'TITAN.NS',
    'ASIANPAINT.NS', 'MARUTI.NS', 'SUNPHARMA.NS', 'NTPC.NS', 'ONGC.NS',
    'POWERGRID.NS', 'M&M.NS', 'NESTLEIND.NS', 'HCLTECH.NS', 'TATAMOTORS.NS',
    'ULTRACEMCO.NS', 'TATASTEEL.NS', 'JSWSTEEL.NS', 'TECHM.NS', 'COALINDIA.NS',
    'HDFCLIFE.NS', 'SBILIFE.NS', 'BAJAJFINSV.NS', 'ADANIPORTS.NS', 'GRASIM.NS',
    'DIVISLAB.NS', 'DRREDDY.NS', 'BRITANNIA.NS', 'CIPLA.NS', 'APOLLOHOSP.NS',
    'HINDALCO.NS', 'EICHERMOT.NS', 'BPCL.NS', 'HEROMOTOCO.NS', 'INDUSINDBK.NS',
    'TATACONSUM.NS', 'HDFCAMC.NS', 'DMART.NS', 'PIDILITIND.NS', 'TRENT.NS',
    # User's custom watchlist
    'MUFIN.NS', 'NEPHROPLUS.NS', 'ZYDUSWELL.NS', 'PIRAMALFIN.NS',
    'WAAREEENER.NS', 'JIOFIN.NS', 'BEL.NS', 'GODAVARIB.NS', 'RAIN.NS',
    'BELRISE.NS', 'NIITLTD.NS', 'AMAGI.NS',
]

NSE_INDEX_SYMBOLS = {
    '^NSEI': 'NIFTY 50',
    '^NSEBANK': 'BANK NIFTY',
    '^BSESN': 'SENSEX',
    'NIFTY_FIN_SERVICE.NS': 'FIN NIFTY',
    '^NSMIDCP': 'MIDCAP 100',
}

STOCK_SECTORS = {
    'RELIANCE.NS': 'Energy', 'TCS.NS': 'IT', 'HDFCBANK.NS': 'Banking',
    'INFY.NS': 'IT', 'ICICIBANK.NS': 'Banking', 'HINDUNILVR.NS': 'FMCG',
    'ITC.NS': 'FMCG', 'SBIN.NS': 'Banking', 'BHARTIARTL.NS': 'Telecom',
    'KOTAKBANK.NS': 'Banking', 'BAJFINANCE.NS': 'Finance', 'LT.NS': 'Infrastructure',
    'WIPRO.NS': 'IT', 'AXISBANK.NS': 'Banking', 'TITAN.NS': 'Consumer',
    'ASIANPAINT.NS': 'Consumer', 'MARUTI.NS': 'Automobile', 'SUNPHARMA.NS': 'Pharma',
    'NTPC.NS': 'Energy', 'ONGC.NS': 'Energy', 'POWERGRID.NS': 'Energy',
    'M&M.NS': 'Automobile', 'NESTLEIND.NS': 'FMCG', 'HCLTECH.NS': 'IT',
    'TATAMOTORS.NS': 'Automobile', 'ULTRACEMCO.NS': 'Cement', 'TATASTEEL.NS': 'Metals',
    'JSWSTEEL.NS': 'Metals', 'TECHM.NS': 'IT', 'COALINDIA.NS': 'Energy',
    'HDFCLIFE.NS': 'Insurance', 'SBILIFE.NS': 'Insurance', 'BAJAJFINSV.NS': 'Finance',
    'ADANIPORTS.NS': 'Infrastructure', 'GRASIM.NS': 'Cement', 'DIVISLAB.NS': 'Pharma',
    'DRREDDY.NS': 'Pharma', 'BRITANNIA.NS': 'FMCG', 'CIPLA.NS': 'Pharma',
    'APOLLOHOSP.NS': 'Healthcare', 'HINDALCO.NS': 'Metals', 'EICHERMOT.NS': 'Automobile',
    'BPCL.NS': 'Energy', 'HEROMOTOCO.NS': 'Automobile', 'INDUSINDBK.NS': 'Banking',
    'TATACONSUM.NS': 'FMCG', 'HDFCAMC.NS': 'Finance', 'DMART.NS': 'Retail',
    'PIDILITIND.NS': 'Chemicals', 'TRENT.NS': 'Retail',
    # User's custom watchlist
    'MUFIN.NS': 'Finance', 'NEPHROPLUS.NS': 'Healthcare',
    'ZYDUSWELL.NS': 'Pharma', 'PIRAMALFIN.NS': 'Finance',
    'WAAREEENER.NS': 'Energy', 'JIOFIN.NS': 'Finance',
    'BEL.NS': 'Defense', 'GODAVARIB.NS': 'Chemicals',
    'RAIN.NS': 'Chemicals', 'BELRISE.NS': 'Automobile',
    'NIITLTD.NS': 'IT', 'AMAGI.NS': 'Media',
}

# ─── Data Fetching ──────────────────────────────────────────────────────────

def make_json_safe(obj):
    """Convert non-JSON-serializable types to basic Python types."""
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_json_safe(v) for v in obj]
    if isinstance(obj, tuple):
        return tuple(make_json_safe(v) for v in obj)
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, (int, float, bool)):
        try:
            json.dumps(obj)
            return obj
        except (TypeError, ValueError):
            return str(obj)
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    # Fallback for unknown types
    try:
        json.dumps(obj)
        return obj
    except (TypeError, ValueError):
        return str(obj)


def fetch_stock_data(symbol, interval='1d', range_str='6mo'):
    """Fetch stock OHLC data from yfinance."""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=range_str, interval=interval)
        if hist.empty:
            log.warning(f'No data for {symbol}')
            return {'symbol': symbol, 'candles': [], 'info': {}}

        candles = []
        for idx, row in hist.iterrows():
            ts = int(idx.timestamp())
            candles.append({
                'time': ts,
                'open': round(float(row['Open']), 2),
                'high': round(float(row['High']), 2),
                'low': round(float(row['Low']), 2),
                'close': round(float(row['Close']), 2),
                'volume': int(float(row['Volume'])),
            })

        info = {}
        try:
            q = ticker.info or {}
            info = {
                'name': q.get('longName', q.get('shortName', symbol)),
                'sector': q.get('sector', ''),
                'industry': q.get('industry', ''),
                'pe': q.get('trailingPE', q.get('forwardPE', None)),
                'marketCap': q.get('marketCap', 0),
                'eps': q.get('trailingEps', None),
                'dividendYield': q.get('dividendYield', None),
                'high52w': q.get('fiftyTwoWeekHigh', None),
                'low52w': q.get('fiftyTwoWeekLow', None),
                'avgVolume': q.get('averageVolume', 0),
            }
        except Exception as e:
            log.warning(f'Info fetch failed for {symbol}: {e}')

        return {'symbol': symbol, 'candles': candles, 'info': info}

    except Exception as e:
        log.error(f'Error fetching {symbol}: {e}')
        return {'symbol': symbol, 'candles': [], 'info': {}, 'error': str(e)}


def fetch_index_data():
    """Fetch NSE index data."""
    results = []
    for symbol, name in NSE_INDEX_SYMBOLS.items():
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period='2d')
            if not hist.empty:
                last = hist.iloc[-1]
                prev = hist.iloc[-2] if len(hist) > 1 else last
                change = float(last['Close'] - prev['Close'])
                change_pct = round((change / prev['Close']) * 100, 2) if prev['Close'] != 0 else 0
                results.append({
                    'name': name,
                    'symbol': symbol,
                    'value': round(float(last['Close']), 2),
                    'change': round(change, 2),
                    'changePercent': change_pct,
                    'high': round(float(last['High']), 2),
                    'low': round(float(last['Low']), 2),
                })
        except Exception as e:
            log.warning(f'Index {symbol}: {e}')

    return {'indices': results, 'updatedAt': datetime.now(timezone.utc).isoformat()}


# ─── Darvas Box Scanner Logic ──────────────────────────────────────────────

def scan_stock(symbol, candles, info, sector_map):
    """
    Darvas Box scanner for a single stock.
    Returns scanner pick dict matching the Flask API format.
    """
    if len(candles) < 20:
        return None

    closes = np.array([c['close'] for c in candles])
    highs = np.array([c['high'] for c in candles])
    lows = np.array([c['low'] for c in candles])
    volumes = np.array([c['volume'] for c in candles])

    last_price = closes[-1]

    # Darvas box: find consolidation zone
    lookback = min(14, len(candles) - 1)
    recent = candles[-lookback:]
    box_top = max(c['high'] for c in recent)
    box_bottom = min(c['low'] for c in recent)
    box_range = box_top - box_bottom

    avg_volume = np.mean(volumes[-30:]) if len(volumes) >= 30 else np.mean(volumes)
    recent_volume = np.mean(volumes[-5:]) if len(volumes) >= 5 else volumes[-1]
    volume_ratio = recent_volume / avg_volume if avg_volume > 0 else 1

    # RSI
    deltas = np.diff(closes)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    avg_gain = np.mean(gains[-14:]) if len(gains) >= 14 else np.mean(gains)
    avg_loss = np.mean(losses[-14:]) if len(losses) >= 14 else np.mean(losses)
    rsi = 50
    if avg_loss != 0:
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))

    # Trend
    sma20 = np.mean(closes[-20:]) if len(closes) >= 20 else closes[-1]
    sma50 = np.mean(closes[-50:]) if len(closes) >= 50 else closes[-1]
    uptrend = last_price > sma20 > sma50

    # Breakout detection
    is_breakout = last_price > box_top and volume_ratio > 1.2
    signal = 'BUY' if is_breakout and uptrend else ('WATCH' if uptrend else 'ALERT')

    # Conviction
    conviction = 'HIGH'
    if not uptrend or volume_ratio < 1.0:
        conviction = 'LOW'
    elif volume_ratio < 1.3:
        conviction = 'MODERATE'

    # Score (0-100)
    score = 0
    score += 30 if is_breakout else (15 if last_price > box_top * 0.95 else 0)
    score += 25 if uptrend else 0
    score += 20 if volume_ratio > 1.5 else (10 if volume_ratio > 1.2 else 0)
    score += 15 if 40 < rsi < 70 else (5 if rsi <= 40 else 10)
    score += 10 if sma20 > sma50 else 0

    entry_zone_low = round(box_top * 0.99, 2)
    stop_loss = round(box_bottom * 0.98, 2)
    target1 = round(box_top * 1.05, 2)
    target2 = round(box_top * 1.10, 2)
    risk = round(((last_price - stop_loss) / last_price) * 100, 1) if last_price > 0 else 0

    momentum_proofs = []
    if is_breakout:
        momentum_proofs.append('Breakout confirmed')
    if volume_ratio > 1.5:
        momentum_proofs.append(f'Volume {volume_ratio:.1f}x avg')
    if rsi > 50:
        momentum_proofs.append(f'RSI {rsi:.0f} (bullish)')
    if uptrend:
        momentum_proofs.append('Uptrend (SMA20 > SMA50)')
    if score >= 60:
        momentum_proofs.append(f'Score {score}/100')

    sector = sector_map.get(symbol, info.get('sector', ''))

    return {
        'symbol': symbol,
        'name': info.get('name', symbol),
        'sector': sector,
        'price': round(last_price, 2),
        'score': score,
        'signal': signal,
        'conviction': conviction,
        'boxTop': round(box_top, 2),
        'boxBottom': round(box_bottom, 2),
        'boxRange': round(box_range, 2),
        'isBreakout': is_breakout,
        'entryZoneLow': entry_zone_low,
        'entryZoneHigh': round(box_top * 1.01, 2),
        'stopLoss': stop_loss,
        'target1': target1,
        'target2': target2,
        'riskPct': risk,
        'rsi': round(rsi, 1),
        'volumeRatio': round(volume_ratio, 2),
        'uptrend': uptrend,
        'momentumProof': momentum_proofs,
        'peRatio': info.get('pe'),
        'marketCap': info.get('marketCap'),
        'eps': info.get('eps'),
    }


def get_stock_price_overview(symbol, candles, info, sector_map):
    """Get a lightweight stock price overview (no full OHLC)."""
    if len(candles) < 2:
        return None

    last = candles[-1]
    prev = candles[-2] if len(candles) > 1 else last
    change = last['close'] - prev['close']
    change_pct = round((change / prev['close']) * 100, 2) if prev['close'] != 0 else 0

    return {
        'symbol': symbol,
        'name': info.get('name', symbol),
        'price': last['close'],
        'change': round(change, 2),
        'changePercent': change_pct,
        'high': last['high'],
        'low': last['low'],
        'volume': last['volume'],
        'sector': sector_map.get(symbol, info.get('sector', '')),
        'marketCap': info.get('marketCap', 0),
        'pe': info.get('pe'),
    }


# ─── Main ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='GH Darvas Box Scanner')
    parser.add_argument('--output-dir', default='data',
                        help='Output directory for JSON files (default: data)')
    parser.add_argument('--stocks', type=int, default=50,
                        help='Number of stocks to scan (default: 50)')
    parser.add_argument('--skip-individual', action='store_true',
                        help='Skip generating individual stock OHLC files')
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    os.makedirs(os.path.join(args.output_dir, 'stock'), exist_ok=True)

    symbol_list = NSE_STOCKS[:args.stocks]
    total = len(symbol_list)
    start_time = time.time()

    log.info(f'Starting scan of {total} NSE stocks...')

    scanner_picks = []
    stock_overviews = []
    stock_count = 0
    error_count = 0

    for i, symbol in enumerate(symbol_list):
        try:
            data = fetch_stock_data(symbol, '1d', '6mo')
            candles = data.get('candles', [])
            info = data.get('info', {})

            if not candles:
                error_count += 1
                log.warning(f'[{i+1}/{total}] {symbol}: No candle data')
                continue

            # Generate individual stock OHLC file (if requested)
            if not args.skip_individual:
                stock_file = os.path.join(args.output_dir, 'stock', f'{symbol}.json')
                with open(stock_file, 'w') as f:
                    json.dump(make_json_safe({
                        'symbol': symbol,
                        'candles': candles,
                        'count': len(candles),
                        'info': info,
                        'meta': {
                            'interval': '1d',
                            'range': '6mo',
                            'candleCount': len(candles),
                        },
                    }), f)

            # Run Darvas scanner
            pick = scan_stock(symbol, candles, info, STOCK_SECTORS)
            if pick:
                scanner_picks.append(pick)

            # Price overview
            overview = get_stock_price_overview(symbol, candles, info, STOCK_SECTORS)
            if overview:
                stock_overviews.append(overview)

            stock_count += 1
            log.info(f'[{i+1}/{total}] {symbol}: {len(candles)} candles, score={pick["score"] if pick else "N/A"}')

        except Exception as e:
            error_count += 1
            log.error(f'[{i+1}/{total}] {symbol}: {e}')
            continue

    # Sort scanner picks by score descending
    scanner_picks.sort(key=lambda x: x['score'], reverse=True)

    # Fetch indices
    log.info('Fetching index data...')
    indices_data = fetch_index_data()

    # Write scanner results
    scanner_output = make_json_safe({
        'picks': scanner_picks,
        'count': len(scanner_picks),
        'scanned': total,
        'updatedAt': datetime.now(timezone.utc).isoformat(),
    })
    with open(os.path.join(args.output_dir, 'scanner.json'), 'w') as f:
        json.dump(scanner_output, f, indent=2)

    # Write stock price overviews
    stocks_output = make_json_safe({
        'stocks': stock_overviews,
        'count': len(stock_overviews),
        'updatedAt': datetime.now(timezone.utc).isoformat(),
    })
    with open(os.path.join(args.output_dir, 'stocks.json'), 'w') as f:
        json.dump(stocks_output, f, indent=2)

    # Write indices
    indices_output = make_json_safe(dict(indices_data))
    indices_output['updatedAt'] = datetime.now(timezone.utc).isoformat()
    with open(os.path.join(args.output_dir, 'indices.json'), 'w') as f:
        json.dump(indices_output, f, indent=2)

    # Summary for GitHub Action output
    elapsed = time.time() - start_time
    log.info('═' * 50)
    log.info(f'SCAN COMPLETE')
    log.info(f'  Stocks processed: {stock_count}/{total}')
    log.info(f'  Scanner picks:    {len(scanner_picks)}')
    log.info(f'  Errors:           {error_count}')
    log.info(f'  Time:             {elapsed:.1f}s')
    log.info(f'  Output:           {args.output_dir}/')
    log.info(f'    - scanner.json  ({len(scanner_picks)} picks)')
    log.info(f'    - stocks.json   ({len(stock_overviews)} stocks)')
    log.info(f'    - indices.json  ({len(indices_output.get("indices", []))} indices)')
    log.info(f'    - stock/*.json  ({stock_count} individual files)')
    log.info('═' * 50)

    # Report for GitHub Actions
    print(f'::set-output name=scanned::{stock_count}')
    print(f'::set-output name=picks::{len(scanner_picks)}')
    print(f'::set-output name=errors::{error_count}')
    print(f'::set-output name=elapsed::{elapsed:.1f}s')


if __name__ == '__main__':
    main()

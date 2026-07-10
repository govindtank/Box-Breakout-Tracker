"""
Box-Breakout-Tracker Backend API
Provides real NSE stock data via yfinance for the frontend.
Run: python3 bbt_api.py [--port PORT]
"""

import os
import sys
import json
import time
import math
import logging
from datetime import datetime, timedelta, timezone
from functools import wraps

import yfinance as yf
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

# ─── Flask NaN/Infinity JSON Fix ─────────────────────────────────────────────

from flask.json.provider import DefaultJSONProvider

class SafeJSONProvider(DefaultJSONProvider):
    def default(self, o):
        if isinstance(o, (np.integer,)):
            return int(o)
        if isinstance(o, (np.floating,)):
            return float(o)
        if isinstance(o, (np.bool_,)):
            return bool(o)
        if isinstance(o, np.ndarray):
            return o.tolist()
        return super().default(o)

app = Flask(__name__)
app.json_provider_class = SafeJSONProvider
app.json = SafeJSONProvider(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})

PORT = int(os.environ.get('BBT_API_PORT', 8082))
CACHE_TTL = int(os.environ.get('BBT_CACHE_TTL', 300))  # 5 min default
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, '.bbt_cache')
os.makedirs(CACHE_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [BBT-API] %(levelname)s %(message)s',
)
log = logging.getLogger('bbt-api')

# ─── NSE Stock Universe ────────────────────────────────────────────────────

NSE_STOCKS = [
    # Nifty 50
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
]

NSE_INDEX_SYMBOLS = {
    '^NSEI': 'NIFTY 50',
    '^NSEBANK': 'BANK NIFTY',
    '^BSESN': 'SENSEX',
    'NIFTY_FIN_SERVICE.NS': 'FIN NIFTY',
    '^NSMIDCP': 'MIDCAP 100',
}

# Sector mapping for stocks
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
}

# ─── Cache Helpers ──────────────────────────────────────────────────────────

def cache_file(key):
    return os.path.join(CACHE_DIR, f'{key}.json')

def read_cache(key, ttl=CACHE_TTL):
    fpath = cache_file(key)
    if not os.path.exists(fpath):
        return None
    mtime = os.path.getmtime(fpath)
    if time.time() - mtime > ttl:
        return None
    try:
        with open(fpath, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None

def write_cache(key, data):
    fpath = cache_file(key)
    try:
        with open(fpath, 'w') as f:
            json.dump(data, f)
    except OSError as e:
        log.warning(f'Cache write failed: {e}')

# ─── Data Fetching ──────────────────────────────────────────────────────────

def fetch_stock_data(symbol, interval='1d', range_str='6mo'):
    cache_key = f'stock_{symbol}_{interval}_{range_str}'
    cached = read_cache(cache_key)
    if cached:
        return cached

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

        result = {'symbol': symbol, 'candles': candles, 'info': info}
        write_cache(cache_key, result)
        return result

    except Exception as e:
        log.error(f'Error fetching {symbol}: {e}')
        return {'symbol': symbol, 'candles': [], 'info': {}, 'error': str(e)}


def fetch_index_data():
    cache_key = 'indices'
    cached = read_cache(cache_key, ttl=120)  # 2 min for indices
    if cached:
        return cached

    results = []
    for symbol, name in NSE_INDEX_SYMBOLS.items():
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period='2d')
            if not hist.empty:
                last = hist.iloc[-1]
                prev = hist.iloc[-2] if len(hist) > 1 else last
                change = float(last['Close'] - prev['Close'])
                change_pct = round((change / prev['Close']) * 100, 2)
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

    result = {'indices': results, 'updatedAt': datetime.now(timezone.utc).isoformat()}
    write_cache(cache_key, result)
    return result

# ─── API Routes ─────────────────────────────────────────────────────────────

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'time': datetime.now(timezone.utc).isoformat()})


@app.route('/api/stock/<symbol>')
def get_stock(symbol):
    interval = request.args.get('interval', '1d')
    range_str = request.args.get('range', '6mo')
    symbol = symbol.upper()
    if not symbol.endswith('.NS'):
        symbol += '.NS'
    data = fetch_stock_data(symbol, interval, range_str)
    candles = data.get('candles', [])
    info = data.get('info', {})
    return jsonify({
        'symbol': symbol,
        'candles': candles,
        'count': len(candles),
        'info': info,
        'meta': {
            'interval': interval,
            'range': range_str,
            'candleCount': len(candles),
        },
    })


@app.route('/api/indices')
def get_indices():
    data = fetch_index_data()
    return jsonify(data)


@app.route('/api/search')
def search_stocks():
    q = request.args.get('q', '').strip().upper()
    if not q:
        return jsonify({'stocks': [], 'count': 0})

    results = []
    for sym in NSE_STOCKS:
        if q in sym or q in sym.replace('.NS', ''):
            try:
                ticker = yf.Ticker(sym)
                hist = ticker.history(period='5d')
                info = ticker.info or {}
                if not hist.empty:
                    last = hist.iloc[-1]
                    prev = hist.iloc[-2] if len(hist) > 1 else last
                    change = float(last['Close'] - prev['Close'])
                    change_pct = round((change / prev['Close']) * 100, 2)
                    sector = STOCK_SECTORS.get(sym, info.get('sector', ''))
                    results.append({
                        'symbol': sym,
                        'name': info.get('longName', info.get('shortName', sym)),
                        'price': round(float(last['Close']), 2),
                        'change': round(change, 2),
                        'changePercent': change_pct,
                        'volume': int(float(last['Volume'])),
                        'high52w': info.get('fiftyTwoWeekHigh'),
                        'low52w': info.get('fiftyTwoWeekLow'),
                        'marketCap': info.get('marketCap', 0),
                        'sector': sector,
                    })
                    if len(results) >= 10:
                        break
            except Exception as e:
                log.debug(f'Search error {sym}: {e}')
                continue

    results.sort(key=lambda x: abs(x.get('changePercent', 0)), reverse=True)
    return jsonify({'stocks': results, 'count': len(results)})


@app.route('/api/stock-info')
def stock_info():
    symbols_str = request.args.get('symbols', '')
    if not symbols_str:
        return jsonify({'stocks': [], 'count': 0})

    symbols = [s.strip().upper() for s in symbols_str.split(',') if s.strip()]
    results = []

    for sym in symbols:
        if not sym.endswith('.NS'):
            sym += '.NS'
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period='5d')
            info = ticker.info or {}
            if not hist.empty:
                last = hist.iloc[-1]
                prev = hist.iloc[-2] if len(hist) > 1 else last
                change = float(last['Close'] - prev['Close'])
                change_pct = round((change / prev['Close']) * 100, 2) if prev['Close'] != 0 else 0
                sector = STOCK_SECTORS.get(sym, info.get('sector', ''))
                results.append({
                    'symbol': sym,
                    'name': info.get('longName', info.get('shortName', sym)),
                    'price': round(float(last['Close']), 2),
                    'change': round(change, 2),
                    'changePercent': change_pct,
                    'volume': int(float(last['Volume'])),
                    'high52w': info.get('fiftyTwoWeekHigh'),
                    'low52w': info.get('fiftyTwoWeekLow'),
                    'marketCap': info.get('marketCap', 0),
                    'sector': sector,
                    'pe': info.get('trailingPE'),
                    'eps': info.get('trailingEps'),
                })
        except Exception as e:
            log.debug(f'stock-info error {sym}: {e}')
            continue

    return jsonify({'stocks': results, 'count': len(results)})


@app.route('/api/scanner')
def scanner():
    """Darvas Box scanner: scans all Nifty 50 stocks for breakout signals."""
    limit = min(int(request.args.get('limit', 50)), 50)
    quick = request.args.get('quick', '0') == '1'

    picks = []
    symbol_list = NSE_STOCKS[:limit]

    for sym in symbol_list:
        try:
            data = fetch_stock_data(sym, '1d', '6mo')
            candles = data.get('candles', [])
            if len(candles) < 20:
                continue

            closes = np.array([c['close'] for c in candles])
            highs = np.array([c['high'] for c in candles])
            lows = np.array([c['low'] for c in candles])
            volumes = np.array([c['volume'] for c in candles])

            last_price = closes[-1]

            # Darvas box: find consolidation zone (price range + volume contraction)
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

            info = data.get('info', {})
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

            row = {
                'symbol': sym,
                'name': info.get('name', sym),
                'sector': STOCK_SECTORS.get(sym, info.get('sector', '')),
                'price': round(last_price, 2),
                'score': score,
                'signal': signal,
                'conviction': conviction,
                'boxTop': round(box_top, 2),
                'boxBottom': round(box_bottom, 2),
                'boxRange': round(box_range, 2),
                'isBreakout': bool(is_breakout),
                'entryZoneLow': entry_zone_low,
                'entryZoneHigh': round(box_top * 1.01, 2),
                'stopLoss': stop_loss,
                'target1': target1,
                'target2': target2,
                'riskPct': risk,
                'rsi': round(rsi, 1),
                'volumeRatio': round(volume_ratio, 2),
                'uptrend': bool(uptrend),
                'momentumProof': momentum_proofs,
                'peRatio': info.get('pe'),
                'marketCap': info.get('marketCap'),
                'eps': info.get('eps'),
            }
            picks.append(row)

            if quick:
                break

        except Exception as e:
            log.debug(f'Scanner error {sym}: {e}')
            continue

    picks.sort(key=lambda x: x['score'], reverse=True)
    return jsonify({
        'picks': picks,
        'count': len(picks),
        'scanned': len(symbol_list),
    })


# ─── Main ───────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='BBT Backend API')
    parser.add_argument('--port', type=int, default=PORT, help='Port to run on')
    parser.add_argument('--debug', action='store_true', help='Debug mode')
    args = parser.parse_args()

    log.info(f'Starting BBT API on port {args.port} (debug={args.debug})')
    app.run(host='0.0.0.0', port=args.port, debug=args.debug)

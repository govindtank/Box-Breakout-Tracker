import { Candle } from "./darvas";

export async function fetchHistoricalData(symbol: string = 'BTCUSDT', interval: string = '1d', limit: number = 500): Promise<Candle[]> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const data = await response.json();
    
    return data.map((d: any) => ({
      time: Math.floor(d[0] / 1000), // Convert to seconds for lightweight-charts
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
  } catch (error) {
    console.error("Error fetching binance data:", error);
    return [];
  }
}

export function subscribeToRealtime(symbol: string, interval: string, onUpdate: (candle: Candle) => void) {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const kline = message.k;
        
        const candle: Candle = {
            time: Math.floor(kline.t / 1000),
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v)
        };
        
        onUpdate(candle);
    };

    return () => ws.close();
}

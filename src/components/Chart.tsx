import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickSeries, LineSeries, createSeriesMarkers, ISeriesMarkersPluginApi, SeriesMarker } from 'lightweight-charts';
import { Candle, Trade } from '../lib/darvas';

interface ChartProps {
  candles: Candle[];
  topSeriesData: { time: number; value: number }[];
  bottomSeriesData: { time: number; value: number }[];
  trades: Trade[];
}

export function TradingChart({ candles, topSeriesData, bottomSeriesData, trades }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const topSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bottomSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' }, // Tailwind slate-900
        textColor: '#94a3b8', // Tailwind slate-400
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const topLineSeries = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const bottomLineSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const seriesMarkers = createSeriesMarkers(candlestickSeries);

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    markersRef.current = seriesMarkers;
    topSeriesRef.current = topLineSeries;
    bottomSeriesRef.current = bottomLineSeries;

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !topSeriesRef.current || !bottomSeriesRef.current) return;

    const formattedCandles = candles.map(c => ({
      ...c,
      time: c.time as Time
    }));
    
    // Sort and ensure unique times
    const uniqueCandles = Array.from(new Map(formattedCandles.map(item => [item.time, item])).values());
    uniqueCandles.sort((a, b) => (a.time as number) - (b.time as number));

    seriesRef.current.setData(uniqueCandles);

    // Filter series data to only include times that exist in candles to avoid errors
    const validTimes = new Set(uniqueCandles.map(c => c.time));
    
    const formattedTops = topSeriesData
        .filter(t => validTimes.has(t.time as Time))
        .map(t => ({ time: t.time as Time, value: t.value }));
    const uniqueTops = Array.from(new Map(formattedTops.map(item => [item.time, item])).values());
    uniqueTops.sort((a, b) => (a.time as number) - (b.time as number));
    topSeriesRef.current.setData(uniqueTops);

    const formattedBottoms = bottomSeriesData
        .filter(b => validTimes.has(b.time as Time))
        .map(b => ({ time: b.time as Time, value: b.value }));
    const uniqueBottoms = Array.from(new Map(formattedBottoms.map(item => [item.time, item])).values());
    uniqueBottoms.sort((a, b) => (a.time as number) - (b.time as number));
    bottomSeriesRef.current.setData(uniqueBottoms);

    // Set Markers for Trades
    const markers: SeriesMarker<Time>[] = [];
    for (const trade of trades) {
       markers.push({
           time: trade.entryTime as Time,
           position: 'belowBar',
           color: '#22c55e',
           shape: 'arrowUp',
           text: 'BUY'
       });
       if (trade.exitTime) {
           markers.push({
               time: trade.exitTime as Time,
               position: 'aboveBar',
               color: '#ef4444',
               shape: 'arrowDown',
               text: 'SELL'
           });
       }
    }
    
    markers.sort((a, b) => (a.time as number) - (b.time as number));
    if (markersRef.current) {
        markersRef.current.setMarkers(markers);
    }

  }, [candles, topSeriesData, bottomSeriesData, trades]);

  return <div ref={chartContainerRef} className="w-full h-[400px] rounded-lg overflow-hidden border border-slate-800" />;
}

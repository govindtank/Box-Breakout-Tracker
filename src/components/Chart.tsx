import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, LineSeries, CandlestickData } from 'lightweight-charts';
import type { Time } from 'lightweight-charts';
import { Candle, CandleData } from '../lib/darvas';

interface ChartPoint {
  time: number;
  value: number;
}

interface CandlestickChartPoint {
  time: number;
  value: { open: number; high: number; low: number; close: number };
}

interface MarkerData {
  time: number | string;
  position: 'aboveBar' | 'belowBar' | 'inBar';
  color?: string;
  shape?: string;
  size?: number;
  text?: string;
}

interface TradeEntry {
  entryPrice?: number;
  exitPrice?: number;
  status?: string;
  pnl?: number;
}

interface TradingChartProps {
  candles: Candle[];
  topSeriesData: CandleData[];
  bottomSeriesData: CandleData[];
  trades: TradeEntry[];
}

/**
 * Chart component that displays Darvas Box strategy visualization with candlestick chart,
 * top/bottom level indicators, and trade markers.
 */
export function TradingChart({ candles, topSeriesData, bottomSeriesData, trades }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  let chartRef: ReturnType<typeof createChart> | undefined;

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing chart
    if (chartRef) {
      chartRef.remove();
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        vertLine: { width: 1, color: 'rgba(255, 255, 255, 0.1)' },
        horzLine: { width: 1, color: 'rgba(255, 255, 255, 0.1)' },
      },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const topSeries = chart.addSeries(LineSeries, {
      color: '#6366f1',
      lineWidth: 2,
      lastValueVisible: false,
    });

    const bottomSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      lastValueVisible: false,
    });

    // Prepare candlestick data — flat format for CandlestickSeries
    const candlestickData = candles.map((c) => ({ 
      time: c.time as Time, 
      open: c.open, 
      high: c.high, 
      low: c.low, 
      close: c.close 
    }));

    try {
      candleSeries.setData(candlestickData);
    } catch (error) {
      console.warn('Failed to set candle data:', error);
    }

    if (topSeriesData.length > 0) {
      // Prepare top level line data - matching lightweight-charts format with proper time type assertion
      const topLineData = topSeriesData.map((d) => ({ time: d.time as unknown as Time, value: d.value }));
      
      try {
        topSeries.setData(topLineData);
      } catch (error) {
        console.warn('Failed to set top series data:', error);
      }
    }

    if (bottomSeriesData.length > 0) {
      // Prepare bottom level line data - matching lightweight-charts format with proper time type assertion
      const bottomLineData = bottomSeriesData.map((d) => ({ time: d.time as unknown as Time, value: d.value }));
      
      try {
        bottomSeries.setData(bottomLineData);
      } catch (error) {
        console.warn('Failed to set bottom series data:', error);
      }
    }

    // Trade markers using lightweight-charts marker API
    const markers: Array<{ time: number | string; position: 'aboveBar' | 'belowBar' | 'inBar'; color?: string; shape?: string; size?: number; text?: string }> = [];

    trades.forEach((trade) => {
      const isLongPosition = trade.entryPrice && candles.some(c => c.close >= trade.entryPrice && c.open <= trade.entryPrice);
      
      if (trade.entryPrice && isLongPosition) {
        const entryCandle = candles.find(c => c.close >= trade.entryPrice && c.open <= trade.entryPrice);
        if (entryCandle) {
          markers.push({
            time: entryCandle.time,
            position: 'belowBar',
            color: '#3b82f6',
            shape: 'arrowUp',
            size: 15,
            text: `Long Entry @ ${trade.entryPrice.toFixed(2)}`,
          });
        }
      }

      if (trade.exitPrice && trade.status === 'CLOSED') {
        const exitCandle = candles.find(c => c.close >= trade.exitPrice && c.open <= trade.exitPrice);
        if (exitCandle) {
          markers.push({
            time: exitCandle.time,
            position: trade.pnl > 0 ? 'aboveBar' : 'belowBar',
            color: trade.pnl > 0 ? '#10b981' : '#ef4444',
            shape: trade.pnl > 0 ? 'arrowUp' : 'arrowDown',
            size: 15,
            text: `Exit @ ${trade.exitPrice.toFixed(2)} ${trade.pnl > 0 ? '(WIN)' : '(LOSS)'}`,
          });
        }
      }
    });

    if (markers.length > 0) {
      // Set markers using lightweight-charts marker API - type assertion needed for library-specific method
      try {
        // ChartRef is unknown due to generic ReturnType, cast to any for marker API access
        (chartRef as any).setMarkers(markers);
      } catch (error) {
        console.warn('Failed to set markers:', error);
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current && chartRef) {
        chartRef.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef) {
        chartRef.remove();
      }
    };
  }, [candles, topSeriesData, bottomSeriesData, trades]);

  return <div ref={containerRef} className="w-full h-full" />;
}
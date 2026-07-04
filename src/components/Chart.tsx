import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';

interface TradingChartProps {
  candles: any[];
  topSeriesData: { time: number; value: number }[];
  bottomSeriesData: { time: number; value: number }[];
  trades: any[];
}

export function TradingChart({ candles, topSeriesData, bottomSeriesData, trades }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
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

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // Top box line (resistance)
    const topSeries = chart.addSeries(LineSeries, {
      color: '#6366f1',
      lineWidth: 2,
      lastValueVisible: false,
    });

    // Bottom box line (support)
    const bottomSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      lastValueVisible: false,
    });

    candleSeries.setData(candles);
    
    if (topSeriesData.length > 0) {
      topSeries.setData(topSeriesData.map((point, i) => ({
        time: candles[i]?.time || point.time,
        value: point.value,
      })));
    }

    if (bottomSeriesData.length > 0) {
      bottomSeries.setData(bottomSeriesData.map((point, i) => ({
        time: candles[i]?.time || point.time,
        value: point.value,
      })));
    }

    // Trade markers
    try {
      trades.forEach((trade: any) => {
        const markers: any[] = [];

        if (trade.entryPrice) {
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
            const isProfit = trade.pnl > 0;
            markers.push({
              time: exitCandle.time,
              position: isProfit ? 'aboveBar' : 'belowBar',
              color: isProfit ? '#10b981' : '#ef4444',
              shape: isProfit ? 'arrowUp' : 'arrowDown',
              size: 15,
              text: `Exit @ ${trade.exitPrice.toFixed(2)} ${isProfit ? '(WIN)' : '(LOSS)'}`,
            });
          }
        }

        if (markers.length > 0) {
          (candleSeries as any).setMarkers(markers);
        }
      });
    } catch (e) {
      // Markers API may not be available in all versions
      console.log('Chart markers not supported, continuing without markers');
    }

    // Fit content
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [candles, topSeriesData, bottomSeriesData, trades]);

  return <div ref={containerRef} className="w-full h-full" />;
}

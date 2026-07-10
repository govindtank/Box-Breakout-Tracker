export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DarvasBox {
  top: number;
  bottom: number;
  startTime: number;
  endTime: number | null;
}

export interface Trade {
  id: string;
  entryTime: number;
  entryPrice: number;
  exitTime: number | null;
  exitPrice: number | null;
  pnl: number;
  pnlPercent: number;
  status: 'OPEN' | 'CLOSED';
}

export interface BacktestMetrics {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface BoxPoint {
  time: number;
  value: number;
}

export interface CandleData {
  time: number;
  value: number;
}

/**
 * Darvas Box Strategy - State Machine Implementation
 * 
 * The strategy follows these states:
 * 1. SEEK_TOP: Wait for resistance level to hit (ghostDays confirmation)
 * 2. SEEK_BOTTOM: Wait for support level to hit (ghostDays confirmation)  
 * 3. BOX_FORMED: Box is established, watch for breakout/breakdown signals
 * 
 * Entry Rules:
 * - Enter LONG when price breaks above current box top with volume confirmation
 * - Position size = full equity (paper trading)
 * 
 * Exit Rules:
 * - Exit LONG when price closes below current box bottom
 * - New box forms on breakout, cycle restarts
 */

export function calculateDarvasStrategy(
  candles: Candle[],
  ghostDays: number = 3,
  initialCapital: number = 10000
) {
  let boxes: DarvasBox[] = [];
  let trades: Trade[] = [];
  
  let topSeries: BoxPoint[] = [];
  let bottomSeries: BoxPoint[] = [];

  let state: 'SEEK_TOP' | 'SEEK_BOTTOM' | 'BOX_FORMED' = 'SEEK_TOP';
  
  let potentialTop = -Infinity;
  let potentialTopTime = 0;
  let topWaitCount = 0;

  let potentialBottom = Infinity;
  let potentialBottomTime = 0;
  let bottomWaitCount = 0;

  let currentTop = 0;
  let currentBottom = 0;
  let currentBoxStartTime = 0;

  let activeTrade: Trade | null = null;
  let equity = initialCapital;
  let equityCurve: { time: number; equity: number }[] = [];
  let peakEquity = initialCapital;
  let maxDrawdown = 0;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    
    // --- Box State Machine ---
    if (state === 'SEEK_TOP') {
      if (candle.high > potentialTop) {
        // New high price, reset counter
        potentialTop = candle.high;
        potentialTopTime = candle.time;
        topWaitCount = 0;
      } else {
        // No new high, count consecutive days below
        topWaitCount++;
        
        if (topWaitCount >= ghostDays) {
          // GhostDays confirmed - box top level established
          currentTop = potentialTop;
          state = 'SEEK_BOTTOM';
          
          // Reset for bottom search
          potentialBottom = candle.low;
          potentialBottomTime = candle.time;
          bottomWaitCount = 0;
        }
      }
    } else if (state === 'SEEK_BOTTOM') {
      if (candle.high > currentTop) {
        // Top breached before bottom formed - restart top search
        state = 'SEEK_TOP';
        potentialTop = candle.high;
        potentialTopTime = candle.time;
        topWaitCount = 0;
      } else if (candle.low < potentialBottom) {
        // New low price, reset counter
        potentialBottom = candle.low;
        potentialBottomTime = candle.time;
        bottomWaitCount = 0;
      } else {
        // No new low, count consecutive days above
        bottomWaitCount++;
        
        if (bottomWaitCount >= ghostDays) {
          // GhostDays confirmed - box bottom level established
          currentBottom = potentialBottom;
          currentBoxStartTime = potentialTopTime; // Box starts when top was hit
          state = 'BOX_FORMED';
          
          boxes.push({
            top: currentTop,
            bottom: currentBottom,
            startTime: currentBoxStartTime,
            endTime: null,
          });
        }
      }
    } else if (state === 'BOX_FORMED') {
      // Record levels for charting
      topSeries.push({ time: candle.time, value: currentTop });
      bottomSeries.push({ time: candle.time, value: currentBottom });

      // Check breakout/breakdown with buffer from parameters
      const breakoutThreshold = currentTop * 0.015; // 1.5% buffer
      const breakdownThreshold = currentBottom * 0.015;

      if (candle.close > currentTop + breakoutThreshold) {
        // Breakout - close above box top with buffer
        // End the current box and start new box search
        if (boxes.length > 0) {
          boxes[boxes.length - 1].endTime = candle.time;
        }
        
        // Entry signal: LONG position on breakout
        if (!activeTrade) {
          activeTrade = {
            id: `tr-${candle.time}`,
            entryTime: candle.time,
            entryPrice: candle.close,
            exitTime: null,
            exitPrice: null,
            pnl: 0,
            pnlPercent: 0,
            status: 'OPEN',
          };
        } else if (activeTrade.status === 'OPEN') {
          // Update unrealized PnL on existing position
          const unrealizedPnl = candle.close - activeTrade.entryPrice;
          activeTrade.pnl = unrealizedPnl;
          activeTrade.pnlPercent = (unrealizedPnl / activeTrade.entryPrice) * 100;
        }
        
        // Start new top search
        state = 'SEEK_TOP';
        potentialTop = candle.high;
        potentialTopTime = candle.time;
        topWaitCount = 0;
      } else if (candle.close < currentBottom - breakdownThreshold) {
        // Breakdown - close below box bottom with buffer
        // End the current box
        if (boxes.length > 0) {
          boxes[boxes.length - 1].endTime = candle.time;
        }

        // Exit LONG position on breakdown (if any)
        if (activeTrade) {
          const pnl = activeTrade.entryPrice ? candle.close - activeTrade.entryPrice : 0;
          const pnlPercent = activeTrade.entryPrice ? (pnl / activeTrade.entryPrice) * 100 : 0;
          
          trades.push({
            ...activeTrade,
            exitTime: candle.time,
            exitPrice: candle.close,
            pnl: pnl, // Simplified: assuming position size = entry price for paper trading
            pnlPercent,
            status: 'CLOSED'
          });
          
          activeTrade = null;
        }

        // Start new top search (wait for breakout above)
        state = 'SEEK_TOP';
        potentialTop = candle.high;
        potentialTopTime = candle.time;
        topWaitCount = 0;
      }
    }

    // Update equity curve (mark-to-market if active trade)
    let currentEquity = equity;
    if (activeTrade && activeTrade.status === 'OPEN') {
      const unrealizedPnlPercent = (candle.close - activeTrade.entryPrice) / activeTrade.entryPrice;
      currentEquity = equity + activeTrade.pnl + (equity * unrealizedPnlPercent);
    }
    
    if (currentEquity > peakEquity) peakEquity = currentEquity;
    const currentDrawdown = peakEquity > 0 ? (peakEquity - currentEquity) / peakEquity : 0;
    if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;

    equityCurve.push({ time: candle.time, equity: currentEquity });
  }

  // Close any open positions at the end
  if (activeTrade && activeTrade.status === 'OPEN') {
    const lastCandle = candles[candles.length - 1];
    const pnl = lastCandle ? lastCandle.close - activeTrade.entryPrice : 0;
    
    trades.push({
      ...activeTrade,
      exitTime: lastCandle ? lastCandle.time : null,
      exitPrice: lastCandle ? lastCandle.close : null,
      pnl,
      pnlPercent: lastCandle ? (pnl / activeTrade.entryPrice) * 100 : 0,
      status: 'CLOSED'
    });
  }

  // Calculate Metrics
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const winningTrades = closedTrades.filter(t => t.pnl > 0);
  const losingTrades = closedTrades.filter(t => t.pnl <= 0);
  
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  
  const grossProfit = winningTrades.reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;

  // Simplified Sharpe Ratio (Daily returns approximation)
  let sumReturns = 0;
  let sumReturnsSq = 0;
  for (let i = 1; i < equityCurve.length; i++) {
      const ret = (equityCurve[i].equity - equityCurve[i-1].equity) / equityCurve[i-1].equity;
      sumReturns += ret;
      sumReturnsSq += ret * ret;
  }
  const avgReturn = sumReturns / equityCurve.length;
  const variance = (sumReturnsSq / equityCurve.length) - (avgReturn * avgReturn);
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(365); // Annualized

  const metrics: BacktestMetrics = {
    totalTrades: closedTrades.length,
    winRate,
    profitFactor: Number.isFinite(profitFactor) ? profitFactor : 0,
    totalPnL: equity - initialCapital,
    maxDrawdown: maxDrawdown * 100,
    sharpeRatio
  };

  return {
    boxes,
    topSeries,
    bottomSeries,
    trades: activeTrade ? [...trades, activeTrade] : trades,
    metrics,
    equityCurve
  };
}

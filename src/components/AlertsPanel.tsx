import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';

interface TradeAlert {
  id: string;
  type: 'BREAKOUT' | 'BREAKDOWN' | 'BOX_FORMED' | 'TRADE_ENTRY' | 'TRADE_EXIT';
  symbol: string;
  price: number;
  time: number;
  message: string;
  status: 'pending' | 'triggered';
}

interface AlertsPanelProps {
  currentSymbol: string;
}

export default function AlertsPanel({ currentSymbol }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<TradeAlert[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Simulate incoming alerts for demo
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      const now = Date.now();
      
      // Random chance of generating an alert (for demo purposes)
      if (Math.random() > 0.7 && currentSymbol === 'RELIANCE.NS') {
        const rand = Math.random();
        
        if (rand < 0.33) {
          // Box formed alert
          addAlert('BOX_FORMED', `Darvas box formed for ${currentSymbol} at ₹${(150 + Math.random() * 50).toFixed(2)} - Watch for breakout`);
        } else if (rand < 0.66) {
          // Breakout alert
          addAlert('BREAKOUT', `${currentSymbol} breaking out! Entry signal @ ₹${(140 + Math.random() * 30).toFixed(2)}`);
        } else {
          // Box breakdown alert
          addAlert('BREAKDOWN', `${currentSymbol} box breakdown - Consider exiting long positions`);
        }
      }
    }, 5000);

    return () => clearInterval(simulationInterval);
  }, [currentSymbol]);

  const addAlert = (type: TradeAlert['type'], message: string) => {
    const newAlert: TradeAlert = {
      id: `alert-${Date.now()}`,
      type,
      symbol: currentSymbol.replace('.NS', ''),
      price: 100 + Math.random() * 500,
      time: Date.now(),
      message,
      status: 'triggered',
    };

    setAlerts(prev => [...prev, newAlert]);
    setNotificationCount(prev => prev + 1);

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
      setNotificationCount(prev => Math.max(0, prev - 1));
    }, 10000);
  };

  const getAlertIcon = (type: TradeAlert['type']) => {
    switch (type) {
      case 'BREAKOUT': return <Bell className="w-4 h-4 text-green-500" />;
      case 'BREAKDOWN': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'BOX_FORMED': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'TRADE_ENTRY': return <Bell className="w-4 h-4 text-purple-500" />;
      case 'TRADE_EXIT': return <CheckCircle2 className="w-4 h-4 text-orange-500" />;
    }
  };

  const getMessageColor = (type: TradeAlert['type']) => {
    switch (type) {
      case 'BREAKOUT': return 'text-green-500';
      case 'BREAKDOWN': return 'text-red-500';
      case 'BOX_FORMED': return 'text-blue-500';
      case 'TRADE_ENTRY': return 'text-purple-500';
      case 'TRADE_EXIT': return 'text-orange-500';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#131722]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${notificationCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Bell className="w-4 h-4 text-blue-400" />
            <span>Alerts & Notifications</span>
          </h2>
        </div>
        
        {notificationCount > 0 && (
          <div className={`text-xs font-bold px-2 py-1 rounded bg-slate-800 ${getMessageColor('BREAKOUT')} animate-pulse`}>
            {notificationCount} new
          </div>
        )}
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center">
            <Bell className="w-8 h-8 mb-2 opacity-30" />
            <span>No active alerts</span>
            <span className="text-xs mt-1">Alerts will appear here for breakouts, breakdowns, and box formations</span>
          </div>
        ) : (
          alerts.map(alert => (
            <div 
              key={alert.id}
              className={`p-3 rounded border transition-all animate-in fade-in slide-in-from-right-4 ${
                alert.status === 'triggered' 
                  ? alert.type === 'BREAKOUT' 
                    ? 'bg-green-500/10 border-green-500/20'
                    : alert.type === 'BREAKDOWN'
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-slate-800/50 border-slate-700'
                  : 'bg-slate-800/30 border-slate-700/50 opacity-70'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className="pt-0.5">{getAlertIcon(alert.type)}</div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${getMessageColor(alert.type)}`}>
                    {alert.message}
                  </p>
                  
                  <div className="flex items-center space-x-3 mt-1 text-[10px] text-slate-500">
                    <span className="font-mono">{alert.symbol}</span>
                    <span>@ ₹{alert.price.toFixed(2)}</span>
                    <span>{new Date(alert.time).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Alert Details */}
              {alert.status === 'triggered' && (
                <div className={`mt-2 px-2 py-1 rounded text-[9px] ${
                  alert.type === 'BREAKOUT' ? 'bg-green-500/20 text-green-400' :
                  alert.type === 'BREAKDOWN' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {alert.type === 'BREAKOUT' && '💚 Enter LONG — Box breakout confirmed'}
                  {alert.type === 'BREAKDOWN' && '🔴 Exit LONG — Box breakdown detected'}
                  {alert.type === 'BOX_FORMED' && '🔵 Box established — Watch for breakout'}
                  {alert.type === 'TRADE_ENTRY' && '📦 Trade entry executed'}
                  {alert.type === 'TRADE_EXIT' && '✅ Trade closed with P&L'}
                </div>
              )}
            </div>
          ))
        )}

        {/* Demo Status */}
        <div className="mt-auto pt-3 border-t border-slate-800">
          <div className="text-center text-[10px] text-slate-500 italic">
            🎭 This is a demo — connect your brokerage API for real alerts
          </div>
        </div>
      </div>
    </div>
  );
}

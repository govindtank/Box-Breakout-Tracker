import { useState, useEffect } from 'react';
import {
  Bell, BellOff, Plus, Trash2, AlertTriangle,
  TrendingUp, TrendingDown, Volume2, Package,
} from 'lucide-react';
import { AlertRule } from '../lib/constants';
import { loadAlerts, addAlert, removeAlert, toggleAlert, requestNotificationPermission } from '../lib/alerts';
import { formatDateTime } from '../lib/utils';

interface AlertsPanelProps {
  currentSymbol?: string;
}

export default function AlertsPanel({ currentSymbol }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlert, setNewAlert] = useState<{
    symbol: string;
    type: AlertRule['type'];
    params: Record<string, number>;
  }>({
    symbol: currentSymbol?.replace('.NS', '') || '',
    type: 'breakout',
    params: { threshold: 1.5 },
  });

  useEffect(() => {
    setAlerts(loadAlerts());
    requestNotificationPermission();
  }, []);

  const refreshAlerts = () => setAlerts(loadAlerts());

  const handleCreate = () => {
    const alert: Omit<AlertRule, 'id' | 'createdAt' | 'lastTriggered'> = {
      symbol: newAlert.symbol.includes('.NS') ? newAlert.symbol : `${newAlert.symbol}.NS`,
      type: newAlert.type,
      params: newAlert.params,
      enabled: true,
    };
    addAlert(alert);
    refreshAlerts();
    setShowCreate(false);
    setNewAlert({ symbol: currentSymbol?.replace('.NS', '') || '', type: 'breakout', params: { threshold: 1.5 } });
  };

  const alertIcons: Record<string, React.ReactNode> = {
    breakout: <TrendingUp className="w-3.5 h-3.5 text-green-400" />,
    breakdown: <TrendingDown className="w-3.5 h-3.5 text-red-400" />,
    price_above: <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />,
    price_below: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
    volume_spike: <Volume2 className="w-3.5 h-3.5 text-purple-400" />,
    box_formation: <Package className="w-3.5 h-3.5 text-blue-400" />,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-[#131722] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Alerts</h2>
          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">{alerts.length}</span>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center space-x-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Alert</span>
        </button>
      </div>

      {/* Create Alert Form */}
      {showCreate && (
        <div className="border-b border-slate-800 bg-[#1a1f2e] p-4 space-y-3 transition-all">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase">Stock Symbol</label>
            <input
              type="text"
              value={newAlert.symbol}
              onChange={e => setNewAlert(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
              placeholder="RELIANCE"
              className="w-full bg-[#1e222d] border border-slate-700 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase">Alert Type</label>
            <select
              value={newAlert.type}
              onChange={e => setNewAlert(prev => ({ ...prev, type: e.target.value as AlertRule['type'] }))}
              className="w-full bg-[#1e222d] border border-slate-700 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-white"
            >
              <option value="breakout">Breakout above box top</option>
              <option value="breakdown">Breakdown below box bottom</option>
              <option value="price_above">Price crosses above target</option>
              <option value="price_below">Price crosses below target</option>
              <option value="volume_spike">Volume spike detected</option>
              <option value="box_formation">New box formation detected</option>
            </select>
          </div>
          {newAlert.type === 'volume_spike' && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Volume Multiplier</label>
              <input
                type="number"
                value={newAlert.params.multiplier || 1.5}
                onChange={e => setNewAlert(prev => ({ ...prev, params: { ...prev.params, multiplier: Number(e.target.value) } }))}
                min={1}
                step={0.5}
                className="w-full bg-[#1e222d] border border-slate-700 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-white"
              />
            </div>
          )}
          {(newAlert.type === 'price_above' || newAlert.type === 'price_below') && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Target Price</label>
              <input
                type="number"
                value={newAlert.params.target || 0}
                onChange={e => setNewAlert(prev => ({ ...prev, params: { ...prev.params, target: Number(e.target.value) } }))}
                className="w-full bg-[#1e222d] border border-slate-700 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-white"
              />
            </div>
          )}
          <button
            onClick={handleCreate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded transition-colors"
          >
            Create Alert
          </button>
        </div>
      )}

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No alerts configured</p>
            <p className="text-[10px] mt-1 text-slate-600">Click "New Alert" to create one</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800/50 transition-colors group"
            >
              {alertIcons[alert.type] || <Bell className="w-3.5 h-3.5 text-slate-400" />}
              <div className="flex-1 ml-2.5 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">{alert.symbol.replace('.NS', '')}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{alert.type.replace('_', ' ')}</span>
                </div>
                <div className="text-[10px] text-slate-600">
                  Created {formatDateTime(alert.createdAt / 1000)}
                  {alert.lastTriggered && ` · Last triggered ${formatDateTime(alert.lastTriggered / 1000)}`}
                </div>
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { toggleAlert(alert.id); refreshAlerts(); }}
                  className={`p-1.5 rounded transition-colors ${
                    alert.enabled ? 'text-green-400 hover:bg-green-500/20' : 'text-slate-500 hover:bg-slate-700'
                  }`}
                >
                  {alert.enabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => { removeAlert(alert.id); refreshAlerts(); }}
                  className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

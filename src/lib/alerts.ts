/**
 * Alert Engine — Browser-based notifications and alert management
 */

import { AlertRule } from './constants';

const STORAGE_KEY = 'darvas_alerts';

export function loadAlerts(): AlertRule[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: AlertRule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function addAlert(alert: Omit<AlertRule, 'id' | 'createdAt' | 'lastTriggered'>): AlertRule {
  const alerts = loadAlerts();
  const newAlert: AlertRule = {
    ...alert,
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    lastTriggered: null,
  };
  alerts.push(newAlert);
  saveAlerts(alerts);
  return newAlert;
}

export function removeAlert(id: string): void {
  const alerts = loadAlerts().filter(a => a.id !== id);
  saveAlerts(alerts);
}

export function toggleAlert(id: string): void {
  const alerts = loadAlerts();
  const idx = alerts.findIndex(a => a.id === id);
  if (idx !== -1) {
    alerts[idx].enabled = !alerts[idx].enabled;
    saveAlerts(alerts);
  }
}

export function triggerAlert(alert: AlertRule): void {
  alert.lastTriggered = Date.now();
  saveAlerts(loadAlerts().map(a => a.id === alert.id ? alert : a));

  // Browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`🔔 Darvas Alert: ${alert.symbol}`, {
      body: getAlertMessage(alert),
      icon: '/favicon.ico',
    });
  }
}

function getAlertMessage(alert: AlertRule): string {
  switch (alert.type) {
    case 'breakout': return `🚀 Breakout detected above box top!`;
    case 'breakdown': return `📉 Breakdown below box bottom!`;
    case 'price_above': return `₹ Price above ₹${alert.params.target}`;
    case 'price_below': return `₹ Price below ₹${alert.params.target}`;
    case 'volume_spike': return `📊 Volume spike ${alert.params.multiplier}x above average!`;
    case 'box_formation': return `📦 New Darvas box forming!`;
    default: return 'Alert triggered';
  }
}

export function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

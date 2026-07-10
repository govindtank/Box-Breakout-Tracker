/**
 * Utility functions for formatting and data manipulation
 */

export function formatCurrency(
  value: number,
  useINR: boolean = true
): string {
  if (useINR) {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatPercent(
  value: number,
  showSign: boolean = true
): string {
  const formatted = (value * 100).toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
  
  if (showSign) {
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
  }
  
  return `${formatted}%`;
}

export function formatVolume(value: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);
  
  return formatted.toUpperCase();
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(timestamp: number): string {
  return formatDate(timestamp) + ' ' + formatTime(timestamp);
}

export function calculatePercentageChange(newVal: number, oldVal: number): number {
  if (oldVal === 0) return 0;
  return ((newVal - oldVal) / Math.abs(oldVal)) * 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getDayOfWeek(timestamp: number): number {
  const date = new Date(timestamp * 1000);
  return date.getDay(); // 0 = Sunday, 6 = Saturday
}

export function isWeekend(timestamp: number): boolean {
  return getDayOfWeek(timestamp) === 0 || getDayOfWeek(timestamp) === 6;
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

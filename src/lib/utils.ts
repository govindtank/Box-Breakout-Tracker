import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatCurrency(value: number, inINR: boolean = true) {
  return inINR ? formatINR(value) : formatUSD(value);
}

export function formatPercent(value: number) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatLargeNumber(value: number): string {
  if (value >= 1_00_00_000) { // 1 Cr+
    return `${(value / 1_00_00_000).toFixed(2)}Cr`;
  }
  if (value >= 1_00_000) { // 1 Lac+
    return `${(value / 1_00_000).toFixed(2)}L`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

export function formatVolume(value: number): string {
  if (value >= 1_00_00_000) {
    return `${(value / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (value >= 1_00_000) {
    return `${(value / 1_00_000).toFixed(2)} L`;
  }
  return value.toLocaleString('en-IN');
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

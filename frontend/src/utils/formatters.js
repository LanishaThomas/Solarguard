/**
 * Formatting utilities for SolarGuard metrics and dates
 */

export function formatVoltage(v) {
  if (v == null || isNaN(v)) return '-- V';
  return `${Number(v).toFixed(2)} V`;
}

export function formatCurrent(a) {
  if (a == null || isNaN(a)) return '-- mA';
  const mA = Number(a) * 1000;
  if (mA >= 1000) {
    return `${(mA / 1000).toFixed(3)} A`;
  }
  if (mA > 0 && mA < 10) {
    return `${mA.toFixed(2)} mA`;
  }
  return `${Math.round(mA)} mA`;
}

export function formatPower(w) {
  if (w == null || isNaN(w)) return '-- W';
  const num = Number(w);
  if (num > 0 && num < 0.01) {
    return `${(num * 1000).toFixed(1)} mW`;
  }
  return `${num.toFixed(3)} W`;
}

export function formatTemperature(c) {
  if (c == null || isNaN(c)) return '-- °C';
  return `${Number(c).toFixed(1)} °C`;
}

export function formatTimestamp(dateInput) {
  if (!dateInput) return '--';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDateFull(dateInput) {
  if (!dateInput) return '--';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

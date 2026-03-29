export function fmt(n: number, decimals = 2): string {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtIDR(n: number): string {
  if (!isFinite(n)) return '—';
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

export function fmtUSD(n: number, decimals = 2): string {
  if (!isFinite(n)) return '—';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtPct(n: number, decimals = 2): string {
  if (!isFinite(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  return sign + n.toFixed(decimals) + '%';
}

export function fmtPnl(n: number, usdtRate: number): { usdt: string; idr: string; isPositive: boolean } {
  const isPositive = n >= 0;
  const sign = isPositive ? '+' : '';
  return {
    usdt: sign + fmtUSD(n),
    idr: sign + fmtIDR(n * usdtRate),
    isPositive,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

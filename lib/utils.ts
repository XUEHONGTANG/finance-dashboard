export function formatNumber(n: number | null | undefined, decimals = 2): string {
  if (n == null) return '—';
  return n.toFixed(decimals);
}

export function formatPercent(n: number | null | undefined, decimals = 2): string {
  if (n == null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

export function formatLargeNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toFixed(0);
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return '—';
  return `$${formatLargeNumber(n)}`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '剛更新';
  if (mins < 60) return `${mins} 分鐘前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小時前`;
  return `${Math.floor(hrs / 24)} 天前`;
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getFearGreedColor(score: number | null): string {
  if (score == null) return 'text-slate-400';
  if (score <= 25) return 'text-red-500';
  if (score <= 45) return 'text-orange-500';
  if (score <= 55) return 'text-yellow-500';
  if (score <= 75) return 'text-lime-500';
  return 'text-green-500';
}

export function getFearGreedLabel(score: number | null): string {
  if (score == null) return '—';
  if (score <= 25) return '極度恐懼 Extreme Fear';
  if (score <= 45) return '恐懼 Fear';
  if (score <= 55) return '中性 Neutral';
  if (score <= 75) return '貪婪 Greed';
  return '極度貪婪 Extreme Greed';
}

export const WATCHLIST_DEFAULT = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN'];

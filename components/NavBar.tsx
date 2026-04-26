'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSWRConfig } from 'swr';

const links = [
  { href: '/', label: '總覽', shortLabel: '總覽' },
  { href: '/sec', label: '機構 13F 報告', shortLabel: '13F' },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [ticker, setTicker] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { mutate } = useSWRConfig();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (t) {
      router.push(`/stocks/${t}`);
      setTicker('');
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await mutate(() => true, undefined, { revalidate: true });
    setLastUpdated(new Date());
    setRefreshing(false);
  }

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main row */}
        <div className="flex items-center justify-between h-14 gap-2 sm:gap-4">
          <Link href="/" className="font-bold text-slate-900 tracking-tight shrink-0 text-sm sm:text-base">
            📊 <span className="hidden sm:inline">投資儀表板</span>
            <span className="sm:hidden">儀表板</span>
          </Link>

          {/* Ticker search — desktop only inline */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-1.5 flex-1 max-w-xs">
            <input
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              placeholder="輸入股票代號（如 AAPL）"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shrink-0"
            >
              查詢
            </button>
          </form>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="sm:hidden">{l.shortLabel}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            ))}
            <div className="flex items-center gap-1 ml-1 sm:ml-2 pl-1 sm:pl-2 border-l border-slate-100">
              {lastUpdated && (
                <span className="text-xs text-slate-400 hidden sm:block">
                  {lastUpdated.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-2 sm:px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                title="更新資料"
              >
                <span className="sm:hidden">{refreshing ? '…' : '↻'}</span>
                <span className="hidden sm:inline">{refreshing ? '更新中...' : '↻ 更新'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="sm:hidden pb-3">
          <form onSubmit={handleSearch} className="flex items-center gap-1.5">
            <input
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              placeholder="輸入股票代號（如 AAPL）"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shrink-0"
            >
              查詢
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}

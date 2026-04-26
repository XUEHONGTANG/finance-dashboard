'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { formatNumber, formatPercent, formatLargeNumber } from '@/lib/utils';
import { useWatchlist } from '@/lib/useWatchlist';
import type { StockQuote } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function StockWatchlist() {
  const { tickers, add, remove } = useWatchlist();
  const [input, setInput] = useState('');

  const { data, isLoading } = useSWR<{ quotes: StockQuote[] }>(
    tickers.length > 0 ? `/api/stocks/watchlist?tickers=${tickers.join(',')}` : null,
    fetcher,
  );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    add(input);
    setInput('');
  }

  return (
    <Card className="col-span-full">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <CardHeader title="自選股清單" subtitle="Watchlist" />
        <form onSubmit={handleAdd} className="flex gap-2 shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="輸入代號"
            className="w-28 px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            + 新增
          </button>
        </form>
      </div>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-xs text-slate-400 uppercase tracking-wider">
              <th className="text-left pb-3 px-1">股票</th>
              <th className="text-right pb-3 px-1">現價</th>
              <th className="text-right pb-3 px-1">漲跌</th>
              <th className="text-right pb-3 px-1 hidden sm:table-cell">市值</th>
              <th className="text-right pb-3 px-1 hidden md:table-cell">成交量</th>
              <th className="text-right pb-3 px-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading
              ? Array.from({ length: tickers.length || 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="py-2.5 px-1">
                        <Skeleton className="h-5 w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              : (data?.quotes ?? []).map(q => {
                  const isPositive = (q.changePct ?? 0) >= 0;
                  return (
                    <tr key={q.ticker} className="hover:bg-slate-50 transition-colors rounded-xl">
                      <td className="py-3 px-1">
                        <div className="font-semibold text-slate-900">{q.ticker}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[120px]">{q.name}</div>
                      </td>
                      <td className="py-3 px-1 text-right font-mono font-semibold text-slate-900">
                        ${formatNumber(q.price)}
                      </td>
                      <td className={`py-3 px-1 text-right font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                        {formatPercent(q.changePct)}
                      </td>
                      <td className="py-3 px-1 text-right text-slate-500 hidden sm:table-cell">
                        ${formatLargeNumber(q.marketCap)}
                      </td>
                      <td className="py-3 px-1 text-right text-slate-500 hidden md:table-cell">
                        {formatLargeNumber(q.volume)}
                      </td>
                      <td className="py-3 px-1 text-right">
                        <div className="flex gap-2 justify-end">
                          <Link
                            href={`/stocks/${q.ticker}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
                          >
                            詳細
                          </Link>
                          <button
                            onClick={() => remove(q.ticker)}
                            className="text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-xl transition-colors"
                            title="移除"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            {!isLoading && (data?.quotes ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                  自選清單為空，請輸入股票代號新增
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Holding {
  symbol: string;
  name: string;
  portfolioPct: number;
  count: number;
  holdPrice: number | null;
  maxPct: number | null;
  currentPrice: number | null;
  weekLow52: number | null;
  aboveLow52Pct: number | null;
  weekHigh52: number | null;
  url: string;
}

interface ApiResponse {
  holdings: Holding[];
  totalPages: number;
}

type TabType = 'portfolio' | 'buys' | 'sells';

const TABS: { key: TabType; label: string; subtitle: string }[] = [
  { key: 'portfolio', label: '大盤持倉',  subtitle: 'Grand Portfolio' },
  { key: 'buys',      label: '近期買入',  subtitle: 'Quarter Buys' },
  { key: 'sells',     label: '近期賣出',  subtitle: 'Quarter Sells' },
];

const PAGE_SIZE = 10;

function fmt(n: number | null, prefix = '', suffix = ''): string {
  if (n === null) return '—';
  return `${prefix}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
}

function TabPanel({ type }: { type: TabType }) {
  const [dPage, setDPage]     = useState(1); // dataroma page
  const [cPage, setCPage]     = useState(1); // client page (10 per page)
  const [query, setQuery]     = useState('');
  const [search, setSearch]   = useState('');

  const { data, isLoading } = useSWR<ApiResponse>(
    `/api/sec/13f?type=${type}&page=${dPage}&q=${encodeURIComponent(search)}`,
    fetcher,
  );

  const holdings  = data?.holdings ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCPages = Math.max(1, Math.ceil(holdings.length / PAGE_SIZE));
  const slice = holdings.slice((cPage - 1) * PAGE_SIZE, cPage * PAGE_SIZE);

  const isPortfolio = type === 'portfolio';
  const countLabel  = type === 'buys' ? '買入家數' : type === 'sells' ? '賣出家數' : '持有家數';

  function handleSearch() { setCPage(1); setSearch(query); }
  function handleClear()  { setQuery(''); setSearch(''); setCPage(1); }
  function changeDPage(p: number) { setDPage(p); setCPage(1); }

  return (
    <div>
      {/* Search */}
      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="搜尋代號或公司名稱..."
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          搜尋
        </button>
        {search && (
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
          >
            清除
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider">
                <th className="text-left pb-3">代號</th>
                <th className="text-left pb-3">公司</th>
                <th className="text-right pb-3">佔比 %</th>
                <th className="text-right pb-3">{countLabel}</th>
                <th className="text-right pb-3">均持成本</th>
                {isPortfolio && <th className="text-right pb-3">最高佔比</th>}
                <th className="text-right pb-3">現價</th>
                <th className="text-right pb-3">52W 低</th>
                <th className="text-right pb-3">距低點</th>
                <th className="text-right pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {slice.map(h => (
                <tr key={h.symbol} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-semibold text-blue-700">{h.symbol}</td>
                  <td className="py-3 text-slate-700 max-w-[180px] truncate">{h.name}</td>
                  <td className="py-3 text-right text-slate-600">{fmt(h.portfolioPct, '', '%')}</td>
                  <td className="py-3 text-right text-slate-500">{h.count}</td>
                  <td className="py-3 text-right text-slate-500">{fmt(h.holdPrice, '$')}</td>
                  {isPortfolio && (
                    <td className="py-3 text-right text-slate-500">{fmt(h.maxPct, '', '%')}</td>
                  )}
                  <td className="py-3 text-right font-medium text-slate-800">{fmt(h.currentPrice, '$')}</td>
                  <td className="py-3 text-right text-slate-500">{fmt(h.weekLow52, '$')}</td>
                  <td className={`py-3 text-right font-medium ${(h.aboveLow52Pct ?? 0) > 50 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {fmt(h.aboveLow52Pct, '', '%')}
                  </td>
                  <td className="py-3 text-right">
                    <a
                      href={h.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      詳情
                    </a>
                  </td>
                </tr>
              ))}
              {slice.length === 0 && (
                <tr>
                  <td colSpan={isPortfolio ? 10 : 9} className="py-8 text-center text-slate-400 text-sm">
                    無資料
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          {/* Client-side page within current batch */}
          <div className="flex items-center gap-1">
            <button
              disabled={cPage === 1}
              onClick={() => setCPage(p => p - 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              上一頁
            </button>
            <span className="px-3 py-1.5 text-xs text-slate-500">
              第 {cPage} / {totalCPages} 頁
            </span>
            <button
              disabled={cPage === totalCPages}
              onClick={() => setCPage(p => p + 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              下一頁
            </button>
          </div>

          {/* Dataroma page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-slate-400 mr-1">資料頁：</span>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => changeDPage(p)}
                  className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                    p === dPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FilingsTable() {
  const [tab, setTab] = useState<TabType>('portfolio');
  const current = TABS.find(t => t.key === tab)!;

  return (
    <Card>
      <CardHeader title="機構持倉" subtitle={current.subtitle} />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1 w-full sm:w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <TabPanel key={tab} type={tab} />
    </Card>
  );
}

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface InsiderTrade {
  id: string;
  filerName: string;
  issuerName: string;
  ticker?: string;
  fileDate: string;
  formType: string;
  url: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  signalReason: string;
  tradeType?: string;
  sharesPrice?: string;
  value?: string;
}

const GUIDE = [
  { icon: '✅', color: 'green' as const, label: '創辦人/CEO 大量買入', desc: '強烈信心訊號，值得跟進研究' },
  { icon: '⚠️', color: 'red' as const, label: '多位高層同時賣出', desc: '可能是估值過高的警訊' },
  { icon: '⚪', color: 'gray' as const, label: '單一高層小額賣出', desc: '中性，可能只是個人財務需求' },
];

export function InsiderTable() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useSWR<{ trades: InsiderTrade[]; total: number }>(
    `/api/sec/insider?q=${encodeURIComponent(search)}&from=2025-01-01`,
    fetcher,
  );

  return (
    <Card>
      <CardHeader title="內部人交易 (Form 4)" subtitle="Insider Trading — insider-monitor.com" />

      {/* Guide */}
      <div className="grid sm:grid-cols-3 gap-2 mb-4">
        {GUIDE.map(g => (
          <div key={g.label} className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
            <span>{g.icon}</span>
            <div>
              <p className="text-xs font-semibold text-slate-700">{g.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{g.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setSearch(query)}
          placeholder="搜尋公司或內部人名稱..."
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => setSearch(query)}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          搜尋
        </button>
        {search && (
          <button
            onClick={() => { setQuery(''); setSearch(''); }}
            className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
          >
            清除
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <>
          {data?.total != null && (
            <p className="text-xs text-slate-400 mb-3">共 {data.total.toLocaleString()} 筆</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider">
                  <th className="text-left pb-3">代號</th>
                  <th className="text-left pb-3">公司</th>
                  <th className="text-left pb-3">申報人</th>
                  <th className="text-right pb-3">數量 / 價格</th>
                  <th className="text-right pb-3">金額</th>
                  <th className="text-right pb-3">日期</th>
                  <th className="text-right pb-3">訊號</th>
                  <th className="text-right pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data?.trades ?? []).slice(0, 20).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-mono font-semibold text-blue-700 w-16">{t.ticker ?? '—'}</td>
                    <td className="py-3 font-medium text-slate-800 truncate max-w-[120px]">{t.issuerName}</td>
                    <td className="py-3 text-slate-500 truncate max-w-[120px]">{t.filerName}</td>
                    <td className="py-3 text-right text-slate-500 text-xs">{t.sharesPrice ?? '—'}</td>
                    <td className="py-3 text-right text-slate-500 text-xs">{t.value ? `$${t.value}` : '—'}</td>
                    <td className="py-3 text-right text-slate-500 text-xs">{t.fileDate}</td>
                    <td className="py-3 text-right">
                      <Badge variant={t.signal === 'bullish' ? 'green' : t.signal === 'bearish' ? 'red' : 'gray'}>
                        {t.signal === 'bullish' ? '✅ 買入' : t.signal === 'bearish' ? '⚠️ 賣出' : '⚪ 中性'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        查看
                      </a>
                    </td>
                  </tr>
                ))}
                {(data?.trades ?? []).length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                      無資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

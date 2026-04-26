'use client';

import useSWR from 'swr';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { StockChart } from './StockChart';
import { formatNumber, formatPercent, formatCurrency, formatLargeNumber } from '@/lib/utils';
import { useWatchlist } from '@/lib/useWatchlist';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

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
  relationship?: string;
}

function InsiderSection({ ticker }: { ticker: string }) {
  const { data, isLoading } = useSWR<{ trades: InsiderTrade[]; total: number }>(
    `/api/sec/insider?ticker=${encodeURIComponent(ticker)}`,
    fetcher,
  );

  return (
    <Card>
      <CardHeader title="內部人交易 (Form 4)" subtitle="Insider Trading — dataroma.com" />
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : (
        <>
          {data?.total != null && (
            <p className="text-xs text-slate-400 mb-3">近 6 個月共 {data.total.toLocaleString()} 筆申報</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider">
                  <th className="text-left pb-3">姓名</th>
                  <th className="text-left pb-3">職稱</th>
                  <th className="text-left pb-3">類型</th>
                  <th className="text-right pb-3">股數 / 價格</th>
                  <th className="text-right pb-3">金額</th>
                  <th className="text-right pb-3">日期</th>
                  <th className="text-right pb-3">訊號</th>
                  <th className="text-right pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data?.trades ?? []).slice(0, 15).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 text-slate-700 truncate max-w-[130px]">{t.filerName}</td>
                    <td className="py-2.5 text-slate-400 text-xs truncate max-w-[120px]">{t.relationship ?? '—'}</td>
                    <td className="py-2.5 text-slate-500 text-xs">{t.tradeType ?? '—'}</td>
                    <td className="py-2.5 text-right text-slate-500 text-xs">{t.sharesPrice ?? '—'}</td>
                    <td className="py-2.5 text-right text-slate-500 text-xs">{t.value ?? '—'}</td>
                    <td className="py-2.5 text-right text-slate-400 text-xs">{t.fileDate}</td>
                    <td className="py-2.5 text-right">
                      <Badge variant={t.signal === 'bullish' ? 'green' : t.signal === 'bearish' ? 'red' : 'gray'}>
                        {t.signal === 'bullish' ? '✅ 買入' : t.signal === 'bearish' ? '⚠️ 賣出' : '⚪ 中性'}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right">
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
                    <td colSpan={8} className="py-6 text-center text-slate-400 text-sm">
                      近期無內部人申報資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <a
              href={`https://www.dataroma.com/m/ins/ins.php?t=y&sym=${ticker}&o=fd&d=d`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              → 查看完整內部人交易 (dataroma.com)
            </a>
          </div>
        </>
      )}
    </Card>
  );
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface StockFundamentals {
  ticker: string;
  name: string;
  price: number;
  marketCap: number;
  eps: number | null;
  pe: number | null;
  pb: number | null;
  operatingMargin: number | null;
  cashAndEquivalents: number | null;
  totalAssets: number | null;
  cashToMarketCapPct: number | null;
  revenueHistory: { year: string; revenue: number; growth: number | null }[];
  revenueGrowthAvg3Y: number | null;
  sector: string;
  industry: string;
  description: string;
  website: string;
  ipoDate: string;
  updatedAt: string;
}

function MetricItem({
  label, value, pass, failMsg, unit = '', note,
}: {
  label: string; value: string | null; pass?: boolean | null; failMsg?: string; unit?: string; note?: string;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-50 last:border-0 gap-4">
      <div className="min-w-0">
        <p className="text-sm text-slate-600">{label}</p>
        {note && <p className="text-xs text-slate-400 mt-0.5">{note}</p>}
        {pass === false && failMsg && (
          <p className="text-xs text-orange-500 mt-0.5">⚠️ {failMsg}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold text-slate-900 tabular-nums">
          {value ?? '—'}{value && unit ? unit : ''}
        </span>
        {pass === true && <span className="text-green-500 text-xs">✅</span>}
        {pass === false && <span className="text-orange-400 text-xs">⚠️</span>}
      </div>
    </div>
  );
}

export function StockDetailView({ ticker }: { ticker: string }) {
  const { data: d, isLoading } = useSWR<StockFundamentals>(
    `/api/stocks/detail/${ticker}`,
    fetcher,
  );
  const { has, add, remove } = useWatchlist();
  const inWatchlist = has(ticker);

  const secCIKUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${ticker}&type=10-K&dateb=&owner=include&count=10&search_text=`;
  const irUrl = `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&forms=10-K,10-Q`;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!d) return <p className="text-slate-400 text-sm">無法載入資料</p>;

  // Check criteria
  const revenueUptrend =
    d.revenueHistory.length >= 3 &&
    d.revenueHistory.slice(-3).every((r, i, arr) => i === 0 || r.revenue >= arr[i - 1].revenue);
  const revenueGrowthOk = d.revenueGrowthAvg3Y != null && d.revenueGrowthAvg3Y >= 10;
  const cashOk = d.cashToMarketCapPct != null && d.cashToMarketCapPct >= 10;

  const revenueChartData = d.revenueHistory.map(r => ({
    year: r.year,
    revenue: r.revenue / 1e9,
    growth: r.growth,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{d.ticker}</h1>
          <p className="text-slate-500">{d.name}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant="blue">{d.sector}</Badge>
            <Badge variant="gray">{d.industry}</Badge>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">${formatNumber(d.price)}</p>
          <p className="text-sm text-slate-500">市值 {formatCurrency(d.marketCap)}</p>
          <button
            onClick={() => inWatchlist ? remove(ticker) : add(ticker)}
            className={`text-sm font-medium px-4 py-1.5 rounded-xl transition-colors ${
              inWatchlist
                ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {inWatchlist ? '✅ 已加入自選' : '+ 加入自選'}
          </button>
        </div>
      </div>

      {/* Chart */}
      <StockChart ticker={ticker} />

      {/* IR Reports */}
      <Card>
        <CardHeader title="IR 報告 / 財務申報" subtitle="Investor Relations & SEC Filings" />
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={secCIKUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded-xl transition-colors"
          >
            📄 SEC 10-K / 10-Q 年報季報
          </a>
          <a
            href={irUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-3 rounded-xl transition-colors"
          >
            🔍 EDGAR 全文搜尋
          </a>
          {d.website && (
            <a
              href={d.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-3 rounded-xl transition-colors"
            >
              🌐 公司官網
            </a>
          )}
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="基本估值指標" subtitle="Valuation" />
          <MetricItem label="EPS（每股盈餘）" value={d.eps != null ? `$${formatNumber(d.eps)}` : null} />
          <MetricItem label="P/E（本益比）" value={d.pe != null ? formatNumber(d.pe) : null}
            note="合理區間通常 15–25x" />
          <MetricItem label="P/B（股價淨值比）" value={d.pb != null ? formatNumber(d.pb) : null} />
          <MetricItem
            label="營業利益率"
            value={d.operatingMargin != null ? formatPercent(d.operatingMargin) : null}
            pass={d.operatingMargin != null ? d.operatingMargin > 15 : null}
            failMsg="低於15%，需關注成本控制"
          />
        </Card>

        <Card>
          <CardHeader title="財務健康指標" subtitle="Financial Health" />
          <MetricItem
            label="現金持有量"
            value={d.cashAndEquivalents != null ? formatCurrency(d.cashAndEquivalents) : null}
          />
          <MetricItem
            label="現金占市值比"
            value={d.cashToMarketCapPct != null ? `${formatNumber(d.cashToMarketCapPct)}%` : null}
            pass={cashOk}
            failMsg="現金占市值低於10%"
            note="篩選標準：≥ 10%"
          />
          <MetricItem label="總資產" value={d.totalAssets != null ? formatCurrency(d.totalAssets) : null} />
          <MetricItem
            label="3年平均營收成長率"
            value={d.revenueGrowthAvg3Y != null ? `${formatNumber(d.revenueGrowthAvg3Y)}%` : null}
            pass={revenueGrowthOk}
            failMsg="低於10%，成長力道不足"
            note="篩選標準：≥ 10%（雙位數成長）"
          />
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader title="營收趨勢" subtitle="Revenue History" />
        <div className="flex items-center gap-3 mb-3">
          <Badge variant={revenueUptrend ? 'green' : 'orange'}>
            {revenueUptrend ? '✅ 持續向上' : '⚠️ 趨勢不穩定'}
          </Badge>
          {revenueGrowthOk && <Badge variant="green">✅ 雙位數成長</Badge>}
        </div>
        {revenueChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v.toFixed(0)}B`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v, name) =>
                  name === 'revenue' ? [`${Number(v).toFixed(2)}B`, '營收'] : [`${Number(v).toFixed(1)}%`, '成長率']
                }
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {revenueChartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      index > 0 && entry.revenue >= revenueChartData[index - 1].revenue
                        ? '#22c55e'
                        : '#94a3b8'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400">需要 FMP API Key 才能顯示營收歷史</p>
        )}
      </Card>

      {/* Market Share note */}
      <Card>
        <CardHeader title="市場占有率" subtitle="Market Share" />
        <div className="bg-yellow-50 rounded-xl p-4 text-sm text-yellow-800">
          <p className="font-medium mb-1">📊 市場占有率無免費即時 API</p>
          <p className="text-xs text-yellow-700 mb-3">
            市占率需參考研究報告或公司 10-K 披露，以下為外部資料來源：
          </p>
          <div className="flex flex-col gap-2">
            <a
              href={`https://www.macrotrends.net/stocks/charts/${ticker}/market-share`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              → Macrotrends {ticker} Market Share
            </a>
            <a
              href={`https://finance.yahoo.com/quote/${ticker}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              → Yahoo Finance {ticker} 同業比較
            </a>
          </div>
        </div>
      </Card>

      {/* Insider Trading */}
      <InsiderSection ticker={ticker} />

      {/* Company description */}
      {d.description && d.description !== '—' && (
        <Card>
          <CardHeader title="公司簡介" subtitle="About" />
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{d.description}</p>
        </Card>
      )}
    </div>
  );
}

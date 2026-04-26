'use client';

import useSWR from 'swr';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { formatNumber, timeAgo } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface SignalData {
  fedCuttingRates: boolean | null;
  sp500DrawdownPct: number | null;
  nasdaqDrawdownPct: number | null;
  fearGreedScore: number | null;
  marketUp30FromLow: boolean | null;
  updatedAt: string;
}

interface Signal {
  id: string;
  label: string;
  description: string;
  triggered: boolean | null;
  type: 'buy' | 'sell';
  action: string;
  detail?: string;
}

export function BuySellSignals() {
  const { data, isLoading } = useSWR<SignalData>('/api/signals', fetcher);

  const sp500Down20 =
    data?.sp500DrawdownPct != null && data.sp500DrawdownPct <= -20;
  const nasdaqDown20 =
    data?.nasdaqDrawdownPct != null && data.nasdaqDrawdownPct <= -20;

  const buySignals: Signal[] = [
    {
      id: 'fed-cut',
      label: '🏦 Fed 連續降息',
      description: '聯準會開始連續降息',
      triggered: data?.fedCuttingRates ?? null,
      type: 'buy',
      action: '可考慮分批建倉',
    },
    {
      id: 'index-down20',
      label: '📉 指數下跌 ≥20% 盤整',
      description: 'S&P500 或那斯達克從高點跌幅 ≥20%',
      triggered: sp500Down20 || nasdaqDown20,
      type: 'buy',
      action: '賣壓趨緩底部形成，考慮布局',
      detail: data?.sp500DrawdownPct != null
        ? `S&P500: ${formatNumber(data.sp500DrawdownPct)}% / NASDAQ: ${formatNumber(data.nasdaqDrawdownPct)}%`
        : undefined,
    },
    {
      id: 'fear-greed-20',
      label: '😱 CNN 恐懼指數 <20',
      description: '市場極度恐懼，歷史上為買入良機',
      triggered: data?.fearGreedScore != null ? data.fearGreedScore < 20 : null,
      type: 'buy',
      action: '極度恐懼時分批買入',
      detail: data?.fearGreedScore != null ? `目前指數：${data.fearGreedScore}` : undefined,
    },
  ];

  const sellSignals: Signal[] = [
    {
      id: 'market-up30',
      label: '🚀 市場從低點上漲 ≥30%',
      description: '相較前一低點漲幅超過30%',
      triggered: data?.marketUp30FromLow ?? null,
      type: 'sell',
      action: '先賣出一半，鎖定部分獲利',
    },
    {
      id: 'media-hype',
      label: '📺 媒體瘋狂宣傳',
      description: '媒體和 YouTube 每天把某公司當最有潛力標的',
      triggered: null,
      type: 'sell',
      action: '全數賣出 — 買方力道接近耗盡',
    },
    {
      id: 'everyone-talks',
      label: '💬 身邊人開始談股票',
      description: '身邊的人頻繁談論股票並向你詢問建議',
      triggered: null,
      type: 'sell',
      action: '開始轉為現金',
    },
  ];

  function SignalRow({ signal }: { signal: Signal }) {
    const isBuy = signal.type === 'buy';
    const isTriggered = signal.triggered;
    const isUnknown = signal.triggered == null;

    let bg = 'bg-slate-50 border-slate-200';
    let dot = 'bg-slate-300';
    if (!isUnknown) {
      if (isBuy && isTriggered) { bg = 'bg-green-50 border-green-200'; dot = 'bg-green-500'; }
      else if (!isBuy && isTriggered) { bg = 'bg-red-50 border-red-200'; dot = 'bg-red-500'; }
      else if (!isTriggered) { bg = 'bg-slate-50 border-slate-200'; dot = 'bg-slate-300'; }
    }

    return (
      <div className={`flex items-start gap-3 p-3 rounded-xl border ${bg}`}>
        <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">{signal.label}</span>
            {!isUnknown && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isTriggered
                  ? isBuy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {isTriggered ? '⚡ 已觸發' : '未觸發'}
              </span>
            )}
            {isUnknown && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">需人工判斷</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{signal.description}</p>
          {signal.detail && <p className="text-xs text-slate-600 mt-1 font-mono">{signal.detail}</p>}
          {isTriggered && (
            <p className={`text-xs font-medium mt-1.5 ${isBuy ? 'text-green-700' : 'text-red-700'}`}>
              → {signal.action}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader title="買賣訊號面板" subtitle="Buy / Sell Signals" />
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">📗 買入訊號</h4>
            {buySignals.map(s => <SignalRow key={s.id} signal={s} />)}
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">📕 賣出訊號</h4>
            {sellSignals.map(s => <SignalRow key={s.id} signal={s} />)}
          </div>
        </div>
      )}
      {data?.updatedAt && (
        <p className="mt-3 text-xs text-slate-400">{timeAgo(data.updatedAt)}</p>
      )}
    </Card>
  );
}

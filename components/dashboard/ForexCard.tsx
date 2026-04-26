'use client';

import useSWR from 'swr';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { formatNumber, timeAgo } from '@/lib/utils';
import type { ForexData } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function ForexCard() {
  const { data, isLoading } = useSWR<ForexData>('/api/forex', fetcher);

  const rows = [
    { label: 'USD / TWD', value: data?.USDTWD, decimals: 3 },
    { label: 'USD / JPY', value: data?.USDJPY, decimals: 2 },
  ];

  return (
    <Card>
      <CardHeader title="美元匯率" subtitle="USD Exchange Rates" />
      {isLoading ? (
        <div className="space-y-3">
          {rows.map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-600">{row.label}</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {formatNumber(row.value, row.decimals)}
              </span>
            </div>
          ))}
        </div>
      )}
      {data?.updatedAt && (
        <p className="mt-3 text-xs text-slate-400">{timeAgo(data.updatedAt)}</p>
      )}
    </Card>
  );
}

'use client';

import useSWR from 'swr';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { formatNumber, timeAgo } from '@/lib/utils';
import type { BondData } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function BondSpreadCard() {
  const { data, isLoading } = useSWR<BondData>('/api/bonds', fetcher);

  const spreadColor =
    data?.spread == null ? 'text-slate-400'
    : data.spread < 0 ? 'text-red-500'
    : 'text-green-600';

  const inverted = data?.spread != null && data.spread < 0;

  return (
    <Card>
      <CardHeader title="美國公債利差" subtitle="US Treasury Yield Spread" />
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : (
        <>
          <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${spreadColor}`}>
            {data?.spread != null ? `${data.spread >= 0 ? '+' : ''}${formatNumber(data.spread)}%` : '—'}
          </div>
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>2年期</span>
              <span className="font-medium">{formatNumber(data?.twoYear)}%</span>
            </div>
            <div className="flex justify-between">
              <span>10年期</span>
              <span className="font-medium">{formatNumber(data?.tenYear)}%</span>
            </div>
          </div>
          {inverted && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
              <span>⚠️</span>
              <span>殖利率曲線倒掛 — 經濟衰退預警訊號</span>
            </div>
          )}
          {data?.updatedAt && (
            <p className="mt-3 text-xs text-slate-400">{timeAgo(data.updatedAt)}</p>
          )}
        </>
      )}
    </Card>
  );
}

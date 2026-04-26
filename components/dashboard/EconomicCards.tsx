'use client';

import useSWR from 'swr';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { formatNumber, timeAgo } from '@/lib/utils';
import type { EconomicData } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface EcoIndicator {
  label: string;
  subtitle: string;
  value: number | null;
  unit: string;
  decimals?: number;
  thresholdGood?: number;
  thresholdBad?: number;
  inverse?: boolean;
}

function IndicatorValue({ item }: { item: EcoIndicator }) {
  const { value, unit, decimals = 1 } = item;
  let color = 'text-slate-900';
  if (value != null && item.thresholdGood != null && item.thresholdBad != null) {
    if (!item.inverse) {
      color = value <= item.thresholdGood ? 'text-green-600' : value >= item.thresholdBad ? 'text-red-500' : 'text-yellow-500';
    } else {
      color = value >= item.thresholdGood ? 'text-green-600' : value <= item.thresholdBad ? 'text-red-500' : 'text-yellow-500';
    }
  }
  return (
    <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${color}`}>
      {value != null ? `${formatNumber(value, decimals)}${unit}` : '—'}
    </span>
  );
}

export function EconomicCards() {
  const { data, isLoading } = useSWR<EconomicData>('/api/economic', fetcher);

  const indicators: EcoIndicator[] = [
    {
      label: '美國失業率',
      subtitle: 'Unemployment Rate',
      value: data?.unemploymentRate ?? null,
      unit: '%',
      thresholdGood: 4.5,
      thresholdBad: 6,
      inverse: false,
    },
    {
      label: 'ISM 製造業指數',
      subtitle: 'ISM Manufacturing PMI',
      value: data?.ismManufacturing ?? null,
      unit: '',
      thresholdGood: 50,
      thresholdBad: 45,
      inverse: true,
    },
    {
      label: '消費者信心指數',
      subtitle: 'Consumer Sentiment (UoM)',
      value: data?.consumerConfidence ?? null,
      unit: '',
      thresholdGood: 70,
      thresholdBad: 55,
      inverse: true,
    },
    {
      label: '聯邦基準利率',
      subtitle: 'Fed Funds Rate',
      value: data?.fedFundsRate ?? null,
      unit: '%',
    },
  ];

  return (
    <>
      {indicators.map(item => (
        <Card key={item.label}>
          <CardHeader title={item.label} subtitle={item.subtitle} />
          {isLoading ? (
            <Skeleton className="h-10 w-28" />
          ) : (
            <>
              <IndicatorValue item={item} />
              {item.label === 'ISM 製造業指數' && data?.ismManufacturing != null && (
                <p className="mt-1 text-xs text-slate-500">
                  {data.ismManufacturing >= 50 ? '✅ 擴張期（≥50）' : '⚠️ 收縮期（<50）'}
                </p>
              )}
            </>
          )}
          {data?.updatedAt && (
            <p className="mt-3 text-xs text-slate-400">{timeAgo(data.updatedAt)}</p>
          )}
        </Card>
      ))}
    </>
  );
}

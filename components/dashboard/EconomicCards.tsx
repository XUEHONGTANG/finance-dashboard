'use client';

import useSWR from 'swr';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { formatNumber, timeAgo } from '@/lib/utils';
import type { EconomicData } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Threshold {
  atLeast: number;
  valueColor: string;   // number color
  badgeColor: string;   // badge bg + text color
  label: string;
}

interface EcoIndicator {
  label: string;
  subtitle: string;
  value: number | null;
  unit: string;
  decimals?: number;
  showSign?: boolean;
  thresholds?: Threshold[];
}

function getLevel(value: number, thresholds: Threshold[]): Threshold {
  let result = thresholds[0];
  for (const t of thresholds) {
    if (value >= t.atLeast) result = t;
  }
  return result;
}

function IndicatorCard({ item, isLoading, updatedAt }: {
  item: EcoIndicator;
  isLoading: boolean;
  updatedAt?: string;
}) {
  const { value, unit, decimals = 1, showSign = false, thresholds } = item;
  const level = value != null && thresholds ? getLevel(value, thresholds) : null;
  const sign = showSign && value != null && value > 0 ? '+' : '';

  return (
    <Card>
      <CardHeader title={item.label} subtitle={item.subtitle} />
      {isLoading ? (
        <Skeleton className="h-10 w-28 mt-1" />
      ) : (
        <div className="mt-1">
          <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${level?.valueColor ?? 'text-slate-900'}`}>
            {value != null ? `${sign}${formatNumber(value, decimals)}${unit}` : '—'}
          </span>
          {level && (
            <div className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${level.badgeColor}`}>
              {level.label}
            </div>
          )}
        </div>
      )}
      {updatedAt && (
        <p className="mt-3 text-xs text-slate-400">{timeAgo(updatedAt)}</p>
      )}
    </Card>
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
      thresholds: [
        { atLeast: -Infinity, valueColor: 'text-green-600',  badgeColor: 'bg-green-100 text-green-800',  label: '✅ 充分就業' },
        { atLeast: 4.5,       valueColor: 'text-lime-600',   badgeColor: 'bg-lime-100 text-lime-800',    label: '🟡 略微上升' },
        { atLeast: 5.5,       valueColor: 'text-yellow-600', badgeColor: 'bg-yellow-100 text-yellow-800',label: '⚠️ 偏高' },
        { atLeast: 6.5,       valueColor: 'text-orange-600', badgeColor: 'bg-orange-100 text-orange-800',label: '🟠 明顯走高' },
        { atLeast: 8,         valueColor: 'text-red-600',    badgeColor: 'bg-red-100 text-red-800',      label: '🔴 嚴重惡化' },
      ],
    },
    {
      label: 'ISM 製造業指數',
      subtitle: 'ISM Manufacturing PMI',
      value: data?.ismManufacturing ?? null,
      unit: '',
      thresholds: [
        { atLeast: -Infinity, valueColor: 'text-red-600',    badgeColor: 'bg-red-100 text-red-800',      label: '🔴 嚴重收縮' },
        { atLeast: 44,        valueColor: 'text-orange-600', badgeColor: 'bg-orange-100 text-orange-800',label: '🟠 明顯收縮' },
        { atLeast: 47,        valueColor: 'text-yellow-600', badgeColor: 'bg-yellow-100 text-yellow-800',label: '⚠️ 溫和收縮' },
        { atLeast: 50,        valueColor: 'text-lime-600',   badgeColor: 'bg-lime-100 text-lime-800',    label: '🟡 溫和擴張' },
        { atLeast: 55,        valueColor: 'text-green-600',  badgeColor: 'bg-green-100 text-green-800',  label: '✅ 強勁擴張' },
      ],
    },
    {
      label: '消費者信心指數',
      subtitle: 'Consumer Sentiment (UoM)',
      value: data?.consumerConfidence ?? null,
      unit: '',
      thresholds: [
        { atLeast: -Infinity, valueColor: 'text-red-600',    badgeColor: 'bg-red-100 text-red-800',      label: '🔴 極度悲觀' },
        { atLeast: 50,        valueColor: 'text-orange-600', badgeColor: 'bg-orange-100 text-orange-800',label: '🟠 悲觀' },
        { atLeast: 60,        valueColor: 'text-yellow-600', badgeColor: 'bg-yellow-100 text-yellow-800',label: '⚠️ 中性偏弱' },
        { atLeast: 70,        valueColor: 'text-lime-600',   badgeColor: 'bg-lime-100 text-lime-800',    label: '🟡 尚可' },
        { atLeast: 80,        valueColor: 'text-green-600',  badgeColor: 'bg-green-100 text-green-800',  label: '✅ 消費信心佳' },
      ],
    },
    {
      label: '聯邦基準利率',
      subtitle: 'Fed Funds Rate',
      value: data?.fedFundsRate ?? null,
      unit: '%',
      thresholds: [
        { atLeast: -Infinity, valueColor: 'text-green-600',  badgeColor: 'bg-green-100 text-green-800',  label: '✅ 寬鬆環境' },
        { atLeast: 2.5,       valueColor: 'text-lime-600',   badgeColor: 'bg-lime-100 text-lime-800',    label: '🟡 中性利率' },
        { atLeast: 4,         valueColor: 'text-yellow-600', badgeColor: 'bg-yellow-100 text-yellow-800',label: '⚠️ 偏緊' },
        { atLeast: 5,         valueColor: 'text-orange-600', badgeColor: 'bg-orange-100 text-orange-800',label: '🟠 緊縮壓力大' },
        { atLeast: 6,         valueColor: 'text-red-600',    badgeColor: 'bg-red-100 text-red-800',      label: '🔴 高度緊縮' },
      ],
    },
    {
      label: 'CPI 年增率',
      subtitle: 'Consumer Price Index YoY',
      value: data?.cpiYoY ?? null,
      unit: '%',
      thresholds: [
        { atLeast: -Infinity, valueColor: 'text-slate-500',  badgeColor: 'bg-slate-100 text-slate-700',  label: '⬇️ 通縮風險' },
        { atLeast: 1,         valueColor: 'text-green-600',  badgeColor: 'bg-green-100 text-green-800',  label: '✅ 物價穩定' },
        { atLeast: 3,         valueColor: 'text-lime-600',   badgeColor: 'bg-lime-100 text-lime-800',    label: '🟡 略高於目標' },
        { atLeast: 4,         valueColor: 'text-orange-600', badgeColor: 'bg-orange-100 text-orange-800',label: '🟠 物價過熱' },
        { atLeast: 5,         valueColor: 'text-red-600',    badgeColor: 'bg-red-100 text-red-800',      label: '🔴 嚴重過熱' },
      ],
    },
    {
      label: 'PPI 年增率',
      subtitle: 'Producer Price Index YoY',
      value: data?.ppiYoY ?? null,
      unit: '%',
      thresholds: [
        { atLeast: -Infinity, valueColor: 'text-slate-500',  badgeColor: 'bg-slate-100 text-slate-700',  label: '⬇️ 通縮風險' },
        { atLeast: 1,         valueColor: 'text-green-600',  badgeColor: 'bg-green-100 text-green-800',  label: '✅ 生產成本穩定' },
        { atLeast: 3,         valueColor: 'text-lime-600',   badgeColor: 'bg-lime-100 text-lime-800',    label: '🟡 略高於目標' },
        { atLeast: 4,         valueColor: 'text-orange-600', badgeColor: 'bg-orange-100 text-orange-800',label: '🟠 成本壓力過高' },
        { atLeast: 5,         valueColor: 'text-red-600',    badgeColor: 'bg-red-100 text-red-800',      label: '🔴 成本嚴重攀升' },
      ],
    },
    {
      label: '非農就業變化',
      subtitle: 'Nonfarm Payrolls MoM (K)',
      value: data?.nonfarmPayrollChange ?? null,
      unit: 'K',
      decimals: 0,
      showSign: true,
      thresholds: [
        { atLeast: -Infinity, valueColor: 'text-red-600',    badgeColor: 'bg-red-100 text-red-800',      label: '↓ 就業下滑' },
        { atLeast: 0,         valueColor: 'text-orange-600', badgeColor: 'bg-orange-100 text-orange-800',label: '↑ 就業偏弱' },
        { atLeast: 100,       valueColor: 'text-yellow-600', badgeColor: 'bg-yellow-100 text-yellow-800',label: '↑ 溫和增長' },
        { atLeast: 200,       valueColor: 'text-lime-600',   badgeColor: 'bg-lime-100 text-lime-800',    label: '↑ 穩健增長' },
        { atLeast: 300,       valueColor: 'text-green-600',  badgeColor: 'bg-green-100 text-green-800',  label: '↑ 強勁增長' },
      ],
    },
  ];

  return (
    <>
      {indicators.map(item => (
        <IndicatorCard
          key={item.label}
          item={item}
          isLoading={isLoading}
          updatedAt={data?.updatedAt}
        />
      ))}
    </>
  );
}

'use client';

import useSWR from 'swr';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { getFearGreedColor, getFearGreedLabel, timeAgo } from '@/lib/utils';
import type { FearGreedData } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function GaugeArc({ score }: { score: number }) {
  // Semicircle gauge, 0-100
  const radius = 70;
  const cx = 90;
  const cy = 90;
  const startAngle = 180;
  const endAngle = 0;
  const angle = startAngle - (score / 100) * 180;
  const rad = (a: number) => (a * Math.PI) / 180;
  const needleX = cx + radius * Math.cos(rad(angle));
  const needleY = cy - radius * Math.sin(rad(angle));

  const trackPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;
  const fillAngle = startAngle - (score / 100) * 180;
  const fillX = cx + radius * Math.cos(rad(fillAngle));
  const fillY = cy - radius * Math.sin(rad(fillAngle));
  const fillPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${fillX} ${fillY}`;

  const color = score <= 25 ? '#ef4444' : score <= 45 ? '#f97316' : score <= 55 ? '#eab308' : score <= 75 ? '#84cc16' : '#22c55e';

  return (
    <svg viewBox="0 0 180 100" className="w-full max-w-[220px] mx-auto">
      <path d={trackPath} fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
      <path d={fillPath} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#1e293b" />
      <text x="10" y="98" fontSize="9" fill="#94a3b8">0</text>
      <text x="83" y="20" fontSize="9" fill="#94a3b8" textAnchor="middle">50</text>
      <text x="165" y="98" fontSize="9" fill="#94a3b8" textAnchor="end">100</text>
    </svg>
  );
}

export function FearGreedGauge() {
  const { data, isLoading } = useSWR<FearGreedData>('/api/fear-greed', fetcher);

  const score = data?.score ?? null;

  return (
    <Card>
      <CardHeader title="CNN 恐懼貪婪指數" subtitle="Fear & Greed Index" />
      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-6 w-32" />
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {score != null ? (
            <>
              <GaugeArc score={score} />
              <div className={`text-3xl sm:text-4xl font-bold tabular-nums mt-1 ${getFearGreedColor(score)}`}>
                {score}
              </div>
              <div className={`text-sm font-medium mt-1 ${getFearGreedColor(score)}`}>
                {getFearGreedLabel(score)}
              </div>
              {score <= 20 && (
                <div className="mt-3 text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2 text-center">
                  🟢 買入訊號觸發：F&amp;G ≤ 20
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-400 text-sm">資料暫時無法取得</p>
          )}
        </div>
      )}
      {data?.updatedAt && (
        <p className="mt-3 text-xs text-slate-400 text-center">{timeAgo(data.updatedAt)}</p>
      )}
    </Card>
  );
}

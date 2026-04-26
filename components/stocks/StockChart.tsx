'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const RANGES = [
  { label: '1D', range: '1d', interval: '5m' },
  { label: '1W', range: '5d', interval: '1h' },
  { label: '1M', range: '1mo', interval: '1d' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1wk' },
];

interface ChartPoint { time: string; close: number }

function formatXAxis(time: string, range: string) {
  const d = new Date(time);
  if (range === '1d') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (range === '5d') return d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
  if (range === '1mo') return d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
  return d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
}

export function StockChart({ ticker }: { ticker: string }) {
  const [selected, setSelected] = useState(RANGES[2]);

  const { data, isLoading } = useSWR(
    `/api/stocks/chart/${ticker}?range=${selected.range}&interval=${selected.interval}`,
    fetcher,
  );

  const points: ChartPoint[] = data?.points ?? [];
  const first = points[0]?.close ?? null;
  const last = points[points.length - 1]?.close ?? null;
  const isPositive = first && last ? last >= first : true;
  const strokeColor = isPositive ? '#22c55e' : '#ef4444';
  const fillColor = isPositive ? '#dcfce7' : '#fee2e2';

  const minVal = points.length ? Math.min(...points.map(p => p.close)) * 0.998 : 0;
  const maxVal = points.length ? Math.max(...points.map(p => p.close)) * 1.002 : 100;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">{ticker} 股價走勢</h3>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r.range}
              onClick={() => setSelected(r)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                selected.range === r.range
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : points.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
          暫無資料
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={points} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              tickFormatter={(v) => formatXAxis(v, selected.range)}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minVal, maxVal]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              width={50}
            />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
              formatter={(v) => [`$${Number(v).toFixed(2)}`, '價格']}
              labelFormatter={(v) => new Date(v).toLocaleString('zh-TW')}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#grad-${ticker})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

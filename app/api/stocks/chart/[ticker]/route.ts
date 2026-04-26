import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '1mo';
  const interval = searchParams.get('interval') || '1d';

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error('Yahoo Finance error');
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No data');

    const timestamps: number[] = result.timestamp ?? [];
    const quotes = result.indicators?.quote?.[0] ?? {};
    const closes: (number | null)[] = quotes.close ?? [];

    const points = timestamps.map((ts, i) => ({
      time: new Date(ts * 1000).toISOString(),
      close: closes[i] ?? null,
    })).filter(p => p.close != null);

    return NextResponse.json({ ticker, range, interval, points, updatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ticker, range, interval, points: [], updatedAt: new Date().toISOString() });
  }
}

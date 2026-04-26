import { NextResponse } from 'next/server';

async function fetchYahooQuote(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const [twd, jpy] = await Promise.all([
    fetchYahooQuote('USDTWD=X'),
    fetchYahooQuote('USDJPY=X'),
  ]);

  return NextResponse.json({
    USDTWD: twd,
    USDJPY: jpy,
    updatedAt: new Date().toISOString(),
  });
}

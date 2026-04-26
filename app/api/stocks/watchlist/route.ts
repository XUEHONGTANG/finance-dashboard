import { NextResponse } from 'next/server';

const FMP_KEY = process.env.FMP_API_KEY || 'demo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers') || 'AAPL,NVDA,TSLA,MSFT,AMZN';

  try {
    const url = `https://financialmodelingprep.com/stable/batch-quote?symbols=${tickers}&apikey=${FMP_KEY}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('FMP error');
    const data = await res.json();

    const quotes = (Array.isArray(data) ? data : []).map((q: Record<string, unknown>) => ({
      ticker: q.symbol,
      name: q.name ?? q.symbol,
      price: q.price ?? null,
      change: q.change ?? null,
      changePct: q.changePercentage ?? null,
      open: q.open ?? null,
      high: q.dayHigh ?? null,
      low: q.dayLow ?? null,
      volume: q.volume ?? null,
      marketCap: q.marketCap ?? null,
    }));

    return NextResponse.json({ quotes, updatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ quotes: [], updatedAt: new Date().toISOString() });
  }
}

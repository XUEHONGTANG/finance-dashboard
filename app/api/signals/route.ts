import { NextResponse } from 'next/server';

const FRED_KEY = process.env.FRED_API_KEY || 'demo';

async function fetchFredSeries(seriesId: string, limit = 6): Promise<number[]> {
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&limit=${limit}&sort_order=desc`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.observations
      ?.filter((o: { value: string }) => o.value !== '.')
      .map((o: { value: string }) => parseFloat(o.value)) ?? [];
  } catch {
    return [];
  }
}

async function fetchYahooMeta(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    return meta ?? null;
  } catch {
    return null;
  }
}

async function fetchFearGreed(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://www.cnn.com',
          'Referer': 'https://www.cnn.com/markets/fear-and-greed',
        },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.fear_and_greed?.score ? Math.round(data.fear_and_greed.score) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const [fedRates, sp500Meta, nasdaqMeta, fearGreedScore] = await Promise.all([
    fetchFredSeries('FEDFUNDS', 6),
    fetchYahooMeta('^GSPC'),
    fetchYahooMeta('^IXIC'),
    fetchFearGreed(),
  ]);

  // Fed cutting? Check if last 2 readings are decreasing
  let fedCuttingRates: boolean | null = null;
  if (fedRates.length >= 2) {
    fedCuttingRates = fedRates[0] < fedRates[1] && fedRates[1] < (fedRates[2] ?? Infinity);
  }

  // S&P 500 drawdown from 52-week high
  let sp500DrawdownPct: number | null = null;
  if (sp500Meta) {
    const high52 = sp500Meta.fiftyTwoWeekHigh;
    const current = sp500Meta.regularMarketPrice;
    if (high52 && current) sp500DrawdownPct = ((current - high52) / high52) * 100;
  }

  let nasdaqDrawdownPct: number | null = null;
  if (nasdaqMeta) {
    const high52 = nasdaqMeta.fiftyTwoWeekHigh;
    const current = nasdaqMeta.regularMarketPrice;
    if (high52 && current) nasdaqDrawdownPct = ((current - high52) / high52) * 100;
  }

  // Market up 30% from 52-week low
  let marketUp30FromLow: boolean | null = null;
  if (sp500Meta) {
    const low52 = sp500Meta.fiftyTwoWeekLow;
    const current = sp500Meta.regularMarketPrice;
    if (low52 && current) marketUp30FromLow = ((current - low52) / low52) * 100 >= 30;
  }

  return NextResponse.json({
    fedCuttingRates,
    sp500DrawdownPct,
    nasdaqDrawdownPct,
    fearGreedScore,
    marketUp30FromLow,
    updatedAt: new Date().toISOString(),
  });
}

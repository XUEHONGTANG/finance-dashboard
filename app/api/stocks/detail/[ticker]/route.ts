import { NextResponse } from 'next/server';

const FMP_KEY = process.env.FMP_API_KEY || 'demo';

async function fetchFMP(path: string) {
  try {
    const url = `https://financialmodelingprep.com/stable/${path}&apikey=${FMP_KEY}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchYahooQuote(ticker: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.quoteResponse?.result?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();

  const [profile, income, balance, ratios, yahooQuote] = await Promise.all([
    fetchFMP(`profile?symbol=${symbol}`),
    fetchFMP(`income-statement?symbol=${symbol}&limit=5`),
    fetchFMP(`balance-sheet-statement?symbol=${symbol}&limit=1`),
    fetchFMP(`ratios?symbol=${symbol}&limit=1`),
    fetchYahooQuote(symbol),
  ]);

  const latestRatios = Array.isArray(ratios) ? ratios[0] : null;

  const p = Array.isArray(profile) ? profile[0] : null;
  const latestBalance = Array.isArray(balance) ? balance[0] : null;
  const latestIncome = Array.isArray(income) ? income[0] : null;

  // Revenue history & growth
  const revenueHistory: { year: string; revenue: number; growth: number | null }[] = [];
  if (Array.isArray(income)) {
    const sorted = [...income].reverse();
    sorted.forEach((item, i) => {
      const rev = item.revenue ?? 0;
      const prevRev = i > 0 ? sorted[i - 1].revenue : null;
      const growth = prevRev ? ((rev - prevRev) / Math.abs(prevRev)) * 100 : null;
      revenueHistory.push({
        year: item.fiscalYear ?? item.date?.slice(0, 4) ?? '—',
        revenue: rev,
        growth,
      });
    });
  }

  // 3-year average revenue growth
  const growthValues = revenueHistory.slice(-3).map(r => r.growth).filter(g => g != null) as number[];
  const revenueGrowthAvg3Y = growthValues.length > 0
    ? growthValues.reduce((a, b) => a + b, 0) / growthValues.length
    : null;

  // Cash to market cap %
  const cashAndEquivalents = latestBalance?.cashAndCashEquivalents ?? null;
  const marketCap = p?.marketCap ?? yahooQuote?.marketCap ?? null;
  const cashToMarketCapPct = cashAndEquivalents && marketCap
    ? (cashAndEquivalents / marketCap) * 100
    : null;

  // Operating margin
  const operatingMargin = latestRatios?.operatingProfitMargin != null
    ? latestRatios.operatingProfitMargin * 100
    : latestIncome?.operatingIncome != null && latestIncome?.revenue
    ? (latestIncome.operatingIncome / latestIncome.revenue) * 100
    : null;

  const price = p?.price ?? yahooQuote?.regularMarketPrice ?? null;
  const eps = latestIncome?.eps ?? latestRatios?.netIncomePerShare ?? yahooQuote?.epsTrailingTwelveMonths ?? null;
  const pe = latestRatios?.priceToEarningsRatio ?? yahooQuote?.trailingPE ?? (price && eps ? price / eps : null);
  const pb = latestRatios?.priceToBookRatio ?? null;

  return NextResponse.json({
    ticker: symbol,
    name: p?.companyName ?? yahooQuote?.shortName ?? symbol,
    price,
    marketCap,
    eps,
    pe,
    pb,
    operatingMargin,
    cashAndEquivalents,
    totalAssets: latestBalance?.totalAssets ?? null,
    cashToMarketCapPct,
    revenueHistory,
    revenueGrowthAvg3Y,
    sector: p?.sector ?? yahooQuote?.sector ?? '—',
    industry: p?.industry ?? yahooQuote?.industry ?? '—',
    description: p?.description ?? '—',
    website: p?.website ?? '',
    ipoDate: p?.ipoDate ?? '—',
    updatedAt: new Date().toISOString(),
  });
}

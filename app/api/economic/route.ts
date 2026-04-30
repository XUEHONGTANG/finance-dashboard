import { NextResponse } from 'next/server';

const FRED_KEY = process.env.FRED_API_KEY || 'demo';
const FMP_KEY = process.env.FMP_API_KEY || 'demo';

async function fetchFred(seriesId: string, units?: string): Promise<number | null> {
  try {
    const unitsParam = units ? `&units=${units}` : '';
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&limit=5&sort_order=desc${unitsParam}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const obs = data.observations?.find((o: { value: string }) => o.value !== '.');
    return obs ? parseFloat(obs.value) : null;
  } catch {
    return null;
  }
}

// Returns [latest, previous] valid observations
async function fetchFredTwo(seriesId: string): Promise<[number | null, number | null]> {
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&limit=5&sort_order=desc`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [null, null];
    const data = await res.json();
    const valid = (data.observations ?? []).filter((o: { value: string }) => o.value !== '.');
    const latest = valid[0] ? parseFloat(valid[0].value) : null;
    const prev   = valid[1] ? parseFloat(valid[1].value) : null;
    return [latest, prev];
  } catch {
    return [null, null];
  }
}

async function fetchFmpCalendar(keyword: string): Promise<number | null> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const url = `https://financialmodelingprep.com/stable/economic-calendar?from=${from}&to=${today}&apikey=${FMP_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data: { event: string; actual: number | null; country: string; date: string }[] = await res.json();
    const entries = data
      .filter(x => x.event.toLowerCase().includes(keyword.toLowerCase()) && x.actual != null)
      .sort((a, b) => b.date.localeCompare(a.date));
    return entries[0]?.actual ?? null;
  } catch {
    return null;
  }
}

async function fetchIsmPmi(): Promise<number | null> {
  return fetchFmpCalendar('ISM Manufacturing PMI');
}

async function fetchConsumerSentiment(): Promise<number | null> {
  // FMP 有 "Michigan Consumer Sentiment" 初步值，比 FRED 快一個月
  const fmp = await fetchFmpCalendar('Michigan Consumer Sentiment');
  if (fmp != null) return fmp;
  // 回退至 FRED
  return fetchFred('UMCSENT');
}

export async function GET() {
  const [unemploymentRate, ismManufacturing, consumerConfidence, fedFundsRate, cpiYoY, ppiYoY, [nonfarmPayroll, nonfarmPayrollPrev]] =
    await Promise.all([
      fetchFred('UNRATE'),
      fetchIsmPmi(),
      fetchConsumerSentiment(),
      fetchFred('FEDFUNDS'),
      fetchFred('CPIAUCSL', 'pc1'),
      fetchFred('PPIFID', 'pc1'),
      fetchFredTwo('PAYEMS'),
    ]);

  const nonfarmPayrollChange =
    nonfarmPayroll != null && nonfarmPayrollPrev != null
      ? Math.round(nonfarmPayroll - nonfarmPayrollPrev)
      : null;

  return NextResponse.json({
    unemploymentRate,
    ismManufacturing,
    consumerConfidence,
    fedFundsRate,
    cpiYoY,
    ppiYoY,
    nonfarmPayroll,
    nonfarmPayrollChange,
    updatedAt: new Date().toISOString(),
  });
}

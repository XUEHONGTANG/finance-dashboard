import { NextResponse } from 'next/server';

const FRED_KEY = process.env.FRED_API_KEY || 'demo';
const FMP_KEY = process.env.FMP_API_KEY || 'demo';

async function fetchFred(seriesId: string): Promise<number | null> {
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&limit=5&sort_order=desc`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const obs = data.observations?.find((o: { value: string }) => o.value !== '.');
    return obs ? parseFloat(obs.value) : null;
  } catch {
    return null;
  }
}

async function fetchIsmPmi(): Promise<number | null> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const url = `https://financialmodelingprep.com/stable/economic-calendar?from=${from}&to=${today}&apikey=${FMP_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data: { event: string; actual: number | null; country: string; date: string }[] = await res.json();
    const entries = data
      .filter(x => x.event === 'ISM Manufacturing PMI (Mar)' || x.event.startsWith('ISM Manufacturing PMI') && x.country === 'US' && x.actual != null)
      .sort((a, b) => b.date.localeCompare(a.date));
    return entries[0]?.actual ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const [unemploymentRate, ismManufacturing, consumerConfidence, fedFundsRate] =
    await Promise.all([
      fetchFred('UNRATE'),
      fetchIsmPmi(),
      fetchFred('UMCSENT'),
      fetchFred('FEDFUNDS'),
    ]);

  return NextResponse.json({
    unemploymentRate,
    ismManufacturing,
    consumerConfidence,
    fedFundsRate,
    updatedAt: new Date().toISOString(),
  });
}

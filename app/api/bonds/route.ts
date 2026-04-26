import { NextResponse } from 'next/server';

const FRED_KEY = process.env.FRED_API_KEY || 'demo';

async function fetchFredSeries(seriesId: string): Promise<number | null> {
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&limit=5&sort_order=desc`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const obs = data.observations?.find((o: { value: string }) => o.value !== '.');
    return obs ? parseFloat(obs.value) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const [twoYear, tenYear] = await Promise.all([
    fetchFredSeries('DGS2'),
    fetchFredSeries('DGS10'),
  ]);

  const spread = twoYear != null && tenYear != null ? tenYear - twoYear : null;

  return NextResponse.json({
    twoYear,
    tenYear,
    spread,
    updatedAt: new Date().toISOString(),
  });
}

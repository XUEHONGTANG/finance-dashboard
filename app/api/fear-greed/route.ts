import { NextResponse } from 'next/server';

export async function GET() {
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

    if (!res.ok) throw new Error(`CNN API error: ${res.status}`);
    const data = await res.json();
    const fg = data?.fear_and_greed;

    return NextResponse.json({
      score: fg?.score ? Math.round(fg.score) : null,
      rating: fg?.rating ?? null,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ score: null, rating: null, updatedAt: new Date().toISOString() });
  }
}

import { NextResponse } from 'next/server';

function parseNum(raw: string): number | null {
  const cleaned = raw.replace(/[$,%]/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

function buildUrl(type: string, page: number): string {
  const l = `&L=${page}`;
  if (type === 'buys')  return `https://www.dataroma.com/m/g/portfolio_b.php?q=q${l}`;
  if (type === 'sells') return `https://www.dataroma.com/m/g/portfolio_s.php?q=q${l}`;
  return `https://www.dataroma.com/m/g/portfolio.php?L=${page}`;
}

function parseTotalPages(html: string): number {
  const matches = [...html.matchAll(/[?&]L=(\d+)/g)];
  const pages = matches.map(m => parseInt(m[1], 10)).filter(n => !isNaN(n));
  return pages.length ? Math.max(...pages) : 1;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type  = searchParams.get('type') || 'portfolio';
  const page  = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const q     = (searchParams.get('q') || '').toLowerCase();

  try {
    const res = await fetch(buildUrl(type, page), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InvestApp/1.0)',
        Accept: 'text/html',
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`dataroma ${res.status}`);
    const html = await res.text();

    const totalPages = parseTotalPages(html);

    // portfolio has 10 cols (includes Max%), buys/sells has 9 cols
    const isPortfolio = type === 'portfolio';
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const holdings = [];

    let rowMatch;
    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const rowHtml = rowMatch[1];
      const cells: string[] = [];
      const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let cellMatch;
      while ((cellMatch = cellRe.exec(rowHtml)) !== null) {
        cells.push(stripTags(cellMatch[1]));
      }

      const minCols = isPortfolio ? 10 : 9;
      if (cells.length < minCols) continue;
      const symbol = cells[0];
      if (!symbol || symbol === 'Symbol' || !/^[A-Z]{1,5}/.test(symbol)) continue;

      if (isPortfolio) {
        // cols: symbol, name, %, ownerCount, holdPrice, maxPct, currentPrice, 52wLow, aboveLow%, 52wHigh
        holdings.push({
          symbol,
          name:          cells[1],
          portfolioPct:  parseNum(cells[2]) ?? 0,
          count:         parseInt(cells[3], 10) || 0,
          holdPrice:     parseNum(cells[4]),
          maxPct:        parseNum(cells[5]),
          currentPrice:  parseNum(cells[6]),
          weekLow52:     parseNum(cells[7]),
          aboveLow52Pct: parseNum(cells[8]),
          weekHigh52:    parseNum(cells[9]),
          url: `https://www.dataroma.com/m/stock.php?sym=${symbol}`,
        });
      } else {
        // cols: symbol, name, %, buys/sells count, holdPrice, currentPrice, 52wLow, aboveLow%, 52wHigh
        holdings.push({
          symbol,
          name:          cells[1],
          portfolioPct:  parseNum(cells[2]) ?? 0,
          count:         parseInt(cells[3], 10) || 0,
          holdPrice:     parseNum(cells[4]),
          maxPct:        null,
          currentPrice:  parseNum(cells[5]),
          weekLow52:     parseNum(cells[6]),
          aboveLow52Pct: parseNum(cells[7]),
          weekHigh52:    parseNum(cells[8]),
          url: `https://www.dataroma.com/m/stock.php?sym=${symbol}`,
        });
      }
    }

    const filtered = q
      ? holdings.filter(h =>
          h.symbol.toLowerCase().includes(q) || h.name.toLowerCase().includes(q),
        )
      : holdings;

    return NextResponse.json({
      holdings: filtered,
      totalPages,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ holdings: [], totalPages: 1, updatedAt: new Date().toISOString() });
  }
}

import { NextResponse } from 'next/server';

const IM_BASE = 'https://www.insider-monitor.com';
const DR_BASE = 'https://www.dataroma.com';

const IM_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; InvestDashboard/1.0)',
  Accept: 'text/html',
};
const DR_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; InvestDashboard/1.0)',
  Accept: 'text/html',
  Referer: 'https://www.dataroma.com/',
};

// ── Shared types ─────────────────────────────────────────────────────────────

export interface InsiderTrade {
  id: string;
  filerName: string;
  issuerName: string;
  ticker: string | null;
  fileDate: string;    // YYYY-MM-DD
  formType: string;
  url: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  signalReason: string;
  tradeType: string;   // "Purchase" | "Sale" | "Option Exercise" …
  sharesPrice: string; // "31,000 @ $255"
  value: string;       // "$7,905,000"
  relationship: string;
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHref(html: string): string {
  const m = html.match(/href=["']([^"']+)["']/i);
  return m ? m[1] : '';
}

// Extract all <tr> rows as arrays of { text, raw } cells
function extractRows(html: string): { cells: string[]; rawCells: string[] }[] {
  const rows: { cells: string[]; rawCells: string[] }[] = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(html)) !== null) {
    const rowHtml = rm[1];
    if (/<th/i.test(rowHtml)) continue; // skip header rows
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const rawCells: string[] = [];
    const cells: string[] = [];
    let cm: RegExpExecArray | null;
    while ((cm = cellRe.exec(rowHtml)) !== null) {
      rawCells.push(cm[1]);
      cells.push(stripTags(cm[1]));
    }
    if (cells.length > 0) rows.push({ cells, rawCells });
  }
  return rows;
}

// Parse "21 Apr 2026" → "2026-04-21"
const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseDDMonYYYY(s: string): string {
  const parts = s.trim().split(/\s+/);
  if (parts.length !== 3) return s;
  const [d, mon, y] = parts;
  const m = MONTH_MAP[mon.toLowerCase()];
  if (!m) return s;
  return `${y}-${m}-${d.padStart(2, '0')}`;
}

// ── Mode A: dataroma.com insider trading ──────────────────────────────────────
// URL: /m/ins/ins.php?t=y&sym=AMZN&o=fd&d=d
// Columns (0-based):
//   0  Filing date   "21 Apr 2026"
//   1  Symbol        "AMZN"
//   2  Security      "Common Stock"
//   3  Reporting Name
//   4  Relationship
//   5  Trans. Date   "17 Apr 2026"
//   6  Purchase/Sale "Sale" | "Purchase" | "Option Exercise"
//   7  Shares        "31,000"
//   8  Price $       "255"
//   9  Amount $      "7,905,000"
//  10  D/I           "D" | "I"

function classifyInsider(tradeType: string): { signal: 'bullish' | 'bearish' | 'neutral'; reason: string } {
  const t = tradeType.toLowerCase();
  if (t.includes('purchase')) return { signal: 'bullish', reason: '內部人買入' };
  if (t.includes('sale'))     return { signal: 'bearish', reason: '內部人賣出' };
  return { signal: 'neutral', reason: '選擇權行使或其他' };
}

function parseDataromaInsiderPage(html: string, ticker: string, pageUrl: string): InsiderTrade[] {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 6);

  const trades: InsiderTrade[] = [];
  const rows = extractRows(html);

  rows.forEach((r, idx) => {
    const { cells } = r;
    if (cells.length < 9) return;

    const filingDateRaw = cells[0];
    const name         = cells[3];
    const relationship = cells[4];
    const transDateRaw = cells[5];
    const tradeType    = cells[6];
    const shares       = cells[7];
    const price        = cells[8];
    const amount       = cells[9] ?? '';

    // Validate: trans date must parse and trade type must be known
    if (!name || !tradeType) return;
    if (!/purchase|sale|option/i.test(tradeType)) return;

    const transDate = parseDDMonYYYY(transDateRaw);
    const dateObj   = new Date(transDate);
    if (isNaN(dateObj.getTime())) return;
    if (dateObj < cutoff) return;

    const sharesFormatted = price
      ? `${shares} @ $${price}`
      : shares;
    const amountFormatted = amount ? `$${amount}` : '—';

    const { signal, reason } = classifyInsider(tradeType);

    trades.push({
      id: `dr-ins-${idx}-${ticker}-${transDate}`,
      filerName: name,
      issuerName: ticker,
      ticker,
      fileDate: transDate,
      formType: '4',
      url: pageUrl,
      signal,
      signalReason: reason,
      tradeType,
      sharesPrice: sharesFormatted,
      value: amountFormatted,
      relationship,
    });
  });

  return trades;
}

async function fetchDataromaInsider(ticker: string): Promise<InsiderTrade[]> {
  // t=y  → last year of data; fetch pages 1 and 2 to ensure 6 months coverage
  const base = `${DR_BASE}/m/ins/ins.php?t=y&sym=${encodeURIComponent(ticker)}&o=fd&d=d`;
  const urls = [base, `${base}&L=2`];

  const results = await Promise.allSettled(
    urls.map(async url => {
      const res = await fetch(url, { headers: DR_HEADERS, next: { revalidate: 300 } });
      if (!res.ok) return [];
      const html = await res.text();
      return parseDataromaInsiderPage(html, ticker, base);
    })
  );

  const trades: InsiderTrade[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') trades.push(...r.value);
  }

  // Deduplicate by id, sort newest first
  const seen = new Set<string>();
  return trades
    .filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; })
    .sort((a, b) => b.fileDate.localeCompare(a.fileDate));
}

// ── Mode B: insider-monitor.com — general search ──────────────────────────────
// Used by /sec overview page (q= param)

function parseRealtimeRows(html: string): InsiderTrade[] {
  const trades: InsiderTrade[] = [];
  const rows = extractRows(html);

  rows.forEach((r, idx) => {
    const { cells, rawCells } = r;
    if (cells.length < 7) return;
    const [symbol, company, insiderName, tradeType, sharesPrice, value, dateTime] = cells;
    if (!symbol && !company) return;

    const href = rawCells[1] ? extractHref(rawCells[1]) : '';
    const tradeUrl = href
      ? (href.startsWith('http') ? href : `${IM_BASE}/${href.replace(/^\//, '')}`)
      : `${IM_BASE}/insider_stock_trading_report.html`;

    const t = tradeType.trim().toUpperCase();
    const signal: InsiderTrade['signal'] =
      t === 'B' || t === 'P' ? 'bullish' : t === 'S' ? 'bearish' : 'neutral';
    const signalReason =
      signal === 'bullish' ? '內部人買入' : signal === 'bearish' ? '內部人賣出' : '其他';

    trades.push({
      id: `im-rt-${idx}-${symbol}`,
      filerName: insiderName || '—',
      issuerName: company || symbol || '—',
      ticker: symbol || null,
      fileDate: dateTime || '—',
      formType: '4',
      url: tradeUrl,
      signal,
      signalReason,
      tradeType: tradeType || '—',
      sharesPrice: sharesPrice || '—',
      value: value || '—',
      relationship: '',
    });
  });

  return trades;
}

async function fetchRealtimePage(page: number): Promise<InsiderTrade[]> {
  const url =
    page === 1
      ? `${IM_BASE}/insider_stock_trading_report.html`
      : `${IM_BASE}/insider_stock_trading_report-${page}.html`;
  try {
    const res = await fetch(url, { headers: IM_HEADERS, next: { revalidate: 300 } });
    if (!res.ok) return [];
    return parseRealtimeRows(await res.text());
  } catch {
    return [];
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get('ticker') ?? '').toUpperCase().trim();
  const query  = (searchParams.get('q') ?? '').toLowerCase().trim();

  try {
    if (ticker) {
      const trades = await fetchDataromaInsider(ticker);
      return NextResponse.json({
        trades,
        total: trades.length,
        updatedAt: new Date().toISOString(),
        source: 'dataroma.com',
      });
    }

    const [p1, p2] = await Promise.all([fetchRealtimePage(1), fetchRealtimePage(2)]);
    let trades = [...p1, ...p2];

    if (query) {
      trades = trades.filter(t =>
        (t.ticker ?? '').toLowerCase().includes(query) ||
        t.issuerName.toLowerCase().includes(query) ||
        t.filerName.toLowerCase().includes(query),
      );
    }

    return NextResponse.json({
      trades,
      total: trades.length,
      updatedAt: new Date().toISOString(),
      source: 'insider-monitor.com',
    });
  } catch {
    return NextResponse.json({ trades: [], total: 0, updatedAt: new Date().toISOString() });
  }
}

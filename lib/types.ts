export interface BondData {
  twoYear: number | null;
  tenYear: number | null;
  spread: number | null;
  updatedAt: string;
}

export interface ForexData {
  USDTWD: number | null;
  USDJPY: number | null;
  updatedAt: string;
}

export interface EconomicData {
  unemploymentRate: number | null;
  ismManufacturing: number | null;
  consumerConfidence: number | null;
  fedFundsRate: number | null;
  cpiYoY: number | null;
  ppiYoY: number | null;
  updatedAt: string;
}

export interface FearGreedData {
  score: number | null;
  rating: string | null;
  updatedAt: string;
}

export interface SignalData {
  fedCuttingRates: boolean | null;
  sp500DrawdownPct: number | null;
  nasdaqDrawdownPct: number | null;
  fearGreedScore: number | null;
  marketUp30FromLow: boolean | null;
}

export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;
}

export interface ChartPoint {
  time: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface StockFundamentals {
  ticker: string;
  name: string;
  price: number;
  marketCap: number;
  eps: number | null;
  pe: number | null;
  pb: number | null;
  operatingMargin: number | null;
  cashAndEquivalents: number | null;
  totalAssets: number | null;
  cashToMarketCapPct: number | null;
  revenueHistory: { year: string; revenue: number; growth: number | null }[];
  revenueGrowthAvg3Y: number | null;
  sector: string;
  industry: string;
  description: string;
  website: string;
  ipoDate: string;
}

export interface GrandPortfolioHolding {
  symbol: string;
  name: string;
  portfolioPct: number;
  ownerCount: number;
  holdPrice: number | null;
  maxPct: number | null;
  currentPrice: number | null;
  weekLow52: number | null;
  aboveLow52Pct: number | null;
  weekHigh52: number | null;
  url: string;
}

export interface InsiderTrade {
  id: string;
  filerName: string;
  issuerName: string;
  ticker?: string;
  fileDate: string;
  formType: string;
  url: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  signalReason: string;
}

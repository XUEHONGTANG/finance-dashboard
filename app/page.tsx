import { BondSpreadCard } from '@/components/dashboard/BondSpreadCard';
import { ForexCard } from '@/components/dashboard/ForexCard';
import { EconomicCards } from '@/components/dashboard/EconomicCards';
import { FearGreedGauge } from '@/components/dashboard/FearGreedGauge';
import { BuySellSignals } from '@/components/dashboard/BuySellSignals';
import { StockWatchlist } from '@/components/dashboard/StockWatchlist';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">投資儀表板</h1>
          <p className="text-slate-500 text-sm mt-1">US Investment Dashboard · 每 5 分鐘自動更新</p>
        </div>

        {/* Top row: F&G + Bond + Forex */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <FearGreedGauge />
          <BondSpreadCard />
          <ForexCard />
        </div>

        {/* Economic indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <EconomicCards />
        </div>

        {/* Buy/Sell Signals - full width */}
        <div className="mb-4">
          <BuySellSignals />
        </div>

        {/* Stock watchlist */}
        <div className="mb-4">
          <StockWatchlist />
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-slate-400">
          <p>資料來源：FRED、Yahoo Finance、CNN · 僅供參考，不構成投資建議</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/sec" className="hover:text-slate-600 transition-colors">13F 機構報告 &amp; 內部人交易 →</a>
          </div>
        </footer>
      </div>
    </main>
  );
}

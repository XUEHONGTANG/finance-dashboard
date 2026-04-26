import Link from 'next/link';
import { StockDetailView } from '@/components/stocks/StockDetailView';

export default async function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
            ← 返回儀表板
          </Link>
        </div>
        <StockDetailView ticker={ticker.toUpperCase()} />
      </div>
    </main>
  );
}

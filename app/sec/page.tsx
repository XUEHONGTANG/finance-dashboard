import { FilingsTable } from '@/components/sec/FilingsTable';

export default function SECPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">機構持倉</h1>
          <p className="text-slate-500 text-sm mt-1">
            Superinvestor Grand Portfolio · 資料來源：Dataroma
          </p>
        </div>

        <div className="space-y-6">
          <FilingsTable />
        </div>
      </div>
    </main>
  );
}

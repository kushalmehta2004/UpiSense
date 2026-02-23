import { Header } from '../components/Header';
import { TransactionFeed } from '../components/TransactionFeed';

export function Transactions() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/30">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">All Transactions</h1>
        <TransactionFeed compact={false} />
      </main>
    </div>
  );
}

import { Header } from '../components/Header';
import { TransactionFeed } from '../components/TransactionFeed';

export function Transactions() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">All Transactions</h1>
        <TransactionFeed compact={false} />
      </main>
    </div>
  );
}

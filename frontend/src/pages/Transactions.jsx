import { Header } from '../components/Header';
import { TransactionFeed } from '../components/TransactionFeed';

export function Transactions() {
  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-[#0f172a] mb-6">All Transactions</h1>
        <TransactionFeed compact={false} />
      </main>
    </div>
  );
}

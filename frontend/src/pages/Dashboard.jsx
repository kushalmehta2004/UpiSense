import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { TransactionFeed } from '../components/TransactionFeed';
import { CategoryChart } from '../components/CategoryChart';
import { WeeklyTrend } from '../components/WeeklyTrend';
import { useAuthStore } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function Dashboard() {
  const { user } = useAuthStore();
  const [newTxns, setNewTxns] = useState(0);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });

  // Real-time subscription for new transactions (requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
  useEffect(() => {
    if (!supabaseUrl || !supabaseKey || !user?.id) return;

    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch {
      return;
    }

    const channel = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          setNewTxns((n) => n + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {newTxns > 0 && (
          <div className="mb-4 p-3 bg-[#00a651]/10 text-[#00a651] rounded-lg text-sm">
            {newTxns} new transaction{newTxns > 1 ? 's' : ''} added. Refresh to see updates.
          </div>
        )}

        <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CategoryChart from={dateRange.from || startOfMonth} to={dateRange.to} />
          <WeeklyTrend days={7} />
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Transactions</h2>
          <TransactionFeed compact />
        </section>
      </main>
    </div>
  );
}

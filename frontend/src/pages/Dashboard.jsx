import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { TransactionFeed } from '../components/TransactionFeed';
import { CategoryChart } from '../components/CategoryChart';
import { WeeklyTrend } from '../components/WeeklyTrend';
import { useAuthStore } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';
import { budgets as budgetsApi, debts as debtsApi } from '../utils/api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function Dashboard() {
  const { user } = useAuthStore();
  const [newTxns, setNewTxns] = useState(0);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [budgets, setBudgets] = useState([]);
  const [debtSummary, setDebtSummary] = useState({ owedToMe: [], iOwe: [] });
  const [featuresLoading, setFeaturesLoading] = useState(true);

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

  // Load budgets and debts summary
  useEffect(() => {
    const load = async () => {
      setFeaturesLoading(true);
      try {
        const [budgetsRes, owedRes, iOweRes] = await Promise.allSettled([
          budgetsApi.list(),
          debtsApi.owedToMe(),
          debtsApi.iOwe(),
        ]);
        if (budgetsRes.status === 'fulfilled' && budgetsRes.value?.data?.budgets) {
          setBudgets(budgetsRes.value.data.budgets);
        }
        if (owedRes.status === 'fulfilled' && owedRes.value?.data?.entries) {
          setDebtSummary((prev) => ({ ...prev, owedToMe: owedRes.value.data.entries }));
        }
        if (iOweRes.status === 'fulfilled' && iOweRes.value?.data?.entries) {
          setDebtSummary((prev) => ({ ...prev, iOwe: iOweRes.value.data.entries }));
        }
      } catch {
        // ignore
      } finally {
        setFeaturesLoading(false);
      }
    };
    load();
  }, []);

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

        {/* Budgets and Debts summary */}
        {!featuresLoading && (budgets.length > 0 || debtSummary.owedToMe.length > 0 || debtSummary.iOwe.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {budgets.length > 0 && (
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h2 className="text-sm font-semibold text-slate-600 mb-3">Budgets this month</h2>
                <ul className="space-y-2">
                  {budgets.slice(0, 3).map((b) => (
                    <li key={b.category} className="flex justify-between items-center text-sm">
                      <span className="text-slate-700">{b.category}</span>
                      <span className={b.percent >= 100 ? 'text-red-600' : b.percent >= 80 ? 'text-amber-600' : 'text-slate-600'}>
                        ₹{Number(b.spend).toLocaleString('en-IN')} / ₹{Number(b.limit).toLocaleString('en-IN')} ({b.percent}%)
                      </span>
                    </li>
                  ))}
                </ul>
                {budgets.length > 3 && (
                  <p className="text-xs text-slate-500 mt-2">+{budgets.length - 3} more</p>
                )}
              </div>
            )}
            {(debtSummary.owedToMe.length > 0 || debtSummary.iOwe.length > 0) && (
              <Link
                to="/debts"
                className="block p-4 bg-white rounded-xl border border-slate-200 hover:border-[#00a651] hover:shadow-md transition-all col-span-1 md:col-span-2"
              >
                <h2 className="text-sm font-semibold text-slate-600 mb-2">Debts (IOU)</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-emerald-700 font-medium">Who owes you</p>
                    <p className="text-slate-700">
                      {debtSummary.owedToMe.length === 0
                        ? 'No one'
                        : `${debtSummary.owedToMe.length} person(s) · ₹${debtSummary.owedToMe.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-amber-700 font-medium">Who you owe</p>
                    <p className="text-slate-700">
                      {debtSummary.iOwe.length === 0
                        ? 'No one'
                        : `${debtSummary.iOwe.length} person(s) · ₹${debtSummary.iOwe.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}`}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">View full list →</p>
              </Link>
            )}
          </div>
        )}

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

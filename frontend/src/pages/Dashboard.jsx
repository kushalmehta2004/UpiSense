import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { TransactionFeed } from '../components/TransactionFeed';
import { CategoryChart } from '../components/CategoryChart';
import { WeeklyTrend } from '../components/WeeklyTrend';
import { useAuthStore } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';
import { groups as groupsApi, budgets as budgetsApi, family as familyApi } from '../utils/api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function Dashboard() {
  const { user } = useAuthStore();
  const [newTxns, setNewTxns] = useState(0);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [budgets, setBudgets] = useState([]);
  const [groupsSummary, setGroupsSummary] = useState({ totalYouOwe: 0, totalOwedToYou: 0, groupCount: 0 });
  const [familyTotal, setFamilyTotal] = useState(null);
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

  // Load budgets, groups summary, family summary
  useEffect(() => {
    const load = async () => {
      setFeaturesLoading(true);
      try {
        const [budgetsRes, summaryRes, familyRes] = await Promise.allSettled([
          budgetsApi.list(),
          groupsApi.summary(),
          familyApi.summary(),
        ]);
        if (budgetsRes.status === 'fulfilled' && budgetsRes.value?.data?.budgets) {
          setBudgets(budgetsRes.value.data.budgets);
        }
        if (summaryRes.status === 'fulfilled' && summaryRes.value?.data?.success && summaryRes.value.data.groupCount > 0) {
          const d = summaryRes.value.data;
          setGroupsSummary({
            totalYouOwe: d.totalYouOwe || 0,
            totalOwedToYou: d.totalOwedToYou || 0,
            groupCount: d.groupCount || 0,
          });
        }
        if (familyRes.status === 'fulfilled' && familyRes.value?.data?.total != null) {
          setFamilyTotal(familyRes.value.data.total);
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

        {/* Budgets, Groups, Family summary */}
        {!featuresLoading && (budgets.length > 0 || groupsSummary.groupCount > 0 || familyTotal != null) && (
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
            {groupsSummary.groupCount > 0 && (
              <Link
                to="/groups"
                className="block p-4 bg-white rounded-xl border border-slate-200 hover:border-[#00a651] hover:shadow-md transition-all"
              >
                <h2 className="text-sm font-semibold text-slate-600 mb-2">Groups</h2>
                <p className="text-amber-700 text-sm">You owe: ₹{groupsSummary.totalYouOwe.toLocaleString('en-IN')}</p>
                <p className="text-emerald-700 text-sm">Owed to you: ₹{groupsSummary.totalOwedToYou.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-500 mt-2">{groupsSummary.groupCount} group(s) →</p>
              </Link>
            )}
            {familyTotal != null && (
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h2 className="text-sm font-semibold text-slate-600 mb-2">Family shared (this month)</h2>
                <p className="text-lg font-bold text-slate-800">₹{Number(familyTotal).toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-500 mt-1">You + linked family members</p>
              </div>
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

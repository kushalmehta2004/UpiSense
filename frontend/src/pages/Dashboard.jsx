import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import { TrendingDown, ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { TransactionFeed } from '../components/TransactionFeed';
import { CategoryChart } from '../components/CategoryChart';
import { WeeklyTrend } from '../components/WeeklyTrend';
import { QuickActionsBar } from '../components/QuickActionsBar';
import { useAuthStore } from '../hooks/useAuth';
import { useTransactionsSummary, useTransactions } from '../hooks/useTransactions';
import { createClient } from '@supabase/supabase-js';
import { budgets as budgetsApi, debts as debtsApi } from '../utils/api';
import { colors, getWhatsAppUrl } from '../theme';
import { CountUp } from '../components/CountUp';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const cardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

export function Dashboard() {
  const { user } = useAuthStore();
  const [newTxns, setNewTxns] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [budgets, setBudgets] = useState([]);
  const [debtSummary, setDebtSummary] = useState({ owedToMe: [], iOwe: [] });
  const [featuresLoading, setFeaturesLoading] = useState(true);

  const now = new Date();
  const focusDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const from = format(startOfMonth(focusDate), 'yyyy-MM-dd');
  const to = format(endOfMonth(focusDate), 'yyyy-MM-dd');

  const { summary, total: summaryTotal, loading: summaryLoading } = useTransactionsSummary({ from, to });
  const { transactions: listTxns, pagination, loading: listLoading } = useTransactions({
    page: 1,
    limit: 1,
    from,
    to,
  });
  const derivedTotalFromSummary = Array.isArray(summary) && summary.length
    ? summary.reduce((s, x) => s + (Number(x?.amount) ?? 0), 0)
    : 0;
  const totalSpent = (typeof summaryTotal === 'number' && summaryTotal >= 0) ? summaryTotal : derivedTotalFromSummary;
  const txnCount = typeof pagination?.total === 'number' ? pagination.total : (pagination?.total != null ? Number(pagination.total) : 0);
  const owedToMeTotal = debtSummary.owedToMe.reduce((s, e) => s + (Number(e?.amount) ?? Number(e?.balance) ?? 0), 0);
  const iOweTotal = debtSummary.iOwe.reduce((s, e) => s + (Number(e?.amount) ?? Number(e?.balance) ?? 0), 0);

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
        { event: 'INSERT', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => setNewTxns((n) => n + 1)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

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
          const entries = Array.isArray(owedRes.value.data.entries) ? owedRes.value.data.entries : [];
          setDebtSummary((prev) => ({ ...prev, owedToMe: entries }));
        }
        if (iOweRes.status === 'fulfilled' && iOweRes.value?.data?.entries) {
          const entries = Array.isArray(iOweRes.value.data.entries) ? iOweRes.value.data.entries : [];
          setDebtSummary((prev) => ({ ...prev, iOwe: entries }));
        }
      } catch {
        // ignore
      } finally {
        setFeaturesLoading(false);
      }
    };
    load();
  }, []);

  const prevMonthTotal = 0; // could fetch summary for previous month for "vs last month"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* New txns toast */}
      {newTxns > 0 && (
        <div
          className="p-3 rounded-xl text-sm font-medium border flex items-center justify-between"
          style={{ background: 'rgba(0,212,160,0.1)', borderColor: 'rgba(0,212,160,0.3)', color: colors.mint }}
        >
          {newTxns} new transaction{newTxns > 1 ? 's' : ''} added. Refresh to see updates.
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
            Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
            {summaryLoading || listLoading ? (
              'Loading…'
            ) : (
              <>
                You spent ₹<CountUp value={totalSpent} /> in {format(focusDate, 'MMMM yyyy')} across{' '}
                <CountUp value={txnCount} /> transactions
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthOffset((m) => m - 1)}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: colors.textSecondary }}
          >
            ←
          </button>
          <span className="min-w-[140px] text-center font-medium" style={{ color: colors.text }}>
            {format(focusDate, 'MMMM yyyy')}
          </span>
          <button
            type="button"
            onClick={() => setMonthOffset((m) => Math.min(0, m + 1))}
            className="p-2 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-40"
            style={{ color: colors.textSecondary }}
            disabled={monthOffset >= 0}
          >
            →
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <QuickActionsBar />

      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border transition-all duration-200 hover:border-[rgba(0,212,160,0.2)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,212,160,0.05)] hover:-translate-y-0.5"
          style={cardStyle}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(249,115,22,0.15)' }}
          >
            <TrendingDown className="w-5 h-5" style={{ color: colors.orange }} />
          </div>
          <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Total Spent</p>
          <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: colors.text }}>
            {summaryLoading && summary.length === 0 ? '—' : <>₹<CountUp value={totalSpent} /></>}
          </p>
          <p className="text-xs mt-1" style={{ color: colors.orange }}>↑ vs last month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border transition-all duration-200 hover:border-[rgba(0,212,160,0.2)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,212,160,0.05)] hover:-translate-y-0.5"
          style={cardStyle}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(0,212,160,0.15)' }}
          >
            <ArrowLeftRight className="w-5 h-5" style={{ color: colors.mint }} />
          </div>
          <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Transactions</p>
          <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: colors.text }}>
            {listLoading && (!pagination || pagination.total == null) ? '—' : <CountUp value={txnCount} />}
          </p>
          <p className="text-xs mt-1" style={{ color: colors.mint }}>↑ vs last month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border transition-all duration-200 hover:border-[rgba(0,212,160,0.2)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,212,160,0.05)] hover:-translate-y-0.5"
          style={cardStyle}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(0,212,160,0.15)' }}
          >
            <ArrowDownLeft className="w-5 h-5" style={{ color: colors.mint }} />
          </div>
          <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Who Owes You</p>
          <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: colors.mint }}>
            {featuresLoading && debtSummary.owedToMe.length === 0 ? '—' : <>₹<CountUp value={owedToMeTotal} /></>}
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            {debtSummary.owedToMe.length} people
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border transition-all duration-200 hover:border-[rgba(0,212,160,0.2)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,212,160,0.05)] hover:-translate-y-0.5"
          style={cardStyle}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(245,166,35,0.15)' }}
          >
            <ArrowUpRight className="w-5 h-5" style={{ color: colors.amber }} />
          </div>
          <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>You Owe</p>
          <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: colors.amber }}>
            {featuresLoading && debtSummary.iOwe.length === 0 ? '—' : <>₹<CountUp value={iOweTotal} /></>}
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            {debtSummary.iOwe.length} people
          </p>
        </motion.div>
      </div>

      {/* Row 2: Charts — same row height so both cards match */}
      <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-6">
        <WeeklyTrend days={7} />
        <CategoryChart from={from} to={to} />
      </div>

      {/* Row 3: Budget + Debts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section
          className="rounded-2xl border transition-all duration-200 hover:border-[rgba(0,212,160,0.2)] hover:-translate-y-0.5"
          style={cardStyle}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
            Budgets This Month
          </h2>
          {!featuresLoading && budgets.length === 0 ? (
            <p className="text-sm py-4" style={{ color: colors.textSecondary }}>
              No budgets set. Add one to track spending by category.
            </p>
          ) : (
            <ul className="space-y-4">
              {budgets.slice(0, 5).map((b) => {
                const pct = Math.min(100, Math.round((Number(b.spend) / Number(b.limit)) * 100));
                const barColor = pct >= 90 ? colors.orange : pct >= 70 ? colors.amber : colors.mint;
                return (
                  <li key={b.category}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium" style={{ color: colors.text }}>{b.category}</span>
                      <span className="text-xs font-mono tabular-nums" style={{ color: colors.textSecondary }}>
                        ₹{Number(b.spend).toLocaleString('en-IN')} / ₹{Number(b.limit).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(pct, 100)}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: barColor }}
                        />
                      </div>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: `${barColor}20`, color: barColor }}
                      >
                        {pct}%
                      </span>
                      {pct >= 100 && (
                        <span className="text-xs font-medium shrink-0" style={{ color: colors.orange }}>Over!</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            className="mt-4 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: colors.mint, color: colors.mint }}
          >
            + Add Budget
          </button>
        </section>

        <section
          className="rounded-2xl border transition-all duration-200 hover:border-[rgba(0,212,160,0.2)] hover:-translate-y-0.5"
          style={cardStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
              Debts (IOU)
            </h2>
            <Link to="/debts" className="text-sm font-medium" style={{ color: colors.mint }}>
              View all →
            </Link>
          </div>
          {owedToMeTotal === 0 && iOweTotal === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: colors.text }}>No debts tracked yet</p>
              <p className="text-xs mb-4" style={{ color: colors.textSecondary }}>
                Say &quot;Rohan owes me 500&quot; on WhatsApp to start tracking
              </p>
              <a
                href={getWhatsAppUrl('Rohan owes me 500')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: '#25D366', color: 'white' }}
              >
                Message UpiSense on WhatsApp
              </a>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-3 border-l-4" style={{ borderLeftColor: colors.mint, background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Who owes you</p>
                  <p className="text-lg font-bold font-mono" style={{ color: colors.mint }}>
                    ₹{owedToMeTotal.toLocaleString('en-IN')}
                  </p>
                  {debtSummary.owedToMe.slice(0, 2).map((e, i) => (
                    <p key={i} className="text-xs mt-1 truncate" style={{ color: colors.textSecondary }}>
                      {e.person_name} · ₹{Number(e.amount).toLocaleString('en-IN')}
                    </p>
                  ))}
                </div>
                <div className="rounded-xl p-3 border-l-4" style={{ borderLeftColor: colors.amber, background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Who you owe</p>
                  <p className="text-lg font-bold font-mono" style={{ color: colors.amber }}>
                    ₹{iOweTotal.toLocaleString('en-IN')}
                  </p>
                  {debtSummary.iOwe.slice(0, 2).map((e, i) => (
                    <p key={i} className="text-xs mt-1 truncate" style={{ color: colors.textSecondary }}>
                      {e.person_name} · ₹{Number(e.amount).toLocaleString('en-IN')}
                    </p>
                  ))}
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg text-xs italic" style={{ background: colors.inputBg }}>
                ℹ️ Add via WhatsApp: &quot;Rohan owes me 500&quot; or &quot;I owe Samkit 300&quot;
              </div>
            </>
          )}
        </section>
      </div>

      {/* Row 4: Recent transactions */}
      <section
        className="rounded-2xl border transition-all duration-200"
        style={cardStyle}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
            Recent Transactions
          </h2>
          <Link to="/transactions" className="text-sm font-medium" style={{ color: colors.mint }}>
            View all →
          </Link>
        </div>
        <TransactionFeed compact />
      </section>
    </motion.div>
  );
}

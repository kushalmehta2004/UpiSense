import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { debts as debtsApi } from '../utils/api';
import { colors } from '../theme';

function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function avatarColor(name) {
  const n = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const palette = [colors.mint, colors.blue, colors.purple, colors.amber];
  return palette[n % palette.length];
}

export function Debts() {
  const [owedToMe, setOwedToMe] = useState([]);
  const [iOwe, setIOwe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [owedRes, iOweRes] = await Promise.all([
          debtsApi.owedToMe(),
          debtsApi.iOwe(),
        ]);
        if (owedRes.data?.entries) setOwedToMe(owedRes.data.entries);
        if (iOweRes.data?.entries) setIOwe(iOweRes.data.entries);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load debts');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalOwedToMe = owedToMe.reduce((s, e) => s + e.amount, 0);
  const totalIOwe = iOwe.reduce((s, e) => s + e.amount, 0);
  const netBalance = totalOwedToMe - totalIOwe;

  const cardStyle = {
    background: colors.cardBg,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
        <div
          className="animate-spin w-10 h-10 border-2 rounded-full border-t-transparent"
          style={{ borderColor: colors.mint }}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
          Debts (IOU)
        </h1>
        <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
          Track who owes you and who you owe. Add via WhatsApp:{' '}
          <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,160,0.15)', color: colors.mint }}>
            Samkit owes me 500
          </code>{' '}
          or{' '}
          <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,160,0.15)', color: colors.mint }}>
            I owe Raj 300
          </code>
        </p>
      </div>

      {error && (
        <div
          className="p-4 rounded-xl border text-sm"
          style={{ background: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.3)', color: colors.orange }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Who owes you */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border-t-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          style={{ ...cardStyle, borderTopColor: colors.mint }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownLeft className="w-5 h-5" style={{ color: colors.mint }} />
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
              Who Owes You
            </h2>
            <span
              className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,212,160,0.15)', color: colors.mint }}
            >
              ₹{totalOwedToMe.toLocaleString('en-IN')} total
            </span>
          </div>
          <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {owedToMe.length === 0 ? (
              <li className="py-6 text-sm" style={{ color: colors.textSecondary }}>No one owes you anything right now.</li>
            ) : (
              owedToMe.map((entry, i) => (
                <li
                  key={`${entry.person_name}-${i}`}
                  className="flex items-center justify-between py-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{ background: `${avatarColor(entry.person_name)}30`, color: colors.text }}
                    >
                      {getInitials(entry.person_name)}
                    </div>
                    <div>
                      <p className="font-medium truncate" style={{ color: colors.text }}>
                        {/^\d+$/.test(entry.person_name) ? (
                          <span className="font-mono">{entry.person_name}</span>
                        ) : (
                          entry.person_name
                        )}
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>owes you</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold tabular-nums" style={{ color: colors.mint }}>
                      ₹{Number(entry.amount).toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      className="text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded border"
                      style={{ borderColor: colors.mint, color: colors.mint }}
                    >
                      Remind
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </motion.section>

        {/* Who you owe */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border-t-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          style={{ ...cardStyle, borderTopColor: colors.amber }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-5 h-5" style={{ color: colors.amber }} />
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
              Who You Owe
            </h2>
            <span
              className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(245,166,35,0.15)', color: colors.amber }}
            >
              ₹{totalIOwe.toLocaleString('en-IN')} total
            </span>
          </div>
          <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {iOwe.length === 0 ? (
              <li className="py-6 text-sm" style={{ color: colors.textSecondary }}>You don&apos;t owe anyone right now.</li>
            ) : (
              iOwe.map((entry, i) => (
                <li
                  key={`${entry.person_name}-${i}`}
                  className="flex items-center justify-between py-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{ background: `${avatarColor(entry.person_name)}30`, color: colors.text }}
                    >
                      {getInitials(entry.person_name)}
                    </div>
                    <div>
                      <p className="font-medium truncate" style={{ color: colors.text }}>
                        {/^\d+$/.test(entry.person_name) ? (
                          <span className="font-mono">{entry.person_name}</span>
                        ) : (
                          entry.person_name
                        )}
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>you owe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold tabular-nums" style={{ color: colors.amber }}>
                      ₹{Number(entry.amount).toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      className="text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded border"
                      style={{ borderColor: colors.amber, color: colors.amber }}
                    >
                      Mark paid
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </motion.section>
      </div>

      {/* Net balance */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border p-6"
        style={{
          background: netBalance >= 0 ? 'rgba(0,212,160,0.05)' : 'rgba(245,166,35,0.05)',
          borderColor: netBalance >= 0 ? 'rgba(0,212,160,0.3)' : 'rgba(245,166,35,0.3)',
        }}
      >
        <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>Net position</p>
        <p className="text-xl font-bold font-mono tabular-nums" style={{ color: netBalance >= 0 ? colors.mint : colors.amber }}>
          {netBalance >= 0 ? 'You are owed ₹' : 'You owe ₹'}
          {Math.abs(netBalance).toLocaleString('en-IN')} overall
        </p>
      </motion.section>
    </motion.div>
  );
}

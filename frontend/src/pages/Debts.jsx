import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, ChevronDown, Users, CheckCircle } from 'lucide-react';
import { debts as debtsApi } from '../utils/api';
import { colors, getWhatsAppUrl } from '../theme';
import { WhatsAppButton } from '../components/WhatsAppButton';

function formatPhoneDisplay(num) {
  const n = String(num || '').replace(/\D/g, '');
  if (n.length === 10) return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
  if (n.length > 10) return `+${n.slice(0, 2)} ${n.slice(2, 7)} ${n.slice(7)}`;
  return num;
}

function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  if (/^\d+$/.test(name)) return '📱';
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
  const [tipsCollapsed, setTipsCollapsed] = useState(() => {
    try { return localStorage.getItem('upisense_debts_tips_collapsed') === 'true'; } catch { return false; }
  });

  const setTipsCollapsedAndSave = (v) => {
    setTipsCollapsed(v);
    try { localStorage.setItem('upisense_debts_tips_collapsed', v); } catch {}
  };

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

  const totalOwedToMe = owedToMe.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalIOwe = iOwe.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const netBalance = totalOwedToMe - totalIOwe;
  const totalPeople = (owedToMe.length + iOwe.length) || 0;
  const isEmpty = owedToMe.length === 0 && iOwe.length === 0;

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
          Debts & IOUs
        </h1>
        {!tipsCollapsed && (
          <div
            className="mt-4 rounded-xl border p-5"
            style={{ background: 'rgba(0,212,160,0.04)', borderColor: 'rgba(0,212,160,0.12)' }}
          >
            <div className="grid md:grid-cols-2 gap-6 mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>Add via WhatsApp</p>
                <div className="space-y-1.5 text-sm">
                  {['Rohan owes me 500 for concert tickets', 'I owe Samkit 300 for Ola', 'Ravi returned my 200', 'I paid back Priya 500'].map((msg) => (
                    <div key={msg} className="px-3 py-2 rounded-lg" style={{ background: colors.inputBg }}>&quot;{msg}&quot;</div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>Mark as settled</p>
                <div className="space-y-1 text-sm" style={{ color: colors.textSecondary }}>
                  <p>[Name] returned my [amount]</p>
                  <p>I paid back [name]</p>
                  <p>[name] paid me</p>
                  <p>settle [name]</p>
                </div>
              </div>
            </div>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              Balances update automatically. Both names work — &quot;Rohan returned my money&quot; or &quot;Rohan paid me back&quot; are both understood.
            </p>
            <button type="button" onClick={() => setTipsCollapsedAndSave(true)} className="mt-3 text-xs" style={{ color: colors.mint }}>Hide tips ↑</button>
          </div>
        )}
        {tipsCollapsed && (
          <button type="button" onClick={() => setTipsCollapsedAndSave(false)} className="mt-2 text-xs flex items-center gap-1" style={{ color: colors.textSecondary }}>
            <ChevronDown className="w-3 h-3" /> Show tips ↓
          </button>
        )}
      </div>

      {error && (
        <div
          className="p-4 rounded-xl border text-sm"
          style={{ background: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.3)', color: colors.orange }}
        >
          {error}
        </div>
      )}

      {!isEmpty && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border p-4 flex items-center gap-4"
          style={{
            background: netBalance > 0 ? 'rgba(0,212,160,0.06)' : netBalance < 0 ? 'rgba(245,166,35,0.06)' : 'rgba(255,255,255,0.02)',
            borderColor: netBalance > 0 ? 'rgba(0,212,160,0.2)' : netBalance < 0 ? 'rgba(245,166,35,0.2)' : colors.cardBorder,
          }}
        >
          {netBalance > 0 && <TrendingUp className="w-6 h-6 shrink-0" style={{ color: colors.mint }} />}
          {netBalance < 0 && <TrendingDown className="w-6 h-6 shrink-0" style={{ color: colors.amber }} />}
          <div>
            <p className="font-semibold" style={{ color: colors.text }}>
              {netBalance > 0 ? `Overall you are owed ₹${netBalance.toLocaleString('en-IN')}` : netBalance < 0 ? `Overall you owe ₹${Math.abs(netBalance).toLocaleString('en-IN')}` : 'All settled up ✅'}
            </p>
            {netBalance !== 0 && <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>Across {totalPeople} people</p>}
          </div>
        </motion.section>
      )}

      {isEmpty && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border p-8 text-center" style={{ background: colors.cardBg, borderColor: colors.cardBorder }}>
          <p className="text-4xl mb-4">🤝</p>
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>No IOUs tracked yet</h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: colors.textSecondary }}>UpiSense tracks money between friends automatically. Just tell it on WhatsApp — any phrasing works.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap text-left text-sm" style={{ color: colors.textSecondary }}>
            <div><p className="font-medium mb-1" style={{ color: colors.text }}>When someone owes you:</p><p>💬 &quot;Rohan owes me 500&quot;</p></div>
            <div><p className="font-medium mb-1" style={{ color: colors.text }}>When you owe someone:</p><p>💬 &quot;I owe Samkit 300&quot;</p></div>
            <div><p className="font-medium mb-1" style={{ color: colors.text }}>When settling up:</p><p>💬 &quot;Rohan returned my 500&quot;</p></div>
          </div>
          <div className="mt-8"><WhatsAppButton label="Message UpiSense on WhatsApp" /></div>
        </motion.div>
      )}

      {!isEmpty && (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">        <div
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
              <li className="py-6">
                <div className="rounded-xl border p-6 text-center" style={{ background: 'rgba(0,212,160,0.04)', borderColor: 'rgba(0,212,160,0.12)' }}>
                  <Users className="w-8 h-8 mx-auto mb-2" style={{ color: colors.mint }} />
                  <p className="font-medium mb-1" style={{ color: colors.text }}>Nobody owes you anything</p>
                  <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>Tell UpiSense when someone owes you money:</p>
                  <p className="text-sm mb-4 px-3 py-2 rounded-lg inline-block" style={{ background: colors.inputBg }}>&quot;Rohan owes me 500 for dinner&quot;</p>
                  <WhatsAppButton label="Add via WhatsApp" prefilledMessage="Rohan owes me 500" />
                </div>
              </li>
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
                      <p className="font-medium truncate flex items-center gap-1.5" style={{ color: colors.text }}>
                        {/^\d+$/.test(entry.person_name) ? (
                          <>
                            <span className="font-mono">{formatPhoneDisplay(entry.person_name)}</span>
                            <span className="text-[10px] font-normal" style={{ color: colors.textSecondary }}>(unknown)</span>
                            <a href={getWhatsAppUrl(`The name for ${entry.person_name} is `)} target="_blank" rel="noopener noreferrer" className="text-[10px]" style={{ color: colors.mint }}>Add name →</a>
                          </>
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
              <li className="py-6">
                <div className="rounded-xl border p-6 text-center" style={{ background: 'rgba(245,166,35,0.04)', borderColor: 'rgba(245,166,35,0.12)' }}>
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: colors.mint }} />
                  <p className="font-medium mb-1" style={{ color: colors.text }}>You don&apos;t owe anyone</p>
                  <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>Track when you borrow money from friends:</p>
                  <p className="text-sm px-3 py-2 rounded-lg inline-block" style={{ background: colors.inputBg }}>&quot;I owe Samkit 300 for Ola&quot;</p>
                </div>
              </li>
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
                      <p className="font-medium truncate flex items-center gap-1.5" style={{ color: colors.text }}>
                        {/^\d+$/.test(entry.person_name) ? (
                          <>
                            <span className="font-mono">{formatPhoneDisplay(entry.person_name)}</span>
                            <span className="text-[10px] font-normal" style={{ color: colors.textSecondary }}>(unknown)</span>
                            <a href={getWhatsAppUrl(`The name for ${entry.person_name} is `)} target="_blank" rel="noopener noreferrer" className="text-[10px]" style={{ color: colors.mint }}>Add name →</a>
                          </>
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
      </>
      )}
    </motion.div>
  );
}

import { motion } from 'framer-motion';

const MINT = '#00D4A0';
const AMBER = '#F5A623';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const CARD = '#111827';

const transactions = [
  { icon: '🍕', name: 'Swiggy', category: 'Food Delivery', time: '2 hrs ago', amount: 380 },
  { icon: '🚗', name: 'Ola', category: 'Transport', time: 'Yesterday', amount: 220 },
  { icon: '🛒', name: 'BigBasket', category: 'Groceries', time: '2 days ago', amount: 1840 },
  { icon: '🔧', name: 'Rajesh Kumar', category: 'Home Repair', time: '3 days ago', amount: 2500 },
];

const donutData = [
  { label: 'Food Delivery', value: 34, color: MINT },
  { label: 'Transport', value: 18, color: AMBER },
  { label: 'Shopping', value: 15, color: '#0EA5E9' },
  { label: 'Groceries', value: 12, color: '#A78BFA' },
  { label: 'Others', value: 21, color: MUTED },
];

export function DashboardPreview() {
  return (
    <section className="py-24 px-4 sm:px-6" style={{ background: CARD }}>
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-medium mb-4 uppercase tracking-wider"
          style={{ color: MINT }}
        >
          Your financial picture. Finally complete.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl overflow-hidden border shadow-2xl"
          style={{ background: '#0A0F1E', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,212,160,0.1)' }}
        >
          <div className="flex flex-col lg:flex-row min-h-[500px]">
            {/* Sidebar */}
            <aside className="w-full lg:w-56 p-4 border-b lg:border-b-0 lg:border-r border-white/10 flex lg:flex-col gap-4">
              <div className="flex items-center gap-2 font-bold" style={{ fontFamily: 'Clash Display, sans-serif', color: MINT }}>
                <span className="text-xl">U</span>
                <span style={{ color: TEXT }}>piSense</span>
              </div>
              <nav className="flex lg:flex-col gap-1 text-sm" style={{ color: MUTED }}>
                <span className="py-2 px-3 rounded-lg font-medium" style={{ background: 'rgba(0,212,160,0.15)', color: MINT }}>Dashboard</span>
                <span className="py-2 px-3 rounded-lg hover:bg-white/5">Transactions</span>
                <span className="py-2 px-3 rounded-lg hover:bg-white/5">Budgets</span>
                <span className="py-2 px-3 rounded-lg hover:bg-white/5">Insights</span>
                <span className="py-2 px-3 rounded-lg hover:bg-white/5">Settings</span>
              </nav>
              <div className="mt-auto flex items-center gap-2 pt-4 border-t border-white/10">
                <div className="w-8 h-8 rounded-full bg-white/20" />
                <div>
                  <p className="text-sm font-medium" style={{ color: TEXT }}>Priya M.</p>
                  <p className="text-xs" style={{ color: MINT }}>Pro Plan</p>
                </div>
              </div>
            </aside>

            {/* Main */}
            <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel 1 — bar chart */}
              <div className="lg:col-span-2 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h3 className="text-lg font-semibold mb-2" style={{ color: TEXT }}>October 2025 — ₹24,340 spent</h3>
                <div className="h-32 flex items-end gap-2 mt-4">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      className="flex-1 rounded-t"
                      style={{ background: i === 5 ? AMBER : MINT, minHeight: '8px' }}
                    />
                  ))}
                </div>
                <p className="text-sm mt-2" style={{ color: MUTED }}>23% higher than last month · Mostly weekends</p>
              </div>

              {/* Panel 2 — donut */}
              <div className="p-4 rounded-xl flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h3 className="text-lg font-semibold mb-4 w-full" style={{ color: TEXT }}>Spending by category</h3>
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {donutData.reduce((acc, d, i) => {
                      const prev = donutData.slice(0, i).reduce((s, x) => s + x.value, 0);
                      const dash = (d.value / 100) * 100;
                      const gap = 100 - dash;
                      return [
                        ...acc,
                        <circle
                          key={d.label}
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke={d.color}
                          strokeWidth="4"
                          strokeDasharray={`${dash} ${gap}`}
                          strokeDashoffset={-prev * (100 / 100)}
                        />,
                      ];
                    }, [])}
                  </svg>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {donutData.slice(0, 4).map((d) => (
                    <span key={d.label} className="text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Panel 3 — transactions */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: TEXT }}>Recent transactions</h3>
                <ul className="space-y-3">
                  {transactions.map((tx, i) => (
                    <motion.li
                      key={tx.name}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{tx.icon}</span>
                        <div>
                          <p className="text-sm font-medium" style={{ color: TEXT }}>{tx.name}</p>
                          <p className="text-xs" style={{ color: MUTED }}>{tx.category} · {tx.time}</p>
                        </div>
                      </div>
                      <span className="font-mono font-semibold tabular-nums" style={{ color: AMBER }}>-₹{tx.amount.toLocaleString('en-IN')}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Panel 4 — insight card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-4 rounded-xl border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(0,212,160,0.4)' }}
              >
                <h3 className="text-sm font-semibold mb-2" style={{ color: MINT }}>This week&apos;s insight</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: MUTED }}>
                  You spent 40% more on dining this week vs your monthly average. Most of it was Friday and Saturday nights. Want to set a weekend dining budget?
                </p>
                <button type="button" className="text-sm font-semibold" style={{ color: MINT }}>Set budget →</button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

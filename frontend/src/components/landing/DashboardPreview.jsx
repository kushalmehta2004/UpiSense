import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingDown, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, MessageCircle, Users, Share2 } from 'lucide-react';
import { colors } from '../../theme';

// Active segment shape: pops out 8px + glow (matches CategoryChart)
function renderPreviewActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  const RAD = Math.PI / 180;
  const innerR = Math.max(0, Number(innerRadius) || 0);
  const outerR = (Number(outerRadius) || 0) + 8;
  const x1 = cx + outerR * Math.cos(-startAngle * RAD);
  const y1 = cy + outerR * Math.sin(-startAngle * RAD);
  const x2 = cx + outerR * Math.cos(-endAngle * RAD);
  const y2 = cy + outerR * Math.sin(-endAngle * RAD);
  const x3 = cx + innerR * Math.cos(-endAngle * RAD);
  const y3 = cy + innerR * Math.sin(-endAngle * RAD);
  const x4 = cx + innerR * Math.cos(-startAngle * RAD);
  const y4 = cy + innerR * Math.sin(-startAngle * RAD);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const pathD = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  return (
    <path
      d={pathD}
      fill={fill}
      stroke="rgba(255,255,255,0.15)"
      strokeWidth={1.5}
      style={{
        filter: `drop-shadow(0 0 8px ${fill}99)`,
        transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    />
  );
}

const PREVIEW_CARD_BG = '#111827';
const PREVIEW_BORDER = 'rgba(255,255,255,0.06)';
const MINT = '#00D4A0';
const SEGMENT_COLORS = ['#00D4A0', '#0EA5E9', '#F5A623', '#8B5CF6', '#374151'];

const CARD_STYLE = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

const DEMO_STATS = {
  totalSpent: 24340,
  txnCount: 47,
  owedToMe: 2500,
  iOwe: 800,
};

const DEMO_DAILY = [
  { label: 'Mon 3', amount: 1200 },
  { label: 'Tue 4', amount: 3400 },
  { label: 'Wed 5', amount: 800 },
  { label: 'Thu 6', amount: 2100 },
  { label: 'Fri 7', amount: 4500 },
  { label: 'Sat 8', amount: 5200 },
  { label: 'Sun 9', amount: 3060 },
];

// Demo spending breakdown — same shape as CategoryChart chartData (with percent, _key)
const DEMO_DONUT_RAW = [
  { name: 'Food & Dining', value: 8200 },
  { name: 'Transport', value: 4100 },
  { name: 'Shopping', value: 3800 },
  { name: 'Groceries', value: 5200 },
  { name: 'Other', value: 3040 },
];
const DEMO_TOTAL = DEMO_DONUT_RAW.reduce((s, x) => s + x.value, 0);
const DEMO_CHART_DATA = DEMO_DONUT_RAW.map((item, i) => ({
  name: item.name,
  value: item.value,
  percent: item.value / DEMO_TOTAL,
  total: DEMO_TOTAL,
  fill: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
  _key: `preview-${i}-${item.name}`,
}));
const DEMO_DAILY_AVG = Math.round(DEMO_TOTAL / 28);

const focusDate = new Date();

export function DashboardPreview() {
  const [previewPieActiveIndex, setPreviewPieActiveIndex] = useState(null);
  return (
    <section className="py-24 px-4 sm:px-6" style={{ background: colors.pageBg }}>
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-medium mb-4 uppercase tracking-wider"
          style={{ color: colors.mint }}
        >
          Your financial picture. Finally complete.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl overflow-hidden border shadow-2xl p-6 sm:p-8 space-y-8"
          style={{
            background: colors.cardBg,
            borderColor: colors.cardBorder,
            boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* Page header — matches Dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
                Dashboard
              </h2>
              <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                You spent ₹{DEMO_STATS.totalSpent.toLocaleString('en-IN')} in {format(focusDate, 'MMMM yyyy')} across{' '}
                {DEMO_STATS.txnCount} transactions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg opacity-40" style={{ color: colors.textSecondary }}>←</span>
              <span className="min-w-[140px] text-center font-medium text-sm" style={{ color: colors.text }}>
                {format(focusDate, 'MMMM yyyy')}
              </span>
              <span className="p-2 rounded-lg opacity-40" style={{ color: colors.textSecondary }}>→</span>
            </div>
          </div>

          {/* Quick actions — matches QuickActionsBar */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Log a cash payment', icon: MessageCircle },
              { label: 'Track an IOU', icon: Users },
              { label: 'Forward a UPI notification', icon: Share2 },
            ].map((a) => (
              <span
                key={a.label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: colors.textSecondary,
                }}
              >
                <a.icon className="w-3.5 h-3.5" />
                {a.label}
              </span>
            ))}
          </div>

          {/* Row 1: Stat cards — matches Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Spent', value: `₹${DEMO_STATS.totalSpent.toLocaleString('en-IN')}`, sub: '↑ vs last month', icon: TrendingDown, iconBg: 'rgba(249,115,22,0.15)', iconColor: colors.orange },
              { label: 'Transactions', value: String(DEMO_STATS.txnCount), sub: '↑ vs last month', icon: ArrowLeftRight, iconBg: 'rgba(0,212,160,0.15)', iconColor: colors.mint },
              { label: 'Who Owes You', value: `₹${DEMO_STATS.owedToMe.toLocaleString('en-IN')}`, sub: '2 people', icon: ArrowDownLeft, iconBg: 'rgba(0,212,160,0.15)', iconColor: colors.mint },
              { label: 'You Owe', value: `₹${DEMO_STATS.iOwe.toLocaleString('en-IN')}`, sub: '1 person', icon: ArrowUpRight, iconBg: 'rgba(245,166,35,0.15)', iconColor: colors.amber },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border p-5"
                style={{ ...CARD_STYLE, borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: card.iconBg }}>
                  <card.icon className="w-5 h-5" style={{ color: card.iconColor }} />
                </div>
                <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>{card.label}</p>
                <p className="text-xl font-bold font-mono tabular-nums" style={{ color: colors.text }}>{card.value}</p>
                <p className="text-xs mt-1" style={{ color: card.iconColor === colors.orange ? colors.orange : colors.mint }}>{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Row 2: Charts — Daily Spend + Spending Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-6">
            {/* Daily Spend bar chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border p-6"
              style={{ ...CARD_STYLE }}
            >
              <h3 className="text-sm font-medium mb-4" style={{ color: colors.textSecondary }}>
                Daily Spend — {format(focusDate, 'MMM yyyy')}
              </h3>
              <div className="flex items-end gap-1.5 h-[224px]">
                {DEMO_DAILY.map((d, i) => {
                  const max = Math.max(...DEMO_DAILY.map((x) => x.amount));
                  const h = max > 0 ? (d.amount / max) * 100 : 0;
                  return (
                    <motion.div
                      key={d.label}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${Math.max(h, 8)}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04, duration: 0.4 }}
                      className="flex-1 rounded-t min-w-0"
                      style={{ background: 'linear-gradient(180deg, #0EA5E9 0%, #00D4A0 100%)', minHeight: 8 }}
                    />
                  );
                })}
              </div>
              <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>Mon–Sun</p>
            </motion.div>

            {/* Spending Breakdown — matches CategoryChart layout and styling */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-[20px] border p-5 md:p-7 transition-all duration-250"
              style={{ background: PREVIEW_CARD_BG, borderColor: PREVIEW_BORDER }}
            >
              <div className="flex items-center justify-between mb-6">
                <span
                  className="font-semibold text-base"
                  style={{ color: colors.text, fontFamily: 'Satoshi, system-ui, sans-serif' }}
                >
                  Spending Breakdown
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-6 mb-0">
                <div
                  className="flex justify-center md:justify-start shrink-0 relative"
                  style={{ width: 260, height: 260, margin: '0 auto' }}
                >
                  <ResponsiveContainer width={260} height={260}>
                    <PieChart>
                      <Pie
                        data={DEMO_CHART_DATA}
                        cx={130}
                        cy={130}
                        innerRadius={75}
                        outerRadius={110}
                        paddingAngle={3}
                        cornerRadius={4}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        nameKey="name"
                        isAnimationActive={false}
                        activeIndex={previewPieActiveIndex}
                        activeShape={renderPreviewActiveShape}
                        onMouseEnter={(_, index) => setPreviewPieActiveIndex(index)}
                        onMouseLeave={() => setPreviewPieActiveIndex(null)}
                      >
                        {DEMO_CHART_DATA.map((entry, i) => (
                          <Cell
                            key={entry._key}
                            fill={entry.fill}
                            stroke={PREVIEW_CARD_BG}
                            strokeWidth={2}
                            opacity={previewPieActiveIndex != null && previewPieActiveIndex !== i ? 0.35 : 1}
                            style={{ transition: 'opacity 200ms' }}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                  >
                    {previewPieActiveIndex !== null && DEMO_CHART_DATA[previewPieActiveIndex] ? (
                      <div className="text-center">
                        <p
                          className="text-2xl font-bold font-mono tabular-nums"
                          style={{ color: DEMO_CHART_DATA[previewPieActiveIndex].fill }}
                        >
                          ₹{DEMO_CHART_DATA[previewPieActiveIndex].value.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: 'Satoshi, system-ui, sans-serif' }}>
                          {DEMO_CHART_DATA[previewPieActiveIndex].name}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: '#4B5563', fontFamily: 'Satoshi, system-ui, sans-serif' }}>
                          {(DEMO_CHART_DATA[previewPieActiveIndex].percent * 100).toFixed(0)}% of total
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-[26px] font-bold font-mono tabular-nums" style={{ color: colors.text }}>
                          ₹{DEMO_TOTAL.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#6B7280', fontFamily: 'Satoshi, system-ui, sans-serif' }}>
                          total spent
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 md:max-w-[180px]">
                  <div className="grid grid-cols-1 gap-1">
                    {DEMO_CHART_DATA.map((item, i) => (
                      <div
                        key={item._key}
                        role="button"
                        tabIndex={0}
                        className="flex items-center gap-2.5 py-2 px-2 rounded-lg cursor-pointer transition-colors duration-200"
                        style={{
                          background: previewPieActiveIndex === i ? 'rgba(255,255,255,0.03)' : 'transparent',
                          fontFamily: 'Satoshi, system-ui, sans-serif',
                        }}
                        onMouseEnter={() => setPreviewPieActiveIndex(i)}
                        onMouseLeave={() => setPreviewPieActiveIndex(null)}
                        onFocus={() => setPreviewPieActiveIndex(i)}
                        onBlur={() => setPreviewPieActiveIndex(null)}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            background: item.fill,
                            boxShadow: previewPieActiveIndex === i ? `0 0 0 3px ${item.fill}40` : 'none',
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-[13px] truncate"
                            style={{ color: previewPieActiveIndex === i ? colors.text : '#D1D5DB' }}
                          >
                            {item.name}
                          </p>
                          <p className="text-xs font-mono tabular-nums" style={{ color: previewPieActiveIndex === i ? '#9CA3AF' : '#6B7280' }}>
                            ₹{item.value.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{
                            background: `${item.fill}1F`,
                            color: item.fill,
                            fontFamily: 'Satoshi, system-ui, sans-serif',
                          }}
                        >
                          {(item.percent * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div
                className="flex flex-col md:flex-row md:justify-evenly gap-4 md:gap-0 border-t mt-6 pt-4"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}
              >
                <div className="text-center md:text-left">
                  <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#4B5563', fontFamily: 'Satoshi, system-ui, sans-serif', letterSpacing: 1 }}>
                    Biggest spend
                  </p>
                  <p className="text-[13px] font-semibold" style={{ color: DEMO_CHART_DATA[0]?.fill ?? MINT, fontFamily: 'Satoshi, system-ui, sans-serif' }}>
                    {DEMO_CHART_DATA[0]?.name ?? '—'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#4B5563', fontFamily: 'Satoshi, system-ui, sans-serif', letterSpacing: 1 }}>
                    Transactions
                  </p>
                  <p className="text-[13px] font-semibold font-mono tabular-nums" style={{ color: colors.text }}>
                    {DEMO_STATS.txnCount}
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#4B5563', fontFamily: 'Satoshi, system-ui, sans-serif', letterSpacing: 1 }}>
                    Daily avg
                  </p>
                  <p className="text-[13px] font-semibold font-mono tabular-nums" style={{ color: MINT }}>
                    ₹{DEMO_DAILY_AVG.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}

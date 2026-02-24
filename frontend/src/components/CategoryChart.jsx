import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTransactionsSummary, useTransactions } from '../hooks/useTransactions';
import { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { colors } from '../theme';
import { WhatsAppButton } from './WhatsAppButton';
import { PieChart as PieChartIcon } from 'lucide-react';

const CARD_BG = '#111827';
const BORDER = 'rgba(255,255,255,0.06)';
const MINT = '#00D4A0';

// Segment colors in spec order (assign by sorted index)
const SEGMENT_COLORS = [
  '#00D4A0', // 1. Food & Dining - mint
  '#0EA5E9', // 2. Transport - sky blue
  '#F5A623', // 3. Shopping - amber
  '#8B5CF6', // 4. Groceries - purple
  '#F97316', // 5. Health - orange
  '#EC4899', // 6. Utilities - pink
  '#14B8A6', // 7. Home - teal
  '#A78BFA', // 8. Entertainment - lavender
  '#374151', // 9. Other - muted gray
];

function formatAmount(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function getDaysInMonth(from, to) {
  const start = new Date(from);
  const end = new Date(to);
  return Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
}

// Active segment shape: pops out 8px + glow
function renderActiveShape(props) {
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

// Count-up from 0 to value over 800ms
function useCountUp(value, enabled) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!enabled || value == null) return;
    const duration = 800;
    const start = Date.now();
    const startVal = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 2); // ease-out
      setDisplay(Math.round(startVal + (value - startVal) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, enabled]);
  return display;
}

export function CategoryChart({ from: fromProp, to: toProp }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [inView, setInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const now = new Date();
  const focusDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = fromProp || format(startOfMonth(focusDate), 'yyyy-MM-dd');
  const to = toProp || format(endOfMonth(focusDate), 'yyyy-MM-dd');

  const { summary, total, loading, error } = useTransactionsSummary({ from, to });
  const { pagination } = useTransactions({ page: 1, limit: 1, from, to });
  const transactionCount = pagination?.total ?? 0;
  const daysInMonth = getDaysInMonth(from, to);
  const dailyAvg = total > 0 && daysInMonth > 0 ? Math.round(total / daysInMonth) : 0;

  const countUpTotal = useCountUp(total, inView);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isEmpty = !loading && !error && Array.isArray(summary) && summary.length === 0;

  // Build chart data: sort by amount desc, add percent and fill
  const totalSum = Array.isArray(summary) ? summary.reduce((s, x) => s + (Number(x.amount) || 0), 0) : 0;
  const sorted = [...(summary || [])]
    .map((s) => ({ category: s.category || 'Other', amount: Number(s.amount) || 0 }))
    .sort((a, b) => b.amount - a.amount);
  const chartData = sorted.map((item, i) => ({
    name: item.category,
    value: item.amount,
    percent: totalSum > 0 ? item.amount / totalSum : 0,
    total: totalSum,
    fill: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    _key: `cat-${i}-${item.category}`,
  }));

  const topCategory = chartData[0];
  const topColor = topCategory?.fill || MINT;

  if (loading) {
    return (
      <div
        ref={cardRef}
        className="rounded-[20px] border p-7 flex items-center justify-center min-h-[420px] transition-all duration-250"
        style={{ background: CARD_BG, borderColor: BORDER }}
      >
        <div className="w-8 h-8 border-2 rounded-full border-t-transparent animate-spin" style={{ borderColor: MINT }} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-[20px] border p-7 flex items-center justify-center min-h-[320px] text-sm"
        style={{ background: CARD_BG, borderColor: BORDER, color: colors.orange }}
      >
        {error}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className="rounded-[20px] border p-7 flex flex-col items-center justify-center min-h-[360px] transition-all duration-250 hover:shadow-[0_0_0_1px_rgba(0,212,160,0.15)]"
        style={{ background: CARD_BG, borderColor: BORDER }}
      >
        <PieChartIcon className="w-12 h-12 mb-4" style={{ color: '#374151' }} />
        <p className="text-[15px] font-medium mb-1" style={{ color: '#6B7280', fontFamily: 'Satoshi, system-ui, sans-serif' }}>
          No data yet
        </p>
        <p className="text-[13px] mb-6 text-center" style={{ color: '#4B5563', fontFamily: 'Satoshi, system-ui, sans-serif' }}>
          Forward a UPI notification to see your breakdown
        </p>
        <WhatsAppButton label="Message UpiSense on WhatsApp" />
      </div>
    );
  }

  const chartSize = isMobile ? 200 : 260;
  const innerR = isMobile ? 60 : 75;
  const outerR = isMobile ? 88 : 110;

  return (
    <div
      ref={cardRef}
      className="h-full rounded-[20px] border p-5 md:p-7 transition-all duration-250 hover:shadow-[0_0_0_1px_rgba(0,212,160,0.15)]"
      style={{ background: CARD_BG, borderColor: BORDER }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between mb-6">
        <span
          className="font-semibold text-base"
          style={{ color: colors.text, fontFamily: 'Satoshi, system-ui, sans-serif' }}
        >
          Spending Breakdown
        </span>
      </div>

      {/* Chart + Legend */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-0">
        {/* Donut wrapper */}
        <div className="flex justify-center md:justify-start shrink-0 relative" style={{ width: chartSize, height: chartSize, margin: '0 auto' }}>
          <ResponsiveContainer width={chartSize} height={chartSize}>
            <PieChart>
              <Pie
                data={chartData}
                cx={chartSize / 2}
                cy={chartSize / 2}
                innerRadius={innerR}
                outerRadius={outerR}
                paddingAngle={3}
                cornerRadius={4}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                nameKey="name"
                isAnimationActive={inView}
                animationBegin={(_, i) => (inView ? i * 60 : 0)}
                animationDuration={400}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={entry._key}
                    fill={entry.fill}
                    stroke={CARD_BG}
                    strokeWidth={2}
                    opacity={activeIndex != null && activeIndex !== i ? 0.35 : 1}
                    style={{ transition: 'opacity 200ms' }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center content */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ transition: 'opacity 150ms' }}
          >
            {activeIndex !== null && chartData[activeIndex] ? (
              <div className="text-center">
                <p
                  className="text-2xl md:text-[24px] font-bold font-mono tabular-nums"
                  style={{ color: chartData[activeIndex].fill }}
                >
                  ₹{chartData[activeIndex].value.toLocaleString('en-IN')}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: 'Satoshi, system-ui, sans-serif' }}>
                  {chartData[activeIndex].name}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: '#4B5563', fontFamily: 'Satoshi, system-ui, sans-serif' }}>
                  {(chartData[activeIndex].percent * 100).toFixed(0)}% of total
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-[26px] md:text-[26px] font-bold font-mono tabular-nums" style={{ color: colors.text }}>
                  ₹{countUpTotal.toLocaleString('en-IN')}
                </p>
                <p className="text-xs mt-1" style={{ color: '#6B7280', fontFamily: 'Satoshi, system-ui, sans-serif' }}>
                  total spent
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div
          className="flex-1 min-w-0 md:max-w-[180px] md:max-h-[280px] overflow-y-auto pr-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: `${MINT} #374151`,
          }}
        >
          <div className={`grid gap-1 ${isMobile ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {chartData.map((item, i) => (
              <div
                key={item._key}
                role="button"
                tabIndex={0}
                className="flex items-center gap-2.5 py-2 px-2 rounded-lg cursor-pointer transition-colors duration-200"
                style={{
                  background: activeIndex === i ? 'rgba(255,255,255,0.03)' : 'transparent',
                  fontFamily: 'Satoshi, system-ui, sans-serif',
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'translateX(0)' : 'translateX(10px)',
                  transition: `opacity 300ms ease-out, transform 300ms ease-out`,
                  transitionDelay: `${200 + i * 80}ms`,
                }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(i)}
                onBlur={() => setActiveIndex(null)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: item.fill,
                    boxShadow: activeIndex === i ? `0 0 0 3px ${item.fill}40` : 'none',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[13px] truncate"
                    style={{ color: activeIndex === i ? colors.text : '#D1D5DB' }}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs font-mono tabular-nums" style={{ color: activeIndex === i ? '#9CA3AF' : '#6B7280' }}>
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

      {/* Bottom summary bar */}
      <div
        className="flex flex-col md:flex-row md:justify-evenly gap-4 md:gap-0 border-t mt-6 pt-4"
        style={{ borderColor: 'rgba(255,255,255,0.04)' }}
      >
        <div className="text-center md:text-left">
          <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#4B5563', fontFamily: 'Satoshi, system-ui, sans-serif', letterSpacing: 1 }}>
            Biggest spend
          </p>
          <p className="text-[13px] font-semibold" style={{ color: topColor, fontFamily: 'Satoshi, system-ui, sans-serif' }}>
            {topCategory?.name ?? '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#4B5563', fontFamily: 'Satoshi, system-ui, sans-serif', letterSpacing: 1 }}>
            Transactions
          </p>
          <p className="text-[13px] font-semibold font-mono tabular-nums" style={{ color: colors.text }}>
            {transactionCount}
          </p>
        </div>
        <div className="text-center md:text-right">
          <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#4B5563', fontFamily: 'Satoshi, system-ui, sans-serif', letterSpacing: 1 }}>
            Daily avg
          </p>
          <p className="text-[13px] font-semibold font-mono tabular-nums" style={{ color: MINT }}>
            {formatAmount(dailyAvg)}
          </p>
        </div>
      </div>
    </div>
  );
}

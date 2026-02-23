import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDailyTrend } from '../hooks/useTransactions';
import { format } from 'date-fns';
import { colors } from '../theme';

function formatAmount(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-xl border"
      style={{
        background: colors.inputBg,
        borderColor: 'rgba(0,212,160,0.3)',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <p className="text-xs" style={{ color: colors.textSecondary }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: colors.mint }}>{formatAmount(item.value)}</p>
    </div>
  );
};

export function WeeklyTrend({ days = 7 }) {
  const { trend, loading, error } = useDailyTrend(days);

  if (loading) {
    return (
      <div
        className="h-64 flex items-center justify-center rounded-2xl border animate-pulse"
        style={{ background: colors.cardBg, borderColor: colors.cardBorder }}
      >
        <div className="w-8 h-8 border-2 rounded-full border-t-transparent" style={{ borderColor: colors.mint }} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="h-64 flex items-center justify-center rounded-2xl border text-sm"
        style={{ background: colors.cardBg, borderColor: colors.cardBorder, color: colors.orange }}
      >
        {error}
      </div>
    );
  }

  const chartData = trend.map((d) => ({
    ...d,
    label: format(new Date(d.date), 'EEE d'),
  }));
  const maxAmount = Math.max(...trend.map((d) => d.amount), 1);

  return (
    <div
      className="rounded-2xl border p-6 transition-all duration-200 hover:border-[rgba(0,212,160,0.2)] hover:-translate-y-0.5"
      style={{ background: colors.cardBg, borderColor: colors.cardBorder, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
    >
      <h3 className="text-sm font-medium mb-4" style={{ color: colors.textSecondary }}>Daily Spend — Last {days} Days</h3>
      <div className="w-full overflow-hidden" style={{ width: '100%', height: 224, minHeight: 224, minWidth: 1 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: colors.textSecondary }}
              axisLine={{ stroke: colors.cardBorder }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: colors.textSecondary, fontFamily: 'JetBrains Mono, monospace' }}
              tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,212,160,0.08)' }} />
            <Bar
              dataKey="amount"
              fill={`url(#barGradient)`}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              animationDuration={500}
              animationBegin={0}
              isAnimationActive
            />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={colors.blue} stopOpacity={0.4} />
                <stop offset="100%" stopColor={colors.mint} stopOpacity={1} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

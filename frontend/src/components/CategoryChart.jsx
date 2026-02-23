import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTransactionsSummary } from '../hooks/useTransactions';
import { useState } from 'react';
import { colors } from '../theme';

function formatAmount(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

const CATEGORY_PALETTE = [
  colors.mint,
  colors.blue,
  colors.amber,
  colors.purple,
  colors.orange,
  colors.gray,
];

const CustomTooltip = ({ active, payload }) => {
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
      <p className="text-sm font-medium" style={{ color: colors.text }}>{item.name}</p>
      <p className="text-sm font-semibold" style={{ color: colors.mint }}>{formatAmount(item.value)}</p>
    </div>
  );
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  const RAD = Math.PI / 180;
  const outerR = outerRadius + 8;
  const x1 = cx + outerR * Math.cos(-startAngle * RAD);
  const y1 = cy + outerR * Math.sin(-startAngle * RAD);
  const x2 = cx + outerR * Math.cos(-endAngle * RAD);
  const y2 = cy + outerR * Math.sin(-endAngle * RAD);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  return (
    <path
      d={pathD}
      fill={fill}
      stroke="rgba(255,255,255,0.1)"
      strokeWidth={2}
      style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
    />
  );
};

export function CategoryChart({ from, to }) {
  const { summary, total, loading, error } = useTransactionsSummary({ from, to });
  const [activeIndex, setActiveIndex] = useState(null);

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

  const top5 = summary.slice(0, 5);
  const otherSum = summary.slice(5).reduce((s, x) => s + x.amount, 0);
  const data = top5.map((s) => ({ name: s.category, value: s.amount }));
  if (otherSum > 0) {
    data.push({ name: 'Other', value: otherSum });
  }

  if (data.length === 0) {
    return (
      <div
        className="h-64 flex items-center justify-center rounded-2xl border text-sm"
        style={{ background: colors.cardBg, borderColor: colors.cardBorder, color: colors.textSecondary }}
      >
        No spending data for this period
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-6 transition-all duration-200 hover:border-[rgba(0,212,160,0.2)] hover:-translate-y-0.5"
      style={{ background: colors.cardBg, borderColor: colors.cardBorder, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
    >
      <h3 className="text-sm font-medium mb-4" style={{ color: colors.textSecondary }}>Category Breakdown</h3>
      <div className="w-full flex flex-col items-center" style={{ height: 280 }}>
        <div className="relative w-full flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                animationBegin={0}
                animationDuration={600}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]}
                    className="cursor-pointer"
                    stroke={colors.cardBg}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center mt-3">
          <span className="text-2xl font-bold font-mono tabular-nums" style={{ color: colors.text }}>
            {formatAmount(total)}
          </span>
          <br />
          <span className="text-xs" style={{ color: colors.textSecondary }}>Total spent</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
        {data.map((d, i) => (
          <span key={d.name} className="text-xs flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }}
            />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}

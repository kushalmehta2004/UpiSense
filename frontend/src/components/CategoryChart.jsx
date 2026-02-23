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
      className="rounded-lg px-3 py-2 shadow-xl border transition-opacity duration-150 ease-out"
      style={{
        background: colors.inputBg,
        borderColor: 'rgba(0,212,160,0.35)',
        fontFamily: 'JetBrains Mono, monospace',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <p className="text-sm font-medium" style={{ color: colors.text }}>{item.name}</p>
      <p className="text-sm font-semibold" style={{ color: colors.mint }}>{formatAmount(item.value)}</p>
    </div>
  );
};

// Subtle hover: small expansion + soft shadow for a polished feel
const HOVER_OFFSET = 5;
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  const RAD = Math.PI / 180;
  const innerR = Math.max(0, innerRadius - 2);
  const outerR = outerRadius + HOVER_OFFSET;
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
      stroke="rgba(255,255,255,0.2)"
      strokeWidth={1.5}
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
        transformOrigin: `${cx}px ${cy}px`,
      }}
      className="transition-all duration-200 ease-out"
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
  // Use index-based keys so duplicate category names (e.g. multiple "Other") don't conflict
  const dataWithKeys = data.map((d, i) => ({ ...d, _key: `cat-${i}-${d.name}` }));

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
      <div className="w-full flex flex-col items-center overflow-hidden" style={{ height: 280, minHeight: 280, minWidth: 1 }}>
        <div className="relative w-full" style={{ width: '100%', height: 200, minHeight: 200, minWidth: 1 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <PieChart>
              <Pie
                data={dataWithKeys}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                animationBegin={0}
                animationDuration={400}
                isAnimationActive
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {dataWithKeys.map((entry, i) => (
                  <Cell
                    key={entry._key}
                    fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]}
                    className="cursor-pointer transition-opacity duration-200"
                    stroke={colors.cardBg}
                    strokeWidth={2}
                    opacity={activeIndex != null && activeIndex !== i ? 0.55 : 1}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} cursor={false} />
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
        {dataWithKeys.map((d, i) => (
          <span key={d._key} className="text-xs flex items-center gap-1.5">
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

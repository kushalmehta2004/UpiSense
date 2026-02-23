import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTransactionsSummary } from '../hooks/useTransactions';
import { useState } from 'react';

const COLORS = [
  '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4',
  '#0f766e', '#134e4a', '#0d9488', '#0f766e', '#14b8a6',
];

function formatAmount(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-slate-800 text-white text-sm rounded-lg shadow-lg px-3 py-2 border-0">
      <p className="font-semibold">{item.name}</p>
      <p className="text-teal-300">{formatAmount(item.value)}</p>
    </div>
  );
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  const RAD = Math.PI / 180;
  const x1 = cx + outerRadius * Math.cos(-startAngle * RAD);
  const y1 = cy + outerRadius * Math.sin(-startAngle * RAD);
  const x2 = cx + outerRadius * Math.cos(-endAngle * RAD);
  const y2 = cy + outerRadius * Math.sin(-endAngle * RAD);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  return (
    <path
      d={pathD}
      fill={fill}
      stroke="white"
      strokeWidth={3}
      style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }}
    />
  );
};

export function CategoryChart({ from, to }) {
  const { summary, total, loading, error } = useTransactionsSummary({ from, to });
  const [activeIndex, setActiveIndex] = useState(null);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center bg-red-50 rounded-2xl text-red-600 text-sm border border-red-100">
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
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-500 text-sm border border-slate-200">
        No spending data for this period
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
      <h3 className="font-semibold text-slate-800 mb-4">Category Breakdown</h3>
      <div className="w-full" style={{ height: 256, minHeight: 256 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
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
                  fill={COLORS[i % COLORS.length]}
                  className="cursor-pointer"
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span className="text-slate-700">{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-sm text-slate-600 mt-2">
        Total: <span className="font-bold text-teal-600">{formatAmount(total)}</span>
      </p>
    </div>
  );
}

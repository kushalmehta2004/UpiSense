import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTransactionsSummary } from '../hooks/useTransactions';

const COLORS = [
  '#0d9488', '#4ECDC4', '#64748b', '#94a3b8', '#cbd5e1',
  '#0f766e', '#5eead4', '#2dd4bf', '#99f6e4', '#14b8a6',
];

function formatAmount(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function CategoryChart({ from, to }) {
  const { summary, total, loading, error } = useTransactionsSummary({ from, to });

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-[#e2e8f0]">
        <div className="animate-spin w-8 h-8 border-2 border-[#0d9488] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center bg-red-50 rounded-2xl text-red-600 text-sm">
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
      <div className="h-64 flex items-center justify-center bg-[#f8fafb] rounded-2xl text-[#64748b] text-sm">
        No spending data for this period
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm">
      <h3 className="font-semibold text-[#0f172a] mb-4">Category Breakdown</h3>
      <div className="w-full" style={{ height: 256, minHeight: 256 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatAmount(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-sm text-[#64748b] mt-2">
        Total: <span className="font-semibold text-[#0f172a]">{formatAmount(total)}</span>
      </p>
    </div>
  );
}

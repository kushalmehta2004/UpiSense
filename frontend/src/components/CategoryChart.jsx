import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTransactionsSummary } from '../hooks/useTransactions';

const COLORS = [
  '#00a651', '#4ECDC4', '#FF6B6B', '#FFE66D', '#AA96DA',
  '#95E1D3', '#F38181', '#6C5CE7', '#FD79A8', '#00B894',
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
      <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-100">
        <div className="animate-spin w-8 h-8 border-2 border-[#00a651] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center bg-red-50 rounded-xl text-red-600">
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
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl text-slate-600">
        No spending data for this period
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <h3 className="font-semibold text-slate-800 mb-4">Category Breakdown</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
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
      <p className="text-center text-sm text-slate-500 mt-2">
        Total: <span className="font-semibold text-slate-800">{formatAmount(total)}</span>
      </p>
    </div>
  );
}

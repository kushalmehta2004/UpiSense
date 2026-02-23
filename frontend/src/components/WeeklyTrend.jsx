import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDailyTrend } from '../hooks/useTransactions';
import { format } from 'date-fns';

function formatAmount(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function WeeklyTrend({ days = 7 }) {
  const { trend, loading, error } = useDailyTrend(days);

  if (loading) {
    return (
      <div className="h-56 flex items-center justify-center bg-white rounded-2xl border border-[#e2e8f0]">
        <div className="animate-spin w-8 h-8 border-2 border-[#0d9488] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-56 flex items-center justify-center bg-red-50 rounded-2xl text-red-600 text-sm">
        {error}
      </div>
    );
  }

  const chartData = trend.map((d) => ({
    ...d,
    label: format(new Date(d.date), 'EEE d'),
  }));

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm">
      <h3 className="font-semibold text-[#0f172a] mb-4">Daily Spend (Last {days} days)</h3>
      <div className="w-full" style={{ height: 224, minHeight: 224 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
            <Tooltip formatter={(v) => formatAmount(v)} labelFormatter={(_, items) => items?.[0]?.payload?.date} />
            <Bar dataKey="amount" fill="#0d9488" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

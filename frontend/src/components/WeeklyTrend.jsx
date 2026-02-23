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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-slate-800 text-white text-sm rounded-lg shadow-lg px-3 py-2 border-0">
      <p className="text-slate-300">{label}</p>
      <p className="text-teal-300 font-semibold">{formatAmount(item.value)}</p>
    </div>
  );
};

export function WeeklyTrend({ days = 7 }) {
  const { trend, loading, error } = useDailyTrend(days);

  if (loading) {
    return (
      <div className="h-56 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-56 flex items-center justify-center bg-red-50 rounded-2xl text-red-600 text-sm border border-red-100">
        {error}
      </div>
    );
  }

  const chartData = trend.map((d) => ({
    ...d,
    label: format(new Date(d.date), 'EEE d'),
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
      <h3 className="font-semibold text-slate-800 mb-4">Daily Spend (Last {days} days)</h3>
      <div className="w-full" style={{ height: 224, minHeight: 224 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `₹${v / 1000}k`} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(13, 148, 136, 0.08)' }} />
            <Bar
              dataKey="amount"
              fill="#0d9488"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              animationDuration={500}
              animationBegin={0}
              isAnimationActive
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

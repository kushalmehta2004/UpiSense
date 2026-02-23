import { format, subDays, startOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useTransactions } from '../hooks/useTransactions';
import { useEffect, useState } from 'react';
import { categories } from '../utils/api';

const TIME_PRESETS = [
  { value: '', label: 'All time', from: null, to: null },
  { value: 'week', label: 'This week', getRange: () => ({ from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { value: 'month', label: 'This month', getRange: () => ({ from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { value: '3months', label: 'Last 3 months', getRange: () => ({ from: format(subMonths(new Date(), 3), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { value: '6months', label: 'Last 6 months', getRange: () => ({ from: format(subMonths(new Date(), 6), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { value: 'custom', label: 'Custom', from: null, to: null },
];

function formatAmount(amount) {
  if (amount == null) return '—';
  const n = parseFloat(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function TransactionItem({ txn }) {
  const date = txn.timestamp || txn.created_at;
  return (
    <div
      key={txn.id}
      className="flex justify-between items-start p-4 bg-white rounded-xl border border-[#e2e8f0] hover:border-[#cbd5e1] transition-colors"
    >
      <div>
        <p className="font-semibold text-[#0f172a]">{txn.merchant_name || 'Unknown'}</p>
        <p className="text-sm text-[#64748b]">{txn.category || 'Uncategorized'}</p>
        {txn.notes && (
          <p className="text-sm text-[#475569] mt-0.5 italic">&quot;{txn.notes}&quot;</p>
        )}
        {date && (
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {format(new Date(date), 'MMM d, yyyy · h:mm a')}
          </p>
        )}
      </div>
      <p className="font-bold text-[#0f172a]">{formatAmount(txn.amount)}</p>
    </div>
  );
}

export function TransactionFeed({ compact = false }) {
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [timePreset, setTimePreset] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryOptions, setCategoryOptions] = useState([]);

  const preset = TIME_PRESETS.find((p) => p.value === timePreset);
  const range = preset?.getRange ? preset.getRange() : timePreset === 'custom' ? { from: customFrom || undefined, to: customTo || undefined } : { from: undefined, to: undefined };

  const { transactions, pagination, loading, error } = useTransactions({
    page,
    limit: 20,
    category: categoryFilter || undefined,
    from: range.from,
    to: range.to,
    search: search || undefined,
  });

  useEffect(() => {
    categories.list().then(({ data }) => {
      if (data?.categories) setCategoryOptions(data.categories);
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault?.();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setPage(1);
  };

  const handleTimePresetChange = (e) => {
    setTimePreset(e.target.value);
    setPage(1);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-xl text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search merchant, category..."
              className="flex-1 px-4 py-2 rounded-xl border border-[#e2e8f0] focus:ring-2 focus:ring-[#0d9488] focus:border-[#0d9488] outline-none text-[#0f172a]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#f1f5f9] text-[#475569] rounded-xl hover:bg-[#e2e8f0] transition-colors font-medium"
            >
              Search
            </button>
          </form>
          <select
            value={categoryFilter}
            onChange={handleCategoryChange}
            className="px-4 py-2 rounded-xl border border-[#e2e8f0] focus:ring-2 focus:ring-[#0d9488] outline-none text-[#0f172a] min-w-[140px]"
          >
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c.id || c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <select
            value={timePreset}
            onChange={handleTimePresetChange}
            className="px-4 py-2 rounded-xl border border-[#e2e8f0] focus:ring-2 focus:ring-[#0d9488] outline-none text-[#0f172a] min-w-[140px]"
          >
            {TIME_PRESETS.filter((p) => p.value !== 'custom').map((p) => (
              <option key={p.value || 'all'} value={p.value}>{p.label}</option>
            ))}
            <option value="custom">Custom range</option>
          </select>
        </div>
        {timePreset === 'custom' && (
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <label className="text-[#64748b]">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => { setCustomFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#0d9488] outline-none"
            />
            <label className="text-[#64748b]">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => { setCustomTo(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#0d9488] outline-none"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#0d9488] border-t-transparent rounded-full" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-[#e2e8f0] text-[#64748b]">
          No transactions in this period. Forward a UPI payment to your WhatsApp number to get started.
        </div>
      ) : (
        <div className={`space-y-3 ${compact ? 'max-h-80 overflow-y-auto' : ''}`}>
          {transactions.map((txn) => (
            <TransactionItem key={txn.id} txn={txn} />
          ))}
        </div>
      )}

      {!compact && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-[#e2e8f0] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f8fafb] text-[#0f172a]"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-[#64748b]">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="px-4 py-2 rounded-xl border border-[#e2e8f0] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f8fafb] text-[#0f172a]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

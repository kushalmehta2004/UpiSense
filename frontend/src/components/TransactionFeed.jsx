import { format } from 'date-fns';
import { useTransactions } from '../hooks/useTransactions';
import { useEffect, useState } from 'react';
import { categories } from '../utils/api';

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
      className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
    >
      <div>
        <p className="font-semibold text-slate-800">{txn.merchant_name || 'Unknown'}</p>
        <p className="text-sm text-slate-500">{txn.category || 'Uncategorized'}</p>
        {date && (
          <p className="text-xs text-slate-400 mt-0.5">
            {format(new Date(date), 'MMM d, yyyy · h:mm a')}
          </p>
        )}
      </div>
      <p className="font-bold text-slate-800">{formatAmount(txn.amount)}</p>
    </div>
  );
}

export function TransactionFeed({ compact = false }) {
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryOptions, setCategoryOptions] = useState([]);

  const { transactions, pagination, loading, error } = useTransactions({
    page,
    limit: 20,
    category: categoryFilter || undefined,
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

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-xl text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search merchant or category..."
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#00a651] focus:border-transparent outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            Search
          </button>
        </form>
        <select
          value={categoryFilter}
          onChange={handleCategoryChange}
          className="px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#00a651] outline-none"
        >
          <option value="">All categories</option>
          {categoryOptions.map((c) => (
            <option key={c.id || c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#00a651] border-t-transparent rounded-full" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-600">
          No transactions yet. Forward a UPI payment to your WhatsApp number to get started.
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
            className="px-4 py-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-slate-600">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="px-4 py-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

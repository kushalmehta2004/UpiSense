import { format, startOfWeek, startOfMonth, subMonths } from 'date-fns';
import { useTransactions } from '../hooks/useTransactions';
import { useEffect, useState } from 'react';
import { Search, Zap, Banknote } from 'lucide-react';
import { categories } from '../utils/api';
import { colors, getCategoryColor, getWhatsAppUrl } from '../theme';

function isCashTxn(txn) {
  const s = (txn.source_app || '').toLowerCase();
  return s === 'whatsapp' || s === 'unified_agent';
}

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

const CATEGORY_EMOJI = {
  'Food & Dining': '🍽️',
  'Food Delivery': '🍕',
  Transport: '🚗',
  Shopping: '🛍️',
  Groceries: '🛒',
  Health: '💊',
  Utilities: '💡',
  Other: '📌',
};

function TransactionItem({ txn, cardStyle = false }) {
  const date = txn.timestamp || txn.created_at;
  const catColor = getCategoryColor(txn.category);
  const emoji = CATEGORY_EMOJI[txn.category] || '📌';
  const cash = isCashTxn(txn);

  const content = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
          style={{ background: `${catColor}20` }}
        >
          {emoji}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold truncate" style={{ color: colors.text, fontSize: 15 }}>
              {txn.merchant_name || 'Unknown'}
            </p>
            <span
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded shrink-0"
              style={{
                background: cash ? 'rgba(245,166,35,0.12)' : 'rgba(0,212,160,0.12)',
                color: cash ? colors.amber : colors.mint,
                fontFamily: 'Satoshi, DM Sans, sans-serif',
              }}
            >
              {cash ? <Banknote className="w-2 h-2" /> : <Zap className="w-2 h-2" />}
              {cash ? 'Cash' : 'UPI'}
            </span>
          </div>
          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full mt-0.5"
            style={{ background: `${catColor}25`, color: catColor }}
          >
            {txn.category || 'Uncategorized'}
          </span>
          {date && (
            <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              {format(new Date(date), 'MMM d · h:mm a')}
            </p>
          )}
        </div>
      </div>
      <p className="font-mono font-bold tabular-nums shrink-0" style={{ color: colors.orange, fontSize: cardStyle ? 18 : 15 }}>
        -{formatAmount(txn.amount)}
      </p>
    </>
  );

  if (cardStyle) {
    return (
      <div
        className="flex justify-between items-center py-4 px-5 rounded-xl border transition-all duration-200 hover:border-[rgba(0,212,160,0.15)] hover:-translate-y-px"
        style={{
          background: colors.cardBg,
          borderColor: 'rgba(255,255,255,0.04)',
          borderLeftWidth: cash ? 3 : 1,
          borderLeftColor: cash ? 'rgba(245,166,35,0.3)' : undefined,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className="flex justify-between items-center py-4 border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.02]"
      style={{
        paddingLeft: 4,
        paddingRight: 4,
        borderLeft: cash ? '3px solid rgba(245,166,35,0.3)' : undefined,
      }}
    >
      {content}
    </div>
  );
}

function CashEmptyState() {
  const examples = [
    'I paid 200 to the auto driver',
    'Paid 800 cash at pharmacy',
    'Spent 500 at the vegetable market',
  ];
  return (
    <div
      className="p-8 text-center rounded-xl border"
      style={{ background: colors.cardBg, borderColor: colors.cardBorder }}
    >
      <Banknote className="w-12 h-12 mx-auto mb-4" style={{ color: colors.mint }} />
      <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>No cash payments logged yet</h3>
      <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
        Paid someone in cash? Just tell UpiSense on WhatsApp:
      </p>
      <div className="space-y-2 max-w-xs mx-auto mb-6 text-left">
        {examples.map((msg) => (
          <div
            key={msg}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: colors.inputBg, color: colors.textSecondary }}
          >
            &quot;{msg}&quot;
          </div>
        ))}
      </div>
      <a
        href={getWhatsAppUrl('I paid ')}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold"
        style={{ background: '#25D366', color: 'white' }}
      >
        Message UpiSense on WhatsApp
      </a>
    </div>
  );
}

export function TransactionFeed({ compact = false }) {
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
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

  const filteredBySource =
    sourceFilter === 'cash'
      ? transactions.filter(isCashTxn)
      : sourceFilter === 'upi'
        ? transactions.filter((t) => !isCashTxn(t))
        : transactions;
  const showFilters = !compact;
  const list = compact ? transactions.slice(0, 5) : filteredBySource;
  const isCashFilterEmpty = !compact && sourceFilter === 'cash' && list.length === 0 && !loading;

  useEffect(() => {
    categories.list().then(({ data }) => {
      if (data?.categories) setCategoryOptions(data.categories);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

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
      <div
        className="p-4 rounded-xl text-sm border"
        style={{ background: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.3)', color: colors.orange }}
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-col gap-3">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textSecondary }} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={() => setSearch(searchInput)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-colors focus:ring-2"
                style={{
                  background: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                }}
                placeholder="Search merchant, category..."
              />
            </div>
            <select
              value={categoryFilter}
              onChange={handleCategoryChange}
              className="px-4 py-2.5 rounded-xl border outline-none min-w-[140px] focus:ring-2"
              style={{
                background: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            >
              <option value="">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c.id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <select
              value={timePreset}
              onChange={handleTimePresetChange}
              className="px-4 py-2.5 rounded-xl border outline-none min-w-[140px] focus:ring-2"
              style={{
                background: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            >
              {TIME_PRESETS.filter((p) => p.value !== 'custom').map((p) => (
                <option key={p.value || 'all'} value={p.value}>{p.label}</option>
              ))}
              <option value="custom">Custom range</option>
            </select>
            {!compact && (
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 rounded-xl border outline-none min-w-[140px] focus:ring-2"
                style={{
                  background: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                }}
              >
                <option value="">All sources</option>
                <option value="upi">UPI payments</option>
                <option value="cash">Cash payments</option>
              </select>
            )}
          </form>
          {timePreset === 'custom' && (
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <label style={{ color: colors.textSecondary }}>From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => { setCustomFrom(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-lg border outline-none focus:ring-2"
                style={{ background: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }}
              />
              <label style={{ color: colors.textSecondary }}>To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => { setCustomTo(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-lg border outline-none focus:ring-2"
                style={{ background: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }}
              />
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div
            className="animate-spin w-8 h-8 border-2 rounded-full border-t-transparent"
            style={{ borderColor: colors.mint }}
          />
        </div>
      ) : isCashFilterEmpty ? (
        <CashEmptyState />
      ) : list.length === 0 ? (
        <div
          className="p-8 text-center rounded-xl border"
          style={{ background: colors.cardBg, borderColor: colors.cardBorder, color: colors.textSecondary }}
        >
          No transactions in this period. Forward a UPI payment to your WhatsApp number to get started.
        </div>
      ) : (
        <div className={compact ? 'space-y-0' : 'space-y-2'}>
          {list.map((txn) => (
            <TransactionItem key={txn.id} txn={txn} cardStyle={!compact} />
          ))}
        </div>
      )}

      {!compact && pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }}
          >
            Previous
          </button>
          <span className="px-4 py-2" style={{ color: colors.textSecondary }}>
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="px-4 py-2 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

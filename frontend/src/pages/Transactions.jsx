import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { TransactionFeed } from '../components/TransactionFeed';
import { colors } from '../theme';

export function Transactions() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
          All Transactions
        </h1>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors"
          style={{ borderColor: colors.mint, color: colors.mint }}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
      <TransactionFeed compact={false} />
    </motion.div>
  );
}

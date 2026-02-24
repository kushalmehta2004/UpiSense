import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { Footer } from '../components/landing/Footer';
import { colors } from '../theme';
import { Check, Sparkles } from 'lucide-react';

const MINT = colors.mint;
const DARK = colors.pageBg;

const freeFeatures = [
  'Forward UPI notifications from any app (GPay, PhonePe, Paytm, etc.)',
  'Track cash payments in plain English',
  'IOU & debt tracking (who owes me / I owe)',
  'Personal dashboard with spending breakdown',
  'Category-wise monthly budgets & alerts',
  'Weekly reports via WhatsApp',
  'AI-powered categorization',
  'Data stored in India',
];

const proFeatures = [
  'Everything in Free',
  'Unlimited transactions (when limits apply)',
  'Export transactions (CSV)',
  'Priority support',
  'Advanced insights (coming later)',
];

export function Pricing() {
  return (
    <div className="min-h-screen" style={{ background: DARK }}>
      <LandingNav />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
              style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}
            >
              Simple, transparent pricing
            </h1>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: colors.textSecondary }}>
              UpiSense is built to help you see where your money goes — without the hassle.
            </p>

            {/* Current status: free for everyone */}
            <div
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border-2 mb-10"
              style={{
                background: 'rgba(0,212,160,0.08)',
                borderColor: MINT,
                color: colors.text,
              }}
            >
              <Sparkles className="w-5 h-5 shrink-0" style={{ color: MINT }} />
              <span className="font-semibold">We are currently free</span>
            </div>
            <p className="text-sm max-w-md mx-auto mb-2" style={{ color: colors.textSecondary }}>
              There are no paid plans yet. Everyone gets full access. When we introduce paid tiers, existing users will be notified in advance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Free plan */}
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border-2 p-6 lg:p-8 flex flex-col"
              style={{
                background: colors.cardBg,
                borderColor: MINT,
                boxShadow: '0 0 0 1px rgba(0,212,160,0.15)',
              }}
            >
              <div className="mb-6">
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{ background: 'rgba(0,212,160,0.15)', color: MINT }}
                >
                  Current plan
                </span>
                <h2 className="text-2xl font-bold mt-4" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
                  Free
                </h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold" style={{ color: colors.text }}>₹0</span>
                  <span className="text-sm" style={{ color: colors.textSecondary }}>/ month</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1">
                {freeFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: colors.textSecondary }}>
                    <Check className="w-5 h-5 shrink-0 mt-0.5" style={{ color: MINT }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="mt-8 w-full py-3.5 rounded-xl font-semibold text-center transition-colors hover:opacity-90"
                style={{ background: MINT, color: DARK }}
              >
                Get started free →
              </Link>
            </motion.article>

            {/* Pro plan (future) */}
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border p-6 lg:p-8 flex flex-col opacity-90"
              style={{
                background: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
            >
              <div className="mb-6">
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: colors.textSecondary }}
                >
                  Coming later
                </span>
                <h2 className="text-2xl font-bold mt-4" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
                  Pro
                </h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold" style={{ color: colors.text }}>₹99</span>
                  <span className="text-sm" style={{ color: colors.textSecondary }}>/ month</span>
                </div>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  When we launch paid plans. Prices in INR, GST inclusive.
                </p>
              </div>
              <ul className="space-y-3 flex-1">
                {proFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: colors.textSecondary }}>
                    <Check className="w-5 h-5 shrink-0 mt-0.5" style={{ color: MINT }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled
                className="mt-8 w-full py-3.5 rounded-xl font-semibold text-center cursor-not-allowed opacity-60"
                style={{ background: colors.inputBg, color: colors.textSecondary, border: `1px solid ${colors.cardBorder}` }}
              >
                Not available yet
              </button>
            </motion.article>
          </div>

          <p className="text-center text-sm mt-10" style={{ color: colors.textSecondary }}>
            Questions? <Link to="/contact" className="font-medium hover:opacity-90" style={{ color: MINT }}>Contact us</Link>
            {' or '}
            <Link to="/faq" className="font-medium hover:opacity-90" style={{ color: MINT }}>see the FAQ</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

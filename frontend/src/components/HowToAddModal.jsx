import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WhatsAppButton } from './WhatsAppButton';
import { getWhatsAppUrl } from '../theme';
import { WhatsAppBubble } from './WhatsAppBubble';
import { colors } from '../theme';

const CASH_EXAMPLES = [
  'I paid 200 to auto',
  'paid 500 cash at doctor',
  'spent 1500 at kirana store',
  '80 to chaiwala',
];

const IOU_EXAMPLES = [
  'Rohan owes me 500',
  'I owe Samkit 300 for dinner',
  'Priya returned 200',
  'I paid back Ravi',
];

export function HowToAddModal({ type, onClose }) {
  if (!type) return null;

  const isCash = type === 'cash';
  const isIOU = type === 'iou';
  const isUPI = type === 'upi';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] rounded-[20px] border p-8 shadow-2xl"
        style={{
          background: colors.cardBg,
          borderColor: 'rgba(0,212,160,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: colors.textSecondary }}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {isCash && (
          <>
            <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
              Log a cash payment
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              Send any of these to UpiSense on WhatsApp:
            </p>
            <div className="space-y-2 mb-4">
              {CASH_EXAMPLES.map((msg) => (
                <WhatsAppBubble key={msg} message={msg} sender="user" />
              ))}
            </div>
            <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
              UpiSense figures out the amount, who you paid, and the category.
            </p>
            <WhatsAppButton prefilledMessage="I paid " label="Open WhatsApp" />
          </>
        )}

        {isIOU && (
          <>
            <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
              Track who owes who
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              Tell UpiSense on WhatsApp — any phrasing works:
            </p>
            <div className="space-y-2 mb-4">
              {IOU_EXAMPLES.map((msg) => (
                <WhatsAppBubble key={msg} message={msg} sender="user" />
              ))}
            </div>
            <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
              View all balances on your Debts page.
            </p>
            <div className="flex flex-wrap gap-3">
              <WhatsAppButton label="Open WhatsApp" />
              <Link
                to="/debts"
                onClick={onClose}
                className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-semibold transition-colors"
                style={{ borderColor: colors.mint, color: colors.mint }}
              >
                Go to Debts →
              </Link>
            </div>
          </>
        )}

        {isUPI && (
          <>
            <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
              Forward a UPI notification
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm mb-6" style={{ color: colors.textSecondary }}>
              <li>Make any UPI payment (GPay, PhonePe, Paytm, any bank UPI)</li>
              <li>Long-press the payment notification on your phone</li>
              <li>Tap Share → Forward to UpiSense on WhatsApp</li>
            </ol>
            <WhatsAppButton label="Open WhatsApp" />
          </>
        )}
      </div>
    </div>
  );
}

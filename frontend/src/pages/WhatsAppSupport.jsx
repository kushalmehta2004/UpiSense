import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { LandingNav } from '../components/landing/LandingNav';
import { Footer } from '../components/landing/Footer';
import { colors, getWhatsAppUrl } from '../theme';

const MINT = '#00D4A0';

const tips = [
  'Forward UPI payment messages from GPay, PhonePe, Paytm, or your bank app to this number.',
  'You can also type expenses in plain English, e.g. "paid 200 to chaiwala" or "spent 800 at kirana store".',
  'For debts: "Rohan owes me 500", "I owe Priya 300", or "Rohan paid me back".',
  'Replies are usually instant. If you do not get a response, check your internet and try again.',
];

export function WhatsAppSupport() {
  const supportUrl = getWhatsAppUrl('Hi, I need help with UpiSense.');
  return (
    <div className="min-h-screen" style={{ background: colors.pageBg }}>
      <LandingNav />
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(0,212,160,0.15)' }}
          >
            <MessageCircle className="w-8 h-8" style={{ color: MINT }} />
          </div>
          <h1
            className="text-4xl font-bold tracking-tight mb-3"
            style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}
          >
            WhatsApp support
          </h1>
          <p className="text-lg mb-10" style={{ color: colors.textSecondary }}>
            Chat with UpiSense on WhatsApp for help, to log expenses, or to ask anything about your account.
          </p>
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold transition-all hover:shadow-[0_0_24px_rgba(0,212,160,0.3)]"
            style={{ background: '#25D366', color: 'white' }}
          >
            <MessageCircle className="w-5 h-5" />
            Open WhatsApp chat
          </a>
          <div className="mt-14 text-left">
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              Quick tips
            </h2>
            <ul className="space-y-3">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${MINT}20`, color: MINT }}>
                    {i + 1}
                  </span>
                  <p className="text-[15px] leading-relaxed" style={{ color: colors.textSecondary }}>
                    {tip}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-10 text-sm" style={{ color: colors.textSecondary }}>
            Prefer email?{' '}
            <Link to="/contact" className="font-medium hover:opacity-90" style={{ color: MINT }}>
              Contact us
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

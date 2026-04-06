import { Link } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { Footer } from '../components/landing/Footer';
import { colors } from '../theme';

const MINT = '#00D4A0';
const faqs = [
  {
    q: 'What is UpiSense?',
    a: 'UpiSense is a personal finance assistant that tracks your spending automatically. You forward UPI payment notifications to UpiSense on WhatsApp, or type expenses in plain English, and it categorises them and shows you a clear breakdown on your dashboard.',
  },
  {
    q: 'How do I add my transactions?',
    a: 'You can (1) Forward UPI payment messages from GPay, PhonePe, Paytm, or any bank app to UpiSense on WhatsApp. Or (2) Type in plain English, e.g. "paid 150 to chaiwala" or "spent 800 at kirana store", and we parse and log it.',
  },
  {
    q: 'Which UPI apps are supported?',
    a: 'Any app that sends a payment confirmation (GPay, PhonePe, Paytm, BHIM, or your bank UPI). As long as you can forward that message to WhatsApp, UpiSense can capture it.',
  },
  {
    q: 'Can I track cash payments?',
    a: 'Yes. Just tell UpiSense in plain English, e.g. "200 for parking", "paid 500 to plumber", or "spent 150 at tea stall". No special format needed.',
  },
  {
    q: 'How does the IOU / debt tracking work?',
    a: 'Say things like "Rohan owes me 500" or "I owe Priya 300 for Ola" on WhatsApp. UpiSense keeps a running tally. When someone pays back, say "Rohan paid me back" and the balance updates. View everything on the Debts page.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We use industry-standard encryption and store data securely. Your data is processed and stored in India and we comply with applicable data protection requirements.',
  },
  {
    q: 'How do I get early access or sign up?',
    a: 'Click "Get early access" on the homepage to join the waitlist with your email. We’ll invite you when onboarding opens.',
  },
];

export function FAQ() {
  return (
    <div className="min-h-screen" style={{ background: colors.pageBg }}>
      <LandingNav />
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-4xl font-bold tracking-tight mb-2"
            style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}
          >
            Frequently asked questions
          </h1>
          <p className="text-lg mb-12" style={{ color: colors.textSecondary }}>
            Everything you need to know about UpiSense.
          </p>
          <ul className="space-y-8">
            {faqs.map((faq, i) => (
              <li key={i}>
                <h2 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
                  {faq.q}
                </h2>
                <p className="text-[15px] leading-relaxed" style={{ color: colors.textSecondary }}>
                  {faq.a}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-12 text-sm" style={{ color: colors.textSecondary }}>
            Still have questions?{' '}
            <Link to="/contact" className="font-medium hover:opacity-90" style={{ color: MINT }}>
              Contact us
            </Link>
            {' or '}
            <Link to="/whatsapp-support" className="font-medium hover:opacity-90" style={{ color: MINT }}>
              get help on WhatsApp
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

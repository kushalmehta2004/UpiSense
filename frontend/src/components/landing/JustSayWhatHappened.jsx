import { motion } from 'framer-motion';
import { WhatsAppBubble } from '../WhatsAppBubble';

const MINT = '#00D4A0';
const AMBER = '#F5A623';
const BLUE = '#0EA5E9';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const CARD = '#111827';

const cards = [
  {
    badge: '🔁 Auto-captured',
    badgeColor: MINT,
    title: 'Forward UPI notifications',
    body: 'When GPay, PhonePe, or Paytm sends you a payment confirmation, long-press and forward it to UpiSense on WhatsApp. Done.',
    examples: [
      { who: 'user', text: '[forwarded] Paid ₹380 to Zomato via GPay. UPI Ref: 409234' },
      { who: 'bot', text: '🍔 ₹380 · Zomato · Food Delivery' },
    ],
    footer: 'Works with: GPay · PhonePe · Paytm · BHIM · Bank UPI apps',
    topBorder: MINT,
  },
  {
    badge: '💵 Just type it',
    badgeColor: AMBER,
    title: 'Log cash payments',
    body: 'No UPI notification? No problem. Just tell UpiSense what you spent in plain English — it figures out the rest.',
    examples: [
      { who: 'user', text: 'paid 150 to chaiwala' },
      { who: 'bot', text: '☕ ₹150 · Tea Stall · Food & Dining' },
      { who: 'user', text: 'spent 800 at kirana store' },
      { who: 'bot', text: '🛒 ₹800 · Kirana Store · Groceries' },
      { who: 'user', text: '200 for parking' },
      { who: 'bot', text: '🅿️ ₹200 · Parking · Transport' },
    ],
    footer: 'No formatting needed. No amount prefix needed. Just talk.',
    topBorder: AMBER,
  },
  {
    badge: '🤝 Auto-balanced',
    badgeColor: BLUE,
    title: 'Track who owes who',
    body: 'Split a dinner? Lend someone money? Tell UpiSense — it keeps a running tally and updates automatically when someone pays back.',
    examples: [
      { who: 'user', text: 'Rohan owes me 500 for concert tickets' },
      { who: 'bot', text: 'Noted! Rohan owes you ₹500 🎫' },
      { who: 'user', text: 'I owe Priya 300 for Ola' },
      { who: 'bot', text: 'Got it. You owe Priya ₹300 🚗' },
      { who: 'user', text: 'Rohan paid me back' },
      { who: 'bot', text: "Updated! Rohan's balance: ₹0 ✅" },
    ],
    footer: 'Balances update automatically. See everything in your Debts page.',
    topBorder: BLUE,
  },
];

export function JustSayWhatHappened() {
  return (
    <section className="py-24 px-4 sm:px-6" style={{ background: '#0A0F1E' }}>
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl font-bold text-center mb-4"
          style={{ fontFamily: 'Clash Display, sans-serif', color: TEXT }}
        >
          Just say what happened.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-lg max-w-[600px] mx-auto mb-16"
          style={{ color: MUTED }}
        >
          UpiSense understands plain English. No forms, no categories to pick, no buttons to tap. Type it the way you&apos;d tell a friend.
        </motion.p>
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border-t-4 p-7"
              style={{
                background: CARD,
                border: '1px solid rgba(255,255,255,0.06)',
                borderTopColor: card.topBorder,
              }}
            >
              <span
                className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4"
                style={{ background: `${card.badgeColor}20`, color: card.badgeColor }}
              >
                {card.badge}
              </span>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Clash Display, sans-serif', color: TEXT }}>
                {card.title}
              </h3>
              <p className="text-sm mb-4" style={{ color: MUTED }}>{card.body}</p>
              <div className="space-y-1.5 mb-4">
                {card.examples.map((ex, j) => (
                  <WhatsAppBubble key={j} message={ex.text} sender={ex.who} />
                ))}
              </div>
              <p className="text-xs" style={{ color: MUTED }}>{card.footer}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';
import { Smartphone, Share2, LayoutDashboard, MessageSquare } from 'lucide-react';

const MINT = '#00D4A0';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const CARD = '#111827';

const steps = [
  {
    title: 'Make a UPI payment',
    body: 'Pay normally through any UPI app. GPay, PhonePe, Paytm, BHIM — anything. Nothing changes on your end.',
    Icon: Smartphone,
    note: null,
  },
  {
    title: 'Forward a notification — or just type it',
    body: 'Get a UPI notification? Forward it. Paid in cash? Just type what happened. Track IOUs? Same thing. UpiSense reads plain English.',
    Icon: Share2,
    note: 'Works exactly the same on iPhone and Android',
  },
  {
    title: 'See it on your dashboard',
    body: 'Your dashboard updates in under 10 seconds. Categorized, tracked, explained.',
    Icon: LayoutDashboard,
    note: 'Gets smarter every week.',
  },
  {
    title: 'Works for cash and IOUs too',
    body: "Paid someone in cash? Type it. Friend owes you money? Type it. UpiSense understands plain English — it doesn't care how you phrase it.",
    Icon: MessageSquare,
    note: '"paid 200 to auto" · "Ravi owes me 500" · "I paid back Deepa"',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6" style={{ background: '#0A0F1E' }}>
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl font-bold text-center mb-4"
          style={{ fontFamily: 'Clash Display, sans-serif', color: TEXT }}
        >
          Three taps. Full picture.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-lg mb-16"
          style={{ color: MUTED }}
        >
          Total setup time: 4 minutes. Total effort per transaction: 2 taps.
        </motion.p>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 border-t border-dashed border-white/20" style={{ left: '12.5%', right: '12.5%' }} />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
            {steps.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6" style={{ background: CARD, border: `1px solid ${MINT}40` }}>
                  <item.Icon className="w-10 h-10" style={{ color: MINT }} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Clash Display, sans-serif', color: TEXT }}>{item.title}</h3>
                <p className="text-sm leading-relaxed mb-2" style={{ color: MUTED }}>{item.body}</p>
                {item.note && (
                  <p className="text-xs" style={{ color: MINT }}>{item.note}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';
import { Zap, Brain, BarChart3, Bell } from 'lucide-react';

const MINT = '#00D4A0';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const CARD = '#111827';

const chatMessages = [
  { who: 'user', text: '[forwarded] Paid ₹340 to Zomato' },
  { who: 'bot', text: 'Logged! 🍔 ₹340 · Zomato · Food Delivery' },
  { who: 'user', text: '[forwarded] Paid ₹15,000 to Preethi Sharma@paytm' },
  { who: 'bot', text: 'Who was this to? 1️⃣ Rent  2️⃣ Personal  3️⃣ Other' },
  { who: 'user', text: '1 Rent' },
  { who: 'bot', text: 'Got it! Preethi Sharma@paytm = Rent. I\'ll never ask again 🏠' },
  { who: 'bot', text: '📊 Your week in numbers:\n₹8,240 spent · 14 transactions\nTop: Food (₹2,840) · Transport (₹1,200)\nYou spent ₹940 more than last week.\nFull breakdown → upisense.app/dashboard' },
];

const features = [
  { Icon: Zap, title: 'Instant confirmation', desc: 'Every transaction confirmed in seconds' },
  { Icon: Brain, title: 'Learns your merchants', desc: 'Ask once, remember forever' },
  { Icon: BarChart3, title: 'Weekly briefing', desc: 'Every Sunday, your financial week in plain English' },
  { Icon: Bell, title: 'Budget alerts', desc: 'Hit 85% of your budget? We\'ll tell you before you overspend' },
];

export function WhatsAppMagic() {
  return (
    <section className="py-24 px-4 sm:px-6" style={{ background: '#0A0F1E' }}>
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
        {/* Left — WhatsApp chat */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl overflow-hidden border p-4"
          style={{ background: CARD, borderColor: 'rgba(0,212,160,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/30 flex items-center justify-center">
              <span className="text-lg">💬</span>
            </div>
            <div>
              <p className="font-semibold" style={{ color: TEXT }}>UpiSense</p>
              <p className="text-xs" style={{ color: MUTED }}>WhatsApp</p>
            </div>
          </div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {chatMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`flex ${msg.who === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] px-4 py-2 rounded-2xl text-sm whitespace-pre-line ${msg.who === 'user' ? 'rounded-br-md bg-white/10' : 'rounded-bl-md'}`}
                  style={msg.who === 'bot' ? { background: 'linear-gradient(135deg, rgba(0,212,160,0.2) 0%, rgba(14,165,233,0.15) 100%)', color: TEXT } : {}}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — features */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold mb-6"
            style={{ fontFamily: 'Clash Display, sans-serif', color: TEXT }}
          >
            All in WhatsApp. No new app to install.
          </motion.h2>
          <div className="space-y-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,212,160,0.15)' }}>
                  <f.Icon className="w-6 h-6" style={{ color: MINT }} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: TEXT }}>{f.title}</h3>
                  <p className="text-sm" style={{ color: MUTED }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-sm"
            style={{ color: MUTED }}
          >
            Works on iPhone. Works on any Android. Works with every UPI app.
          </motion.p>
          <div className="flex flex-wrap gap-4 mt-3">
            {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay'].map((app) => (
              <span key={app} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5" style={{ color: MUTED }}>{app}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

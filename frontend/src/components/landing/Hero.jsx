import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const MINT = '#00D4A0';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';

const TAB_UPI = [
  { who: 'user', text: 'Forwarded: Paid ₹450 to Swiggy via GPay' },
  { who: 'bot', text: 'Got it! 🍕\n₹450 · Swiggy · Food Delivery\nlogged to your dashboard' },
  { who: 'user', text: 'Paid ₹1,200 to Rajesh Kumar@ybl' },
  { who: 'bot', text: 'Who was this payment to?\n1️⃣ Home repair  2️⃣ Personal  3️⃣ Business' },
  { who: 'user', text: '1' },
  { who: 'bot', text: "Got it! I'll remember Rajesh Kumar@ybl as Home Repair forever 🏠" },
];

const TAB_CASH = [
  { who: 'user', text: 'I paid 100 to Ramesh for vegetables' },
  { who: 'bot', text: 'Logged! 🥦 ₹100 · Ramesh · Groceries' },
  { who: 'user', text: 'Paid 500 cash at the medical store' },
  { who: 'bot', text: 'Got it! 💊 ₹500 · Medical Store · Health' },
  { who: 'user', text: 'Spent 200 on auto' },
  { who: 'bot', text: 'Done! 🚗 ₹200 · Auto Rickshaw · Transport' },
];

const TAB_IOU = [
  { who: 'user', text: 'Rohan owes me 300 for dinner' },
  { who: 'bot', text: "Added! I've noted that Rohan owes you ₹300 💰" },
  { who: 'user', text: 'I owe Samkit 500' },
  { who: 'bot', text: "Got it. You owe Samkit ₹500. I'll track this for you." },
  { who: 'user', text: 'Samkit returned my 500' },
  { who: 'bot', text: "Updated! Samkit's balance is now ₹0. All settled ✅" },
];

const TABS = [
  { id: 'upi', label: 'Forward UPI', lines: TAB_UPI },
  { id: 'cash', label: 'Log Cash', lines: TAB_CASH },
  { id: 'iou', label: 'Track IOUs', lines: TAB_IOU },
];

export function Hero() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveTab((a) => (a + 1) % TABS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const current = TABS[activeTab];

  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 px-4 sm:px-6 pt-24 pb-16 overflow-hidden" style={{ background: '#0A0F1E' }}>
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: MINT }} />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-15 blur-3xl" style={{ background: '#F5A623' }} />

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        <div className="flex-1 lg:max-w-[60%] space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium"
            style={{ borderColor: MINT, background: 'rgba(0,212,160,0.08)', color: MINT }}
          >
            ✦ Works on iPhone & Android
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-[80px] font-bold leading-[1.05] tracking-[-0.03em]"
            style={{ fontFamily: 'Clash Display, sans-serif', color: TEXT }}
          >
            Your UPI money,<br />
            <span className="italic" style={{ color: MINT }}>finally</span><br />
            explained.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl max-w-[480px]"
            style={{ fontFamily: 'Satoshi, DM Sans, sans-serif', color: MUTED }}
          >
            Forward one notification. Know exactly where your money went. No app install. No bank login. No manual entry. Ever.
          </motion.p>

          {/* Tab switcher */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap gap-2"
          >
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(i)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-b-2"
                style={{
                  color: activeTab === i ? TEXT : MUTED,
                  background: activeTab === i ? 'rgba(0,212,160,0.1)' : 'transparent',
                  borderBottomColor: activeTab === i ? MINT : 'transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              to="/login"
              className="inline-flex items-center justify-center h-14 px-8 rounded-full text-base font-semibold transition-all hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(0,212,160,0.4)]"
              style={{ background: MINT, color: '#0A0F1E' }}
            >
              Start tracking free →
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 h-14 px-6 rounded-full border border-white/20 text-base font-medium transition-colors hover:bg-white/5"
              style={{ color: TEXT }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: MINT }} />
              See how it works ↓
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-4 text-sm"
            style={{ color: MUTED }}
          >
            <p className="mb-2">₹2.4 crore tracked · 8,200+ transactions · Works on GPay, PhonePe, Paytm, BHIM</p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0F1E] bg-slate-500" title="User" />
                ))}
              </div>
              <span>Join 340 early users</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative flex-1 flex justify-center lg:justify-end"
        >
          <div className="relative">
            <div className="absolute -inset-8 rounded-3xl opacity-40 blur-3xl" style={{ background: MINT }} />
            <div className="relative w-[280px] sm:w-[320px] bg-[#111827] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden" style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
              <div className="h-8 bg-[#1f2937] flex items-center justify-center">
                <div className="w-20 h-1.5 rounded-full bg-white/20" />
              </div>
              <div className="p-3 space-y-2 min-h-[400px] bg-[#0d1117]">
                <AnimatePresence mode="wait">
                  {current.lines.map((line, i) => (
                    <motion.div
                      key={`${activeTab}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${line.who === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs whitespace-pre-line ${line.who === 'user' ? 'rounded-bl-md bg-white/10' : 'rounded-br-md'}`}
                        style={line.who === 'bot' ? { background: 'linear-gradient(135deg, rgba(0,212,160,0.25) 0%, rgba(14,165,233,0.2) 100%)', color: TEXT } : { color: TEXT }}
                      >
                        {line.text}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
              className="absolute -bottom-6 -left-4 right-4 sm:left-auto sm:right-0 sm:-right-8 w-48 p-4 rounded-2xl border shadow-xl"
              style={{ background: '#111827', borderColor: 'rgba(0,212,160,0.3)', transform: 'rotate(-3deg)' }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: MUTED }}>October spending</p>
              <p className="text-lg font-bold font-mono" style={{ color: '#F5A623' }}>₹18,450</p>
              <div className="w-full h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '65%', background: MINT }} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

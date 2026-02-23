import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

const MINT = '#00D4A0';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const CARD = '#111827';

const salaryAmounts = [72400, 85600, 92100, 67800, 105000, 81200];

function AnimatedSalary() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [amount, setAmount] = useState(salaryAmounts[0]);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const id = setInterval(() => {
      setAmount(salaryAmounts[i % salaryAmounts.length]);
      i++;
    }, 2000);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <span ref={ref} className="tabular-nums font-mono font-bold" style={{ color: MINT }}>
      ₹{amount.toLocaleString('en-IN')}
    </span>
  );
}

const problems = [
  {
    title: 'SMS trackers don\'t work on iPhone',
    body: 'Every existing app reads SMS. iOS blocks that completely. If you have an iPhone, you\'ve been ignored.',
    icon: '❌',
    visual: 'iPhone + red X over SMS',
  },
  {
    title: 'Apps can\'t figure out who you paid',
    body: 'Paid a plumber named Ramesh Kumar? Every app tags it "Uncategorized". Forever. UpiSense asks once, remembers always.',
    icon: '❌',
    visual: 'UPI ID → ✓',
  },
  {
    title: 'You get data. Not insight.',
    body: 'Knowing you spent ₹24,000 doesn\'t tell you why or what to do about it. We speak English, not pie charts.',
    icon: '❌',
    visual: 'Bar chart vs WhatsApp insight',
  },
];

export function Problem() {
  return (
    <section className="py-24 px-4 sm:px-6" style={{ background: CARD }}>
      <div className="max-w-5xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight mb-16"
          style={{ fontFamily: 'Clash Display, sans-serif', color: TEXT }}
        >
          Every month, <AnimatedSalary /> disappears.
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-left p-6 rounded-2xl border-l-4 bg-[#0A0F1E]/60"
              style={{ borderLeftColor: MINT }}
            >
              <span className="text-2xl mb-3 block" style={{ color: MINT }}>{item.icon}</span>
              <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Clash Display, sans-serif', color: TEXT }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{item.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

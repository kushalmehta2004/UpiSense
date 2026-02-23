import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

const MINT = '#00D4A0';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';

const testimonials = [
  {
    quote: "I've tried every budgeting app. They all died after a week. UpiSense is the first one that actually fits how I live.",
    author: 'Arjun M.',
    role: 'Product Manager, Bangalore',
  },
  {
    quote: "Finally something that works on my iPhone. I've been waiting for this since UPI became my main payment method.",
    author: 'Sneha R.',
    role: 'Designer, Mumbai',
  },
  {
    quote: "The WhatsApp bot figured out all my regular vendors in the first week. Now I don't have to do anything — it just knows.",
    author: 'Karthik S.',
    role: 'Freelancer, Chennai',
  },
];

function CountUp({ end, suffix = '', duration = 1.5, decimals = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(decimals > 0 ? 0 : 0);

  useEffect(() => {
    if (!inView) return;
    const endVal = typeof end === 'number' ? end : 0;
    const startTime = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - startTime) / (duration * 1000), 1);
      const v = endVal * t;
      setValue(decimals > 0 ? Number(v.toFixed(decimals)) : Math.round(v));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration, decimals]);

  if (typeof end === 'number') {
    return <span ref={ref}>{value}{suffix}</span>;
  }
  return <span ref={ref}>{end}{suffix}</span>;
}

export function SocialProof() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % testimonials.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="py-24 px-4 sm:px-6" style={{ background: '#0A0F1E' }}>
      <div className="max-w-4xl mx-auto text-center">
        <span className="text-[120px] leading-none block mb-4" style={{ color: MINT, fontFamily: 'Georgia, serif' }}>&ldquo;</span>
        <div className="min-h-[180px] relative">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              initial={false}
              animate={{ opacity: active === i ? 1 : 0, y: active === i ? 0 : 10 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col justify-center"
            >
              <p className="text-xl sm:text-2xl font-medium leading-relaxed mb-6" style={{ fontFamily: 'Satoshi, DM Sans, sans-serif', color: TEXT }}>
                {t.quote}
              </p>
              <p className="text-sm" style={{ color: MUTED }}>
                — {t.author}, {t.role}
              </p>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{ background: active === i ? MINT : 'rgba(255,255,255,0.3)' }}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-20">
          <div>
            <p className="text-3xl sm:text-4xl font-bold font-mono tabular-nums" style={{ color: MINT }}><CountUp end={2.4} suffix="Cr+" decimals={1} /></p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Tracked</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold font-mono tabular-nums" style={{ color: MINT }}><CountUp end={8200} />+</p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Transactions</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold font-mono tabular-nums" style={{ color: MINT }}><CountUp end={94} />%</p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Accuracy</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold font-mono tabular-nums" style={{ color: MINT }}><CountUp end={340} />+</p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Users</p>
          </div>
        </div>
      </div>
    </section>
  );
}

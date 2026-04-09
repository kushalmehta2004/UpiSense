import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const MINT = '#00D4A0';
const DARK = '#0A0F1E';

export function EarlyAccessCTA({ onOpenWaitlist }) {
  const navigate = useNavigate();

  const handleGetStartedClick = () => {
    if (onOpenWaitlist) {
      onOpenWaitlist();
      return;
    }
    navigate('/login');
  };

  return (
    <section
      id="pricing"
      className="py-24 px-4 sm:px-6"
      style={{ background: 'linear-gradient(135deg, #00D4A0 0%, #0EA5E9 100%)' }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl lg:text-[56px] font-bold mb-6"
          style={{ fontFamily: 'Clash Display, sans-serif', color: DARK }}
        >
          Start tracking for free.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-lg mb-8"
          style={{ color: 'rgba(10,15,30,0.85)' }}
        >
          No credit card. No app install. Just forward your next UPI notification and see it on your dashboard in 10 seconds.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
        >
          <input
            type="tel"
            placeholder="Enter your WhatsApp number"
            className="flex-1 min-w-0 px-5 py-4 rounded-full border-2 border-[#0A0F1E]/20 bg-white/90 text-[#0A0F1E] placeholder:text-[#0A0F1E]/60 font-medium outline-none focus:border-[#0A0F1E]/50"
          />
          <button
            type="button"
            onClick={handleGetStartedClick}
            className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold bg-[#0A0F1E] text-white hover:bg-[#111827] transition-colors shadow-lg"
          >
            Get started free →
          </button>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-2 text-sm mb-2"
          style={{ color: 'rgba(10,15,30,0.8)' }}
        >
          <Lock className="w-4 h-4" />
          We don&apos;t store your raw messages. Read our privacy policy.
        </motion.p>
        
        <p className="text-sm" style={{ color: 'rgba(10,15,30,0.7)' }}>
          Join 340 people who already know where their money goes.
        </p>
      </div>
    </section>
  );
}

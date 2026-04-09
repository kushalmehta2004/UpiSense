import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useScroll, useTransform, motion } from 'framer-motion';
import { LandingNav } from '../components/landing/LandingNav';
import { Hero } from '../components/landing/Hero';
import { Problem } from '../components/landing/Problem';
import { HowItWorks } from '../components/landing/HowItWorks';
import { JustSayWhatHappened } from '../components/landing/JustSayWhatHappened';
import { DashboardPreview } from '../components/landing/DashboardPreview';
import { WhatsAppMagic } from '../components/landing/WhatsAppMagic';
import { Categories } from '../components/landing/Categories';
import { EarlyAccessCTA } from '../components/landing/EarlyAccessCTA';
import { Footer } from '../components/landing/Footer';
import { WaitlistModal } from '../components/landing/WaitlistModal';

const MINT = '#00D4A0';

export function Landing() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const location = useLocation();
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  useEffect(() => {
    const hash = location.hash?.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen" style={{ background: '#0A0F1E' }}>
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 z-[100] origin-left"
        style={{ scaleX, background: MINT }}
      />
      <LandingNav onOpenWaitlist={() => setWaitlistOpen(true)} />
      <main>
        <Hero onOpenWaitlist={() => setWaitlistOpen(true)} />
        <Problem />
        <HowItWorks />
        <JustSayWhatHappened />
        <DashboardPreview />
        <WhatsAppMagic />
        <Categories />
        <EarlyAccessCTA onOpenWaitlist={() => setWaitlistOpen(true)} />
        <Footer />
      </main>
      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </div>
  );
}

import { useScroll, useTransform, motion } from 'framer-motion';
import { LandingNav } from '../components/landing/LandingNav';
import { Hero } from '../components/landing/Hero';
import { Problem } from '../components/landing/Problem';
import { HowItWorks } from '../components/landing/HowItWorks';
import { DashboardPreview } from '../components/landing/DashboardPreview';
import { WhatsAppMagic } from '../components/landing/WhatsAppMagic';
import { Categories } from '../components/landing/Categories';
import { SocialProof } from '../components/landing/SocialProof';
import { EarlyAccessCTA } from '../components/landing/EarlyAccessCTA';
import { Footer } from '../components/landing/Footer';

const MINT = '#00D4A0';

export function Landing() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="min-h-screen" style={{ background: '#0A0F1E' }}>
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 z-[100] origin-left"
        style={{ scaleX, background: MINT }}
      />
      <LandingNav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <DashboardPreview />
        <WhatsAppMagic />
        <Categories />
        <SocialProof />
        <EarlyAccessCTA />
        <Footer />
      </main>
    </div>
  );
}

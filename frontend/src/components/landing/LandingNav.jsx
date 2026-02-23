import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const MINT = '#00D4A0';
const DARK = '#0A0F1E';
const TEXT = '#F9FAFB';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-white/5 transition-all duration-300 ${scrolled ? 'bg-[#0A0F1E]/85 backdrop-blur-[20px]' : ''}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight" style={{ fontFamily: 'Clash Display, sans-serif' }}>
          <span style={{ color: MINT }}>U</span>
          <span style={{ color: TEXT }}>piSense</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-medium transition-colors hover:opacity-90" style={{ color: TEXT }}>How it works</a>
          <a href="#pricing" className="text-sm font-medium transition-colors hover:opacity-90" style={{ color: TEXT }}>Pricing</a>
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(0,212,160,0.4)]"
            style={{ background: MINT, color: DARK }}
          >
            Get early access →
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg"
          style={{ color: TEXT }}
          aria-label="Menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="md:hidden absolute top-16 left-0 right-0 min-h-screen py-6 px-4 flex flex-col gap-4"
          style={{ background: DARK }}
        >
          <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="py-3 font-medium" style={{ color: TEXT }}>How it works</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)} className="py-3 font-medium" style={{ color: TEXT }}>Pricing</a>
          <Link to="/login" onClick={() => setMenuOpen(false)} className="py-3 font-semibold rounded-full text-center" style={{ background: MINT, color: DARK }}>Get early access →</Link>
        </motion.div>
      )}
    </header>
  );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Twitter, Linkedin, Instagram } from 'lucide-react';

const MINT = '#00D4A0';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';

const productLinks = [
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Dashboard', to: '/login' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
];

const supportLinks = [
  { label: 'FAQ', to: '/faq' },
  { label: 'WhatsApp support', to: '/whatsapp-support' },
  { label: 'Contact us', to: '/contact' },
];

export function Footer() {
  const location = useLocation();
  const [logoSrc, setLogoSrc] = useState('/logo.png');

  const handleLogoClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };
  return (
    <footer className="py-16 px-4 sm:px-6" style={{ background: '#0A0F1E' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <Link to="/" onClick={handleLogoClick} className="inline-flex items-center gap-2 font-bold text-xl mb-3" style={{ fontFamily: 'Clash Display, sans-serif' }}>
              <img
                src={logoSrc}
                alt="UpiSense"
                className="h-10 w-10 shrink-0 object-contain rounded-lg"
                onError={() => setLogoSrc('/logo.svg')}
              />
              <span style={{ color: TEXT }}>UpiSense</span>
            </Link>
            <p className="text-sm mb-4" style={{ color: MUTED }}>Financial clarity, automatically.</p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" style={{ color: MUTED }} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" style={{ color: MUTED }} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" style={{ color: MUTED }} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4" style={{ color: TEXT }}>Product</h4>
            <ul className="space-y-2">
              {productLinks.map((l) => (
                <li key={l.label}>
                  {'to' in l && l.to ? (
                    <Link to={l.to} className="text-sm hover:opacity-90 transition-opacity" style={{ color: MUTED }}>{l.label}</Link>
                  ) : (
                    <a href={l.href} className="text-sm hover:opacity-90 transition-opacity" style={{ color: MUTED }}>{l.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4" style={{ color: TEXT }}>Support</h4>
            <ul className="space-y-2">
              {supportLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm hover:opacity-90 transition-opacity" style={{ color: MUTED }}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4" style={{ color: TEXT }}>Trust</h4>
            <ul className="space-y-2 text-sm" style={{ color: MUTED }}>
              <li>Built in India 🇮🇳</li>
              <li>Your data stays in India</li>
              <li>Compliant with DPDP Act 2023</li>
              <li>HTTPS and encrypted database hosting</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm" style={{ color: MUTED }}>
            <Link to="/privacy" className="hover:opacity-90">Privacy Policy</Link>
            <span>|</span>
            <Link to="/terms" className="hover:opacity-90">Terms of Service</Link>
            <span>|</span>
            <a href="mailto:support@upisense.app" className="hover:opacity-90">Contact</a>
          </div>
          <p className="text-[11px] text-center max-w-2xl mx-auto" style={{ color: '#4B5563' }}>
            UpiSense is not a bank, financial institution, or payment processor. Transaction data is for informational purposes only and is not a substitute for official bank statements. AI-powered categorization may not always be accurate.
          </p>
          <p className="text-[11px] text-center" style={{ color: '#4B5563' }}>
            © 2026 UpiSense. Built in India 🇮🇳 | Data stored in India | DPDP Act 2023 compliant
          </p>
        </div>
      </div>
    </footer>
  );
}

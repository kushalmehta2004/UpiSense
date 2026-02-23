import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Instagram } from 'lucide-react';

const MINT = '#00D4A0';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';

const productLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Dashboard', href: '/login' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
];

const supportLinks = [
  { label: 'FAQ', to: '/faq' },
  { label: 'WhatsApp support', to: '/whatsapp-support' },
  { label: 'Contact us', to: '/contact' },
];

export function Footer() {
  const [logoSrc, setLogoSrc] = useState('/logo.png');
  return (
    <footer className="py-16 px-4 sm:px-6" style={{ background: '#0A0F1E' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl mb-3" style={{ fontFamily: 'Clash Display, sans-serif' }}>
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
                  <a href={l.href} className="text-sm hover:opacity-90 transition-opacity" style={{ color: MUTED }}>{l.label}</a>
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
              <li>256-bit encryption</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm" style={{ color: MUTED }}>
          <span>© 2025 UpiSense. All rights reserved.</span>
          
        </div>
      </div>
    </footer>
  );
}

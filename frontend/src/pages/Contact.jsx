import { Link } from 'react-router-dom';
import { Mail, MessageCircle } from 'lucide-react';
import { LandingNav } from '../components/landing/LandingNav';
import { Footer } from '../components/landing/Footer';
import { colors, getWhatsAppUrl } from '../theme';

const MINT = '#00D4A0';

export function Contact() {
  const whatsappUrl = getWhatsAppUrl('Hi, I have a question.');
  return (
    <div className="min-h-screen" style={{ background: colors.pageBg }}>
      <LandingNav />
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-4xl font-bold tracking-tight mb-3"
            style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}
          >
            Contact us
          </h1>
          <p className="text-lg mb-12" style={{ color: colors.textSecondary }}>
            Get in touch for support, partnerships, or feedback.
          </p>
          <div className="space-y-8">
            <div
              className="rounded-2xl border p-6 transition-all hover:border-[rgba(0,212,160,0.2)]"
              style={{ background: colors.cardBg, borderColor: colors.cardBorder }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,160,0.15)' }}>
                  <MessageCircle className="w-5 h-5" style={{ color: MINT }} />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                  WhatsApp
                </h2>
              </div>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                Fastest way to get help. We typically reply within a few hours on business days.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                style={{ background: '#25D366', color: 'white' }}
              >
                Message on WhatsApp
              </a>
            </div>
            <div
              className="rounded-2xl border p-6 transition-all hover:border-[rgba(0,212,160,0.2)]"
              style={{ background: colors.cardBg, borderColor: colors.cardBorder }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,160,0.15)' }}>
                  <Mail className="w-5 h-5" style={{ color: MINT }} />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                  Email
                </h2>
              </div>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                For formal inquiries, partnerships, or privacy-related requests.
              </p>
              <a
                href="mailto:kushal.builds@gmail.com"
                className="text-sm font-medium hover:opacity-90"
                style={{ color: MINT }}
              >
                kushal.builds@gmail.com
              </a>
            </div>
          </div>
          <p className="mt-10 text-sm" style={{ color: colors.textSecondary }}>
            See also our{' '}
            <Link to="/faq" className="font-medium hover:opacity-90" style={{ color: MINT }}>
              FAQ
            </Link>
            {' and '}
            <Link to="/whatsapp-support" className="font-medium hover:opacity-90" style={{ color: MINT }}>
              WhatsApp support
            </Link>
            {' '}page for quick answers.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

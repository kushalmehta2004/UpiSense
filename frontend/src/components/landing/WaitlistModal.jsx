import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

const MINT = '#00D4A0';
const DARK = '#0A0F1E';
const CARD = '#111827';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';

function normalizeEmail(email) {
  if (typeof email !== 'string') return null;
  const v = email.trim().toLowerCase();
  if (!v) return null;
  if (v.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  return v;
}

export function WaitlistModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { ok, already, message }

  const normalized = useMemo(() => normalizeEmail(email), [email]);

  useEffect(() => {
    if (!open) return;
    setResult(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setResult(null);
    const v = normalizeEmail(email);
    if (!v) {
      setResult({ ok: false, message: 'Please enter a valid email.' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/waitlist', { email: v });
      const already = res?.data?.alreadySignedUp === true;
      setResult({
        ok: true,
        already,
        message: already ? 'You’re already on the waitlist.' : 'You’re on the waitlist. We’ll email you when it’s ready.',
      });
      if (!already) setEmail('');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Something went wrong. Please try again.';
      setResult({ ok: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close waitlist"
        className="absolute inset-0 w-full h-full"
        onClick={() => onClose?.()}
        style={{ background: 'rgba(0,0,0,0.65)' }}
      />
      <div className="relative mx-auto mt-28 w-[92%] max-w-lg rounded-2xl border border-white/10 p-6 shadow-2xl" style={{ background: CARD }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold" style={{ color: TEXT, fontFamily: 'Clash Display, sans-serif' }}>
              Join the waitlist
            </h3>
            <p className="mt-1 text-sm" style={{ color: MUTED }}>
              Enter your email and we’ll invite you when UpiSense opens.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', color: TEXT }}
          >
            Close
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold" style={{ color: MUTED }}>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              inputMode="email"
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2"
              style={{ color: TEXT, boxShadow: 'none', '--tw-ring-color': 'rgba(0,212,160,0.35)' }}
            />
          </label>

          <button
            type="submit"
            disabled={loading || !normalized}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: MINT, color: DARK }}
          >
            {loading ? 'Saving…' : 'Get waitlisted'}
          </button>

          {result?.message && (
            <div
              className="rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: result.ok ? 'rgba(0,212,160,0.35)' : 'rgba(239,68,68,0.35)',
                background: result.ok ? 'rgba(0,212,160,0.08)' : 'rgba(239,68,68,0.08)',
                color: TEXT,
              }}
            >
              {result.message}
            </div>
          )}

          <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
            By joining, you agree to receive an email from UpiSense. No spam.
          </p>
        </form>
      </div>
    </div>
  );
}


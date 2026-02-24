import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, BookOpen, MessageCircle, Zap, BarChart3, Terminal, ChevronDown, Scale, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuth';
import { auth } from '../utils/api';
import { colors } from '../theme';
import { WhatsAppButton } from '../components/WhatsAppButton';

function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const DANGER_SECTION_ID = 'settings-delete-account';

export function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [upiOpen, setUpiOpen] = useState(true);
  const [cashOpen, setCashOpen] = useState(false);
  const [iouOpen, setIouOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (user?.name !== undefined) {
      setName(user.name || '');
      setLoaded(true);
    }
  }, [user?.name]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const { data } = await auth.updateProfile({ name: name.trim() || undefined });
      if (data?.user) {
        updateUser(data.user);
        setMessage('Profile updated.');
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const displayPhone = user?.phone || user?.whatsapp_number || '—';
  const displayWhatsApp = user?.whatsapp_number && user.whatsapp_number !== user?.phone ? user.whatsapp_number : user?.whatsapp_number || user?.phone;
  const whatsappFormatted = displayWhatsApp ? `+91 ${String(displayWhatsApp).slice(-10).replace(/(\d{5})(\d{5})/, '$1 $2')}` : '';

  const copyWhatsApp = () => {
    const num = (user?.whatsapp_number || user?.phone || '').replace(/\D/g, '');
    if (!num) return;
    const toCopy = num.length === 10 ? `+91${num}` : num;
    navigator.clipboard.writeText(toCopy).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    });
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Permanently delete your account and all your data? This cannot be undone.')) return;
    setDeleteError('');
    setDeleting(true);
    try {
      await auth.deleteAccount();
      logout();
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account. Try again.');
    } finally {
      setDeleting(false);
    }
  };

  const cardStyle = {
    background: colors.cardBg,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
        Settings
      </h1>

      {/* Card 1: Profile */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border transition-all duration-200 hover:border-[rgba(0,212,160,0.2)]"
        style={cardStyle}
      >
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5" style={{ color: colors.mint }} />
          <h2 className="text-lg font-semibold" style={{ color: colors.text }}>Profile</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center">
            <div
              className="w-18 h-18 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
              style={{ width: 72, height: 72, background: `${colors.mint}30`, color: colors.text, fontFamily: 'Clash Display, sans-serif' }}
            >
              {getInitials(name || user?.name)}
            </div>
            <button type="button" className="text-xs mt-2" style={{ color: colors.textSecondary }}>
              Change photo
            </button>
          </div>
          <form onSubmit={handleSaveName} className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl border outline-none transition-colors focus:ring-2"
                style={{
                  background: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                }}
                maxLength={255}
              />
            </div>
            {message && (
              <p className={`text-sm ${message === 'Profile updated.' ? '' : ''}`} style={{ color: message === 'Profile updated.' ? colors.mint : colors.orange }}>
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={saving || !loaded}
              className="h-10 px-6 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: savedFlash ? 'rgba(0,212,160,0.2)' : colors.mint,
                color: colors.pageBg,
              }}
            >
              {savedFlash ? '✓ Saved!' : saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </motion.section>

      {/* Card 2: Account */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border transition-all duration-200"
        style={cardStyle}
      >
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5" style={{ color: colors.mint }} />
          <h2 className="text-lg font-semibold" style={{ color: colors.text }}>Account</h2>
        </div>
        <div className="space-y-5">
          <div>
            <p className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>Phone number</p>
            <p className="font-mono font-medium" style={{ color: colors.text }}>{displayPhone}</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Used for OTP login</p>
          </div>
          {displayWhatsApp && (
            <div>
              <p className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>WhatsApp number</p>
              <p className="font-mono font-medium" style={{ color: colors.text }}>{whatsappFormatted || displayWhatsApp}</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Forward UPI notifications to this number</p>
            </div>
          )}
          <div>
            <p className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>Plan</p>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full border"
                style={{ borderColor: colors.cardBorder, color: colors.text }}
              >
                {(user?.plan || 'free').charAt(0).toUpperCase() + (user?.plan || 'free').slice(1)}
              </span>
              <button type="button" className="text-sm font-medium" style={{ color: colors.mint }}>
                Upgrade to Pro →
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Card 3: How it works */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-t-4 transition-all duration-200"
        style={{ ...cardStyle, borderTopColor: colors.mint }}
      >
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5" style={{ color: colors.mint }} />
          <h2 className="text-lg font-semibold" style={{ color: colors.text }}>Getting Started</h2>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <MessageCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.mint }} />
            <div>
              <p className="font-medium text-sm" style={{ color: colors.text }}>Forward your UPI notification</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                Long-press any payment notification from GPay, PhonePe, or Paytm and forward it to the UpiSense WhatsApp number.
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Zap className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.mint }} />
            <div>
              <p className="font-medium text-sm" style={{ color: colors.text }}>We parse it instantly</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                We extract the amount, merchant, and category automatically. Takes under 10 seconds.
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <BarChart3 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.mint }} />
            <div>
              <p className="font-medium text-sm" style={{ color: colors.text }}>See it on your dashboard</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                Every transaction appears here in real time, categorized and tracked.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <WhatsAppButton label="Message UpiSense directly" />
        </div>
        {whatsappFormatted && (
          <div className="mt-6 pt-6 border-t flex flex-wrap items-center gap-3" style={{ borderColor: colors.cardBorder }}>
            <span className="font-mono text-lg font-semibold" style={{ color: colors.mint }}>{whatsappFormatted}</span>
            <button
              type="button"
              onClick={copyWhatsApp}
              className="px-4 py-2 rounded-full border text-sm font-medium transition-colors"
              style={{ borderColor: colors.mint, color: colors.mint }}
            >
              {copyStatus || 'Copy'}
            </button>
          </div>
        )}
      </motion.section>

      {/* What can UpiSense understand */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-t-4 transition-all duration-200"
        style={{ ...cardStyle, borderTopColor: colors.mint }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5" style={{ color: colors.mint }} />
          <h2 className="text-lg font-semibold" style={{ color: colors.text }}>What can UpiSense understand?</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>Supported commands</p>

        {/* UPI Notifications */}
        <div className="border-b" style={{ borderColor: colors.cardBorder }}>
          <button
            type="button"
            onClick={() => setUpiOpen((o) => !o)}
            className="w-full flex items-center justify-between py-3 px-2 -mx-2 rounded-lg transition-colors hover:bg-white/5 text-left"
          >
            <span className="font-medium text-sm" style={{ color: colors.text }}>UPI Notifications</span>
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${upiOpen ? 'rotate-180' : ''}`} style={{ color: colors.textSecondary }} />
          </button>
          <div className="overflow-hidden transition-all duration-300 ease-out" style={{ maxHeight: upiOpen ? 200 : 0 }}>
            <p className="text-xs pb-2" style={{ color: colors.textSecondary }}>Forward any notification from:</p>
            <p className="text-sm pb-4" style={{ color: colors.text }}>GPay · PhonePe · Paytm · BHIM · HDFC · SBI · ICICI · Axis</p>
            <p className="text-xs pb-4" style={{ color: colors.textSecondary }}>Just long-press the notification and forward to UpiSense</p>
          </div>
        </div>

        {/* Cash Payments */}
        <div className="border-b" style={{ borderColor: colors.cardBorder }}>
          <button
            type="button"
            onClick={() => setCashOpen((o) => !o)}
            className="w-full flex items-center justify-between py-3 px-2 -mx-2 rounded-lg transition-colors hover:bg-white/5 text-left"
          >
            <span className="font-medium text-sm" style={{ color: colors.text }}>Cash Payments</span>
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${cashOpen ? 'rotate-180' : ''}`} style={{ color: colors.textSecondary }} />
          </button>
          <div className="overflow-hidden transition-all duration-300 ease-out" style={{ maxHeight: cashOpen ? 320 : 0 }}>
            <p className="text-xs pb-2" style={{ color: colors.textSecondary }}>Examples that work:</p>
            <ul className="space-y-1.5 pb-4 text-sm" style={{ color: colors.text }}>
              <li className="flex items-center gap-2"><span style={{ color: colors.mint }}>✓</span> &quot;I paid 200 to auto&quot;</li>
              <li className="flex items-center gap-2"><span style={{ color: colors.mint }}>✓</span> &quot;paid 500 cash at pharmacy&quot;</li>
              <li className="flex items-center gap-2"><span style={{ color: colors.mint }}>✓</span> &quot;spent 800 at kirana store&quot;</li>
              <li className="flex items-center gap-2"><span style={{ color: colors.mint }}>✓</span> &quot;150 to the plumber&quot;</li>
              <li className="flex items-center gap-2"><span style={{ color: colors.mint }}>✓</span> &quot;Paid Ramesh 300 for vegetables&quot;</li>
            </ul>
            <p className="text-xs pb-4" style={{ color: colors.textSecondary }}>Any amount, any merchant, any phrasing — UpiSense understands.</p>
          </div>
        </div>

        {/* IOU Tracking */}
        <div>
          <button
            type="button"
            onClick={() => setIouOpen((o) => !o)}
            className="w-full flex items-center justify-between py-3 px-2 -mx-2 rounded-lg transition-colors hover:bg-white/5 text-left"
          >
            <span className="font-medium text-sm" style={{ color: colors.text }}>IOU Tracking</span>
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${iouOpen ? 'rotate-180' : ''}`} style={{ color: colors.textSecondary }} />
          </button>
          <div className="overflow-hidden transition-all duration-300 ease-out" style={{ maxHeight: iouOpen ? 340 : 0 }}>
            <p className="text-xs pt-1 pb-1" style={{ color: colors.textSecondary }}>When someone owes you:</p>
            <ul className="space-y-1 pb-3 text-sm" style={{ color: colors.text }}>
              <li className="flex items-center gap-2"><span style={{ color: colors.mint }}>✓</span> &quot;Rohan owes me 500&quot;</li>
              <li className="flex items-center gap-2"><span style={{ color: colors.mint }}>✓</span> &quot;Priya hasn&apos;t paid for the movie (₹300)&quot;</li>
            </ul>
            <p className="text-xs pb-1" style={{ color: colors.textSecondary }}>When you owe someone:</p>
            <ul className="space-y-1 pb-3 text-sm" style={{ color: colors.text }}>
              <li className="flex items-center gap-2"><span style={{ color: colors.mint }}>✓</span> &quot;I owe Samkit 300&quot;</li>
              <li className="flex items-center gap-2"><span style={{ color: colors.mint }}>✓</span> &quot;Need to pay Deepa back 200&quot;</li>
            </ul>
            <p className="text-xs pb-1" style={{ color: colors.textSecondary }}>When settling up:</p>
            <ul className="space-y-1 pb-4 text-sm" style={{ color: colors.text }}>
              <li className="flex items-center gap-2"><span style={{ color: colors.mint }}>✓</span> &quot;Rohan returned my 500&quot;</li>
              <li className="flex items-center gap-2"><span style={{ color: colors.mint }}>✓</span> &quot;I paid back Samkit 300&quot;</li>
              <li className="flex items-center gap-2"><span style={{ color: colors.mint }}>✓</span> &quot;Settle Deepa&quot; (settles the full amount)</li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Legal & Compliance */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl border transition-all duration-200 hover:border-[rgba(0,212,160,0.2)]"
        style={cardStyle}
      >
        <div className="flex items-center gap-2 mb-6">
          <Scale className="w-5 h-5" style={{ color: colors.mint }} />
          <h2 className="text-lg font-semibold" style={{ color: colors.text }}>Legal & Compliance</h2>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b" style={{ borderColor: colors.cardBorder }}>
            <div>
              <p className="font-medium text-sm" style={{ color: colors.text }}>Privacy Policy</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>How we collect, use, and protect your data</p>
            </div>
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium shrink-0"
              style={{ color: colors.mint }}
            >
              Open <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium text-sm" style={{ color: colors.text }}>Terms of Service</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>Rules for using UpiSense</p>
            </div>
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium shrink-0"
              style={{ color: colors.mint }}
            >
              Open <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div
          className="mt-6 rounded-xl border-2 p-4"
          style={{ background: 'rgba(0,212,160,0.06)', borderColor: colors.mint }}
        >
          <p className="font-semibold text-sm mb-1" style={{ color: colors.text }}>Your data, your control</p>
          <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
            You can request a copy of all data we hold about you, correct any inaccuracies, or delete your account at any time. Email <a href="mailto:privacy@upisense.app" className="font-medium hover:opacity-90" style={{ color: colors.mint }}>privacy@upisense.app</a> for any data requests.
          </p>
        </div>
      </motion.section>

      {/* Card 4: Danger zone */}
      <motion.section
        id={DANGER_SECTION_ID}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-t-4 transition-all duration-200"
        style={{ ...cardStyle, borderTopColor: 'rgba(249,115,22,0.5)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold" style={{ color: colors.text }}>Account</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm" style={{ color: colors.text }}>Delete account</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              Permanently delete your account and all data. This cannot be undone.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            {deleteError && <p className="text-xs" style={{ color: colors.orange }}>{deleteError}</p>}
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteAccount}
              className="px-4 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-orange-500/10 disabled:opacity-50"
              style={{ borderColor: colors.orange, color: colors.orange }}
            >
              {deleting ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

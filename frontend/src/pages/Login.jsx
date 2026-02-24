import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { auth } from '../utils/api';

export function Login() {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoSrc, setLogoSrc] = useState('/logo.png');

  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue');
      return;
    }
    if (!phone || phone.length < 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      await auth.signup(phone.replace(/\D/g, ''), null);
      setStep('otp');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const { data } = await auth.verify(phone.replace(/\D/g, ''), otp);
      if (data.success && data.token && data.user) {
        setUser(data.user, data.token);
        navigate(from, { replace: true });
      } else {
        setError('Verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/20 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logoSrc} alt="" className="h-16 w-16 mx-auto mb-4 object-contain rounded-xl" onError={() => setLogoSrc('/logo.svg')} />
          <h1 className="text-3xl font-bold text-white">UpiSense</h1>
          <p className="text-slate-400 mt-1">Track every rupee. Zero effort.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <label className="block text-sm font-medium text-slate-600">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="9876543210"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800"
                maxLength={15}
              />
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-600">
                  I have read and agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-teal-600 font-medium hover:underline">Terms of Service</Link> and <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-teal-600 font-medium hover:underline">Privacy Policy</Link>
                </span>
              </label>
              <p className="text-[11px]" style={{ color: '#6B7280' }}>
                By signing up, you consent to receive WhatsApp messages from UpiSense. Reply STOP at any time to unsubscribe.
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-slate-600">
                OTP sent to {phone}. For dev, use <strong>123456</strong>
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-center text-lg tracking-widest text-slate-800"
                maxLength={6}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="w-full text-sm text-slate-500 hover:text-slate-800"
              >
                Change number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

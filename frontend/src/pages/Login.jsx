import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { auth } from '../utils/api';

export function Login() {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();

  const from = location.state?.from?.pathname || '/';

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#0d1f2d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">UpiSense</h1>
          <p className="text-slate-400 mt-1">Track every rupee. Zero effort.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="9876543210"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#00a651] focus:border-transparent outline-none"
                maxLength={15}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#00a651] text-white font-semibold rounded-lg hover:bg-[#008f45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#00a651] focus:border-transparent outline-none text-center text-lg tracking-widest"
                maxLength={6}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#00a651] text-white font-semibold rounded-lg hover:bg-[#008f45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
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

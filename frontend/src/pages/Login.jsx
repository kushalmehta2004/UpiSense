import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { auth } from '../utils/api';

export function Login() {
  const [step, setStep] = useState('phone');
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
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="" className="h-12 w-12 mx-auto mb-3 opacity-95" />
          <h1 className="text-3xl font-bold text-white">UpiSense</h1>
          <p className="text-[#94a3b8] mt-1">Track every rupee. Zero effort.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-[#e2e8f0]">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <label className="block text-sm font-medium text-[#475569]">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="9876543210"
                className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] focus:ring-2 focus:ring-[#0d9488] focus:border-[#0d9488] outline-none text-[#0f172a]"
                maxLength={15}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0f766e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-[#64748b]">
                OTP sent to {phone}. For dev, use <strong>123456</strong>
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] focus:ring-2 focus:ring-[#0d9488] focus:border-[#0d9488] outline-none text-center text-lg tracking-widest text-[#0f172a]"
                maxLength={6}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0f766e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="w-full text-sm text-[#64748b] hover:text-[#0f172a]"
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

/**
 * OTP send (Fast2SMS) + verify via in-memory store.
 * Free tier: Fast2SMS gives ₹50 credit on signup (~100+ SMS at their rate).
 * Set FAST2SMS_API_KEY in .env to enable. Primary auth is email OTP (Gmail); SMS is optional.
 */

const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

const store = new Map(); // phone (10-digit) -> { otp, expiresAt }

function normalizePhone(phone) {
  const d = String(phone).replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : d;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isConfigured() {
  return Boolean(process.env.FAST2SMS_API_KEY && process.env.FAST2SMS_API_KEY.trim());
}

/**
 * Send OTP via Fast2SMS. Stores OTP in memory for verify. Phone = 10-digit Indian number.
 * @returns {{ sent: true } | { sent: false, error: string }}
 */
async function sendOtp(phone) {
  if (!isConfigured()) {
    return { sent: false, error: 'FAST2SMS_API_KEY not set' };
  }
  const normalized = normalizePhone(phone);
  if (normalized.length !== 10) {
    return { sent: false, error: 'Invalid phone number' };
  }
  const otp = generateOtp();
  store.set(normalized, { otp, expiresAt: Date.now() + OTP_TTL_MS });

  try {
    const res = await require('axios').default.post(
      FAST2SMS_URL,
      {
        route: 'otp',
        numbers: normalized,
        variables_values: otp,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          authorization: process.env.FAST2SMS_API_KEY.trim(),
        },
        timeout: 15000,
      }
    );
    const data = res.data;
    if (data?.return === true) {
      return { sent: true };
    }
    const msg = data?.message || data?.msg || JSON.stringify(data) || 'Unknown error';
    store.delete(normalized);
    return { sent: false, error: msg };
  } catch (err) {
    store.delete(normalized);
    const msg = err.response?.data?.message || err.response?.data?.msg || err.message || 'SMS send failed';
    return { sent: false, error: msg };
  }
}

/**
 * Verify OTP. Phone = 10-digit. Returns true if valid and consumes the OTP.
 */
function verifyOtp(phone, code) {
  const normalized = normalizePhone(phone);
  const entry = store.get(normalized);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(normalized);
    return false;
  }
  if (entry.otp !== String(code).trim()) return false;
  store.delete(normalized);
  return true;
}

module.exports = { sendOtp, verifyOtp, isConfigured };

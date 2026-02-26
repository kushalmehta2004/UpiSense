/**
 * Email OTP – send via Gmail SMTP, verify via in-memory store.
 * Set GMAIL_USER and GMAIL_APP_PASSWORD in .env (no domain needed).
 */

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const store = new Map(); // normalized email -> { otp, expiresAt }

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isConfigured() {
  return Boolean(
    process.env.GMAIL_USER && process.env.GMAIL_USER.trim() &&
    process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_APP_PASSWORD.trim()
  );
}

/**
 * Send OTP to email via Gmail SMTP. Stores OTP in memory for verify.
 * @returns {{ sent: true } | { sent: false, error: string }}
 */
async function sendOtp(email) {
  if (!isConfigured()) {
    return { sent: false, error: 'Set GMAIL_USER and GMAIL_APP_PASSWORD in .env to send OTP.' };
  }
  const normalized = normalizeEmail(email);
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { sent: false, error: 'Invalid email address' };
  }
  const otp = generateOtp();
  store.set(normalized, { otp, expiresAt: Date.now() + OTP_TTL_MS });

  const appName = process.env.APP_NAME || 'UpiSense';
  const subject = `Your ${appName} verification code`;
  const html = `<p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`;

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER.trim(),
        pass: process.env.GMAIL_APP_PASSWORD.trim(),
      },
    });
    const from = process.env.OTP_EMAIL_FROM || `"${appName}" <${process.env.GMAIL_USER.trim()}>`;
    await transporter.sendMail({
      from,
      to: normalized,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    store.delete(normalized);
    return { sent: false, error: err.message || 'Failed to send email' };
  }
}

/**
 * Verify OTP for email. Returns true if valid and consumes the OTP.
 */
function verifyOtp(email, code) {
  const normalized = normalizeEmail(email);
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

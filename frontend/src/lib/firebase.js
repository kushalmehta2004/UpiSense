/**
 * Firebase Auth for Phone OTP (free tier: 10k verifications/month).
 * Requires VITE_FIREBASE_* env vars. If not set, app uses legacy backend OTP (dev 123456).
 */

import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

export const isFirebaseEnabled = Boolean(
  apiKey && authDomain && projectId && appId
);

let app = null;
let auth = null;
let recaptchaVerifier = null;

export function getFirebaseAuth() {
  if (!isFirebaseEnabled) return null;
  if (auth) return auth;
  app = initializeApp({
    apiKey,
    authDomain,
    projectId,
    appId,
  });
  auth = getAuth(app);
  return auth;
}

/**
 * Ensure E.164 for India: 9876543210 -> +919876543210
 */
function toE164(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('6') === false && digits.startsWith('5') === false) {
    return '+91' + digits;
  }
  if (digits.length >= 10) {
    return digits.startsWith('91') ? '+' + digits : '+91' + digits.slice(-10);
  }
  return '+' + digits;
}

/**
 * Send OTP via Firebase. Returns a confirmation result; call confirm(code) on it to complete.
 * @param {string} phone - 10-digit Indian number (e.g. 9876543210)
 * @param {HTMLElement} container - element ID or element for invisible reCAPTCHA anchor
 * @returns {Promise<{ confirm: (code: string) => Promise<{ user: object }> }>}
 */
export async function sendPhoneOtp(phone, container = 'recaptcha-container') {
  const authInstance = getFirebaseAuth();
  if (!authInstance) throw new Error('Firebase is not configured');

  const phoneNumber = toE164(phone);
  const containerId = typeof container === 'string' ? container : (container && container.id) || 'send-otp-btn';

  if (!recaptchaVerifier) {
    console.log('[firebase] Creating RecaptchaVerifier, containerId:', containerId);
    recaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, {
      size: 'invisible',
      callback: () => {},
    });
  }

  console.log('[firebase] Calling signInWithPhoneNumber for', phoneNumber);
  const confirmationResult = await signInWithPhoneNumber(authInstance, phoneNumber, recaptchaVerifier);
  console.log('[firebase] signInWithPhoneNumber succeeded');
  return confirmationResult;
}

/**
 * After user enters OTP, get Firebase ID token to send to our backend.
 * @param {import('firebase/auth').User} user - from confirmationResult.confirm(code)
 * @returns {Promise<string>} idToken
 */
export async function getIdToken(user) {
  if (!user) throw new Error('No user');
  return user.getIdToken();
}

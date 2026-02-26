/**
 * Firebase Admin SDK - used only to verify Firebase ID tokens from Phone Auth.
 * No SMS is sent from backend; frontend uses Firebase Client SDK to send OTP and get idToken.
 * Set FIREBASE_SERVICE_ACCOUNT_JSON in .env (stringified JSON of service account key) to enable.
 */

let admin = null;
let isConfigured = false;

function getFirebaseAdmin() {
  if (admin !== null) return { admin, isConfigured };
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json || typeof json !== 'string' || json.trim() === '') {
    return { admin: null, isConfigured: false };
  }
  try {
    const firebaseAdmin = require('firebase-admin');
    const serviceAccount = JSON.parse(json);
    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(serviceAccount) });
    }
    admin = firebaseAdmin;
    isConfigured = true;
    return { admin, isConfigured: true };
  } catch (e) {
    console.warn('[firebaseAdmin] Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
    return { admin: null, isConfigured: false };
  }
}

/**
 * Verify Firebase ID token and return decoded claims. phone_number is E.164 (e.g. +919876543210).
 * @param {string} idToken - Firebase ID token from client after phone sign-in
 * @returns {Promise<{ phone_number: string, uid: string }|null>}
 */
async function verifyIdToken(idToken) {
  const { admin, isConfigured } = getFirebaseAdmin();
  if (!isConfigured || !admin) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const phone = decoded.phone_number || (decoded.firebase && decoded.firebase.identities && decoded.firebase.identities.phone && decoded.firebase.identities.phone[0]);
    if (!phone) return null;
    return { phone_number: phone, uid: decoded.uid };
  } catch (e) {
    console.warn('[firebaseAdmin] verifyIdToken failed:', e.message);
    return null;
  }
}

function isFirebaseConfigured() {
  getFirebaseAdmin();
  return isConfigured;
}

module.exports = { getFirebaseAdmin, verifyIdToken, isFirebaseConfigured };

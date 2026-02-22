/**
 * Phone number normalization for matching login (user input) with WhatsApp sender IDs.
 * WhatsApp always sends numbers with country code (e.g. 919372999366 for India).
 * Users may log in with 10 digits (9372999366) or 12 digits (919372999366).
 */

const INDIA_CODE = '91';

/**
 * Get variants of a phone number for lookup (with/without India country code).
 * @param {string} phone - e.g. "919372999366" or "9372999366"
 * @returns {string[]} - e.g. ["919372999366", "9372999366"]
 */
function getPhoneVariants(phone) {
  if (!phone || typeof phone !== 'string') return [];
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return [digits];
  const withCountry = digits.startsWith(INDIA_CODE) && digits.length === 12
    ? digits
    : (digits.length === 10 ? INDIA_CODE + digits : digits);
  const withoutCountry = withCountry.startsWith(INDIA_CODE)
    ? withCountry.slice(INDIA_CODE.length)
    : withCountry;
  const out = [withCountry, withoutCountry];
  return [...new Set(out)];
}

/**
 * Normalize phone to E.164-ish format (91 + 10 digits for India) for consistent storage.
 * @param {string} phone - User input, e.g. "9372999366" or "919372999366"
 * @returns {string} - e.g. "919372999366"
 */
function normalizeForWhatsApp(phone) {
  if (!phone || typeof phone !== 'string') return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return INDIA_CODE + digits;
  if (digits.length === 12 && digits.startsWith(INDIA_CODE)) return digits;
  return digits;
}

module.exports = { getPhoneVariants, normalizeForWhatsApp };

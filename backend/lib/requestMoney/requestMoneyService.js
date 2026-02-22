/**
 * Tier 1: Request money – gentle reminder to a friend
 * "request 500 from 919876543210" or "remind 919876543210 about 500"
 * If they're on UpiSense we WhatsApp them; else give you a message to forward.
 */

const { normalizeForWhatsApp } = require('../phoneUtils.js');

/**
 * Parse "request 500 from 919876543210" or "remind 919876543210 about 500"
 */
function parseRequestMoneyCommand(text) {
  const t = text.trim();
  let match = t.match(/^request\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s+from\s+(\d+)$/i);
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    return { amount, phone: match[2] };
  }
  match = t.match(/^remind\s+(\d+)\s+about\s+(\d+(?:,\d{3})*(?:\.\d{2})?)$/i);
  if (match) {
    const amount = parseFloat(match[2].replace(/,/g, ''));
    return { amount, phone: match[1] };
  }
  match = t.match(/^remind\s+(.+?)\s+about\s+(\d+(?:,\d{3})*(?:\.\d{2})?)$/i);
  if (match) {
    const amount = parseFloat(match[2].replace(/,/g, ''));
    const phone = match[1].replace(/\D/g, '');
    if (phone.length >= 10) return { amount, phone };
  }
  return null;
}

/**
 * Find user by phone; return { userId, whatsapp_number } or null
 */
async function findUserByPhone(supabase, phone) {
  const normalized = normalizeForWhatsApp(phone);
  const variants = [normalized, normalized.length === 12 ? normalized.slice(2) : null].filter(Boolean);
  for (const v of variants) {
    const { data } = await supabase.from('users').select('id, whatsapp_number, name').or(`phone.eq.${v},whatsapp_number.eq.${v}`).limit(1);
    if (data?.[0]) return data[0];
  }
  return null;
}

module.exports = {
  parseRequestMoneyCommand,
  findUserByPhone
};

/**
 * Tier 1: Family/shared wallet – combined spending view
 * Commands: "add to family 919876543210", "family summary"
 */

const { normalizeForWhatsApp } = require('../phoneUtils.js');

/**
 * Add another UpiSense user (by phone) to my family/shared view
 */
async function addToFamily(supabase, ownerUserId, phone) {
  const normalized = normalizeForWhatsApp(phone);
  const { data: member } = await supabase.from('users').select('id').or(`phone.eq.${normalized},whatsapp_number.eq.${normalized}`).limit(1).single();
  if (!member) return { ok: false, error: 'No UpiSense user with that number. They need to message the bot first.' };
  if (member.id === ownerUserId) return { ok: false, error: "You can't add yourself." };
  const { error } = await supabase.from('family_links').upsert(
    { owner_user_id: ownerUserId, member_user_id: member.id },
    { onConflict: 'owner_user_id,member_user_id' }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Get combined spending by category for owner + all linked members (current month)
 */
async function getFamilySpendingThisMonth(supabase, ownerUserId) {
  const { data: links } = await supabase.from('family_links').select('member_user_id').eq('owner_user_id', ownerUserId);
  const userIds = [ownerUserId, ...(links || []).map(l => l.member_user_id)];
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  const byCategory = {};
  for (const uid of userIds) {
    const { data } = await supabase
      .from('transactions')
      .select('category, amount')
      .eq('user_id', uid)
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString());
    (data || []).forEach(row => {
      const cat = row.category || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + Number(row.amount || 0);
    });
  }
  const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
  return { byCategory, total, start, end };
}

/**
 * Format family summary message
 */
function formatFamilySummaryMessage({ byCategory, total, start }) {
  const monthName = start.toLocaleString('en-IN', { month: 'long' });
  const lines = [`👨‍👩‍👧‍👦 *Family shared spending – ${monthName} ${start.getUTCFullYear()}*`, ''];
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  for (const [cat, amt] of sorted) {
    lines.push(`• ${cat}: ₹${amt.toLocaleString('en-IN')}`);
  }
  lines.push('', `*Total: ₹${total.toLocaleString('en-IN')}*`);
  return lines.join('\n');
}

/**
 * Parse "add to family 919876543210" or "add 919876543210 to family"
 */
function parseAddToFamilyCommand(text) {
  const t = text.trim();
  let match = t.match(/^add\s+to\s+family\s+(\d+)$/i);
  if (match) return match[1];
  match = t.match(/^add\s+(\d+)\s+to\s+family$/i);
  if (match) return match[1];
  return null;
}

module.exports = {
  addToFamily,
  getFamilySpendingThisMonth,
  formatFamilySummaryMessage,
  parseAddToFamilyCommand
};

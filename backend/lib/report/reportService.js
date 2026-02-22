/**
 * Tier 1: Monthly/yearly reports
 * WhatsApp: "report", "summary", "monthly report" = this month; "report jan" = Jan; "report 2024" = year
 */

/**
 * Parse report command: report [month name or year]
 * @param {string} text
 * @returns {{ type: 'month'|'year', year: number, month?: number }|null} month 0-indexed
 */
function parseReportCommand(text) {
  const t = text.trim().toLowerCase();
  if (!/^(?:monthly\s+)?(?:report|summary)\s*(\S*)$/.test(t) && t !== 'report' && t !== 'summary') return null;
  const match = t.match(/^(?:monthly\s+)?(?:report|summary)\s*(\S*)$/) || [null, ''];
  const arg = (match[1] || '').trim();
  const now = new Date();
  if (!arg) {
    return { type: 'month', year: now.getFullYear(), month: now.getMonth() };
  }
  const months = 'jan,feb,mar,apr,may,jun,jul,aug,sep,oct,nov,dec'.split(',');
  const mi = months.findIndex(m => arg.startsWith(m));
  if (mi >= 0) {
    return { type: 'month', year: now.getFullYear(), month: mi };
  }
  const year = parseInt(arg, 10);
  if (year >= 2000 && year <= 2100) {
    return { type: 'year', year };
  }
  return { type: 'month', year: now.getFullYear(), month: now.getMonth() };
}

/**
 * Get spending by category for a month or full year
 */
async function getSpendingByCategory(supabase, userId, { type, year, month }) {
  let start, end;
  if (type === 'year') {
    start = new Date(Date.UTC(year, 0, 1));
    end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  } else {
    start = new Date(Date.UTC(year, month, 1));
    end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  }
  const { data, error } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', userId)
    .gte('timestamp', start.toISOString())
    .lte('timestamp', end.toISOString());
  if (error) throw error;
  const byCategory = {};
  (data || []).forEach(row => {
    const cat = row.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + Number(row.amount || 0);
  });
  const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
  return { byCategory, total, start, end };
}

/**
 * Format report as WhatsApp message (category lines + total)
 */
function formatReportMessage({ byCategory, total, start, end }, type) {
  const lines = [];
  if (type === 'year') {
    lines.push(`📊 *Spending report ${start.getUTCFullYear()}*`);
  } else {
    const monthName = start.toLocaleString('en-IN', { month: 'long' });
    lines.push(`📊 *Spending report – ${monthName} ${start.getUTCFullYear()}*`);
  }
  lines.push('');
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  for (const [cat, amt] of sorted) {
    lines.push(`• ${cat}: ₹${amt.toLocaleString('en-IN')}`);
  }
  lines.push('');
  lines.push(`*Total: ₹${total.toLocaleString('en-IN')}*`);
  return lines.join('\n');
}

module.exports = {
  parseReportCommand,
  getSpendingByCategory,
  formatReportMessage
};

/**
 * Date utilities for UpiSense – IST (India Standard Time, UTC+5:30).
 * Use for transaction timestamps so stored UTC represents the intended IST date/time.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Get current date in IST as YYYY-MM-DD (for "today" when parsing relative dates).
 */
function getTodayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convert a date string YYYY-MM-DD to an ISO timestamp at 12:00 noon IST, in UTC.
 * Used for backdated expenses so the transaction appears on the correct day in IST.
 * 12:00 IST = 06:30 UTC.
 */
function dateStringToNoonISTUTC(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  const year = parseInt(y, 10);
  const month = parseInt(m, 10) - 1;
  const day = parseInt(d, 10);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  // Noon IST = 12:00 in IST. In UTC that is 06:30 same day (or 06:30 next/prev in edge cases).
  const utcDate = new Date(Date.UTC(year, month, day, 6, 30, 0, 0));
  return utcDate.toISOString();
}

/**
 * Get current moment as ISO string in UTC (same as new Date().toISOString()).
 * Use message timestamp when available so the recorded time is when the user sent the message.
 */
function nowUTC() {
  return new Date().toISOString();
}

module.exports = {
  getTodayIST,
  dateStringToNoonISTUTC,
  nowUTC
};

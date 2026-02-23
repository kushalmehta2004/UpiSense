/**
 * Consistent amount handling: preserve up to 2 decimal places, never round to integer.
 * Use for all transaction and pending_recipient_ask inserts so 99.5 stays 99.5.
 */

/**
 * Round to at most 2 decimal places. Use when storing or passing amount to DB.
 * 99.5 → 99.5, 99.556 → 99.56, 99.999 → 100 (only if truly 99.999)
 * @param {number|string|null} value
 * @returns {number|null}
 */
function roundTo2(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (isNaN(n)) return null;
  return Math.round(n * 100) / 100;
}

/**
 * Same as roundTo2 but for DB inserts: some drivers round floats to integer.
 * Return a number that will serialize without being rounded to integer (we keep 2 decimals).
 * For Supabase/Postgres DECIMAL(10,2), passing 99.5 is correct; if needed we could pass string.
 * @param {number|string|null} value
 * @returns {number|null}
 */
function amountForDb(value) {
  return roundTo2(value);
}

module.exports = { roundTo2, amountForDb };

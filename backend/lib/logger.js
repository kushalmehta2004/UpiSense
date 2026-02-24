/**
 * Task 7: Error handling & logging
 * - Parse failures → logs/parse-failures.log (local) and/or Supabase (production)
 * - Error summary endpoint for weekly review
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const PARSE_FAILURES_FILE = path.join(LOG_DIR, 'parse-failures.log');

function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (e) {
    // ignore (e.g. on Vercel serverless)
  }
}

/**
 * Log a parsing failure. Raw message text is never persisted (Privacy: deleted within 60s promise).
 * Optional supabase: insert error + meta only (no snippet).
 */
async function logParseFailure(textSnippet, errorMessage, meta = {}, supabase = null) {
  const length = String(textSnippet || '').length;
  const error = String(errorMessage || 'unknown');
  const entry = { ts: new Date().toISOString(), error, ...meta };
  console.error('❌ [parse-failure]', error, length ? `(message length: ${length})` : '');
  if (supabase) {
    try {
      await supabase.from('parse_failures').insert({ error, meta });
    } catch (e) {
      console.error('Could not write parse_failures to DB:', e.message);
    }
  }
  ensureLogDir();
  try {
    fs.appendFileSync(PARSE_FAILURES_FILE, JSON.stringify(entry) + '\n');
  } catch (e) {
    // ignore on read-only fs (e.g. Vercel)
  }
}

/**
 * Log a general error (tagged)
 */
function logError(tag, error, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    tag: tag || 'error',
    message: error?.message || String(error),
    ...meta
  };
  const line = JSON.stringify(entry) + '\n';
  console.error(`❌ [${entry.tag}]`, entry.message);
  ensureLogDir();
  const errorLogPath = path.join(LOG_DIR, 'errors.log');
  try {
    fs.appendFileSync(errorLogPath, line);
  } catch (e) {
    // ignore
  }
}

/**
 * Read parse failure summary from file (local) or Supabase (production). Optional supabase.
 */
async function getParseFailureSummary(options = {}, supabase = null) {
  const { sinceDays = 7, limit = 200 } = options;
  const since = sinceDays ? new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString() : null;
  if (supabase) {
    try {
      let q = supabase.from('parse_failures').select('id, ts, error, meta').order('ts', { ascending: false }).limit(limit);
      if (since) q = q.gte('ts', since);
      const { data, error } = await q;
      if (error) throw error;
      return { total: (data || []).length, since, entries: data || [], source: 'db' };
    } catch (e) {
      return { total: 0, since, entries: [], error: e.message, source: 'db' };
    }
  }
  const lines = [];
  try {
    if (!fs.existsSync(PARSE_FAILURES_FILE)) {
      return { total: 0, entries: [], since, source: 'file' };
    }
    const content = fs.readFileSync(PARSE_FAILURES_FILE, 'utf8');
    const all = content.trim().split('\n').filter(Boolean);
    for (let i = all.length - 1; i >= 0 && lines.length < limit; i--) {
      try {
        const entry = JSON.parse(all[i]);
        if (since && entry.ts < since) continue;
        lines.push(entry);
      } catch (_) {}
    }
  } catch (e) {
    return { total: 0, entries: [], since, error: e.message, source: 'file' };
  }
  return { total: lines.length, since, entries: lines.slice(0, limit), source: 'file' };
}

module.exports = {
  logParseFailure,
  logError,
  getParseFailureSummary,
  PARSE_FAILURES_FILE,
  LOG_DIR
};

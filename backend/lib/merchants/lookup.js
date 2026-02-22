const Fuse = require('fuse.js');
const staticDictionary = require('./dictionary.json');
const { getPublicMerchantDictionary } = require('./publicSources.js');

// Merged dictionary: static + public sources (populated on init)
let mergedDictionary = { ...staticDictionary };
let fuse = buildFuse(mergedDictionary);
let initialized = false;

function buildFuse(dict) {
  const list = Object.entries(dict).map(([key, value]) => ({ key, category: value }));
  return new Fuse(list, {
    keys: ['key'],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true
  });
}

/**
 * Load public merchant sources and merge with static dictionary.
 * Call once at startup or on first request. Safe to call multiple times (cached).
 */
async function ensureLoaded() {
  if (initialized) return;
  try {
    const publicDict = await getPublicMerchantDictionary();
    mergedDictionary = { ...staticDictionary, ...publicDict };
    fuse = buildFuse(mergedDictionary);
    initialized = true;
  } catch (err) {
    console.warn('⚠️ Merchant lookup: using static dictionary only:', err.message);
    initialized = true; // Don't retry on every request
  }
}

/**
 * Get category for a merchant name
 * 1. Exact match (case-insensitive) - returns immediately
 * 2. Fuzzy match if no exact match
 * @param {string} merchantName - Merchant/recipient name from transaction
 * @returns {{ category: string, confidence: number } | null}
 */
function getCategoryForMerchant(merchantName) {
  if (!merchantName || typeof merchantName !== 'string') {
    return null;
  }

  const normalized = merchantName.trim().toLowerCase();
  if (!normalized) return null;

  // 1. Exact match (fast path) - uses merged dictionary (static + public)
  const exactCategory = mergedDictionary[normalized];
  if (exactCategory) {
    return { category: exactCategory, confidence: 0.95 };
  }

  // 2. Try extracting merchant from UPI ID (e.g., "swiggy@paytm" -> "swiggy")
  const upiPart = normalized.split('@')[0];
  if (upiPart && mergedDictionary[upiPart]) {
    return { category: mergedDictionary[upiPart], confidence: 0.90 };
  }

  // 3. Substring match: "zomato private l" or "zomato pvt ltd" -> match "zomato"
  const keys = Object.keys(mergedDictionary).sort((a, b) => b.length - a.length); // longest first
  for (const key of keys) {
    if (key.length >= 3 && normalized.includes(key)) {
      return { category: mergedDictionary[key], confidence: 0.90 };
    }
  }

  // 4. Fuzzy search
  const results = fuse.search(normalized);
  if (results.length > 0 && results[0].score < 0.5) {
    const { item, score } = results[0];
    // Convert Fuse score (0=perfect) to confidence (1=perfect)
    const confidence = Math.max(0.75, 0.90 - score);
    return { category: item.category, confidence };
  }

  return null;
}

/**
 * Check if a merchant is in the dictionary (exact or fuzzy)
 * @param {string} merchantName
 * @returns {boolean}
 */
function isKnownMerchant(merchantName) {
  return getCategoryForMerchant(merchantName) !== null;
}

module.exports = {
  getCategoryForMerchant,
  isKnownMerchant,
  ensureLoaded,
  get dictionary() { return mergedDictionary; }
};

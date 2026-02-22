/**
 * Fetches and merges public merchant datasets
 * Source: D2C Brands list (GitHub Gist) - 50+ Indian D2C brands with categories
 * License: Public/Community data
 */

const https = require('https');

const D2C_BRANDS_URL = 'https://gist.githubusercontent.com/gurusandeep/d8e6c14039458abe097f428f948236e0/raw/d2c-brands.csv';

// Map D2C categories to our standard categories
const CATEGORY_MAP = {
  'e-commerce': 'Shopping',
  'food': 'Food & Dining',
  'kids': 'Shopping',
  'skin care & beauty': 'Shopping',
  'beauty': 'Shopping',
  'lifestyle | earwear': 'Shopping',
  'lifestyle': 'Shopping',
  'ceiling fan': 'Shopping',
  'jewellary': 'Shopping',
  'jewellery': 'Shopping',
  'jewelry': 'Shopping',
  'smart watch': 'Shopping',
  'wearables': 'Shopping',
  'clothing': 'Shopping',
  'clothing & accessories': 'Shopping',
  'milk': 'Groceries',
  'dairy': 'Groceries',
  'home appliances': 'Shopping',
  'bedroom': 'Shopping',
  'health': 'Health',
  'personal hygiene': 'Shopping',
  'personal care': 'Shopping',
  'skin care': 'Shopping',
  'footwear': 'Shopping'
};

let cachedPublicDict = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else current += c;
    }
    parts.push(current.trim());
    if (parts.length >= 4) {
      rows.push({ brand: parts[0], category: parts[3] });
    } else if (parts.length >= 2) {
      rows.push({ brand: parts[0], category: parts[parts.length - 1] });
    }
  }
  return rows;
}

/**
 * Fetch D2C brands and return { merchant_key: category }
 */
async function fetchD2CBrands() {
  const csv = await fetchUrl(D2C_BRANDS_URL);
  const rows = parseCSV(csv);
  const dict = {};
  for (const row of rows) {
    const brandName = (row.brand || '').trim().toLowerCase();
    const rawCategory = (row.category || '').trim().toLowerCase();
    if (!brandName) continue;
    const category = CATEGORY_MAP[rawCategory] || 'Shopping';
    dict[brandName] = category;
    // Also add common variants (e.g., "lenskart" and "lens kart")
    const slug = brandName.replace(/\s+/g, '');
    if (slug !== brandName) dict[slug] = category;
  }
  return dict;
}

/**
 * Get merged public merchant dictionary (static + fetched)
 * Caches result for 1 hour
 */
async function getPublicMerchantDictionary() {
  if (cachedPublicDict && (Date.now() - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedPublicDict;
  }
  try {
    const d2c = await fetchD2CBrands();
    cachedPublicDict = d2c;
    cacheTimestamp = Date.now();
    console.log(`✅ Loaded ${Object.keys(d2c).length} merchants from public D2C brands`);
    return d2c;
  } catch (error) {
    console.warn('⚠️ Failed to fetch public merchant sources:', error.message);
    return cachedPublicDict || {};
  }
}

/**
 * Get combined dictionary (caller merges with static)
 * Returns only the public/fetched entries - caller merges with dictionary.json
 */
async function loadPublicSources() {
  return getPublicMerchantDictionary();
}

module.exports = {
  loadPublicSources,
  getPublicMerchantDictionary,
  D2C_BRANDS_URL
};

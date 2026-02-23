/**
 * Tier 1: Receipt/screenshot parsing – extract amount, merchant, date from image via Gemini Vision
 */

const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const META_API_BASE = 'https://graph.facebook.com/v18.0';

/**
 * Get WhatsApp media URL from media ID (requires META_ACCESS_TOKEN)
 */
async function getMediaUrl(mediaId) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return null;
  try {
    const { data } = await axios.get(`${META_API_BASE}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data?.url || null;
  } catch (err) {
    console.error('Get media URL failed:', err.message);
    return null;
  }
}

/**
 * Download image to buffer (WhatsApp URL requires same token)
 */
async function downloadImage(url) {
  const token = process.env.META_ACCESS_TOKEN;
  try {
    const { data } = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return Buffer.isBuffer(data) ? data : Buffer.from(data);
  } catch (err) {
    console.error('Download image failed:', err.message);
    return null;
  }
}

/**
 * Extract transaction-like data from receipt/screenshot image using Gemini Vision
 * @param {Buffer} imageBuffer
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @returns {Promise<{ amount: number, merchant: string, date: string|null }|null>}
 */
async function parseReceiptImage(imageBuffer, mimeType = 'image/jpeg') {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.length < 10) {
    console.warn('GEMINI_API_KEY not set – receipt parsing disabled');
    return null;
  }
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const prompt = `Look at this image (receipt, bill, or UPI/screen screenshot). Extract:
1. Total amount paid (number only, in INR if in rupees, else convert to INR or use as number).
2. Merchant or payee name (store name, app name, or person).
3. Date of transaction if visible (YYYY-MM-DD or null).

Return ONLY a JSON object with these exact keys:
{ "amount_inr": <number or null>, "merchant_name": "<string or null>", "date": "<YYYY-MM-DD or null>" }
No explanation, no markdown.`;
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType || 'image/jpeg'
      }
    };
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```\n?/g, '');
    const parsed = JSON.parse(cleaned);
    const rawAmount = parsed.amount_inr != null ? parseFloat(parsed.amount_inr) : null;
    if (rawAmount == null || isNaN(rawAmount)) return null;
    const amount = Math.round(rawAmount * 100) / 100;
    return {
      amount,
      merchant: parsed.merchant_name || 'From receipt',
      date: parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null
    };
  } catch (err) {
    console.error('Receipt parse error:', err.message);
    return null;
  }
}

/**
 * Full flow: mediaId (from WhatsApp) -> URL -> download -> parse
 */
async function parseReceiptFromWhatsAppMedia(mediaId, mimeType = 'image/jpeg') {
  const url = await getMediaUrl(mediaId);
  if (!url) return null;
  const buffer = await downloadImage(url);
  if (!buffer) return null;
  return parseReceiptImage(buffer, mimeType);
}

module.exports = {
  getMediaUrl,
  downloadImage,
  parseReceiptImage,
  parseReceiptFromWhatsAppMedia
};

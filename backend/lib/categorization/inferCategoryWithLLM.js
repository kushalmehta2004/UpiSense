/**
 * Use Gemini to infer spending category from merchant/description when dictionary has no match.
 * E.g. "restaurant" → Food & Dining, "pharmacy" → Health
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getCategoryNames } = require('../categories/defaults.js');

let genAI = null;

function getGemini() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.length > 10) {
      genAI = new GoogleGenerativeAI(key);
    }
  }
  return genAI;
}

/**
 * Infer category from payment recipient/description using Gemini.
 * @param {string} merchantOrDescription - e.g. "restaurant", "paid to cafe", "auto"
 * @param {number|null} amount - optional, for context
 * @returns {Promise<string|null>} - Category name from DEFAULT_CATEGORIES or null
 */
async function inferCategoryWithLLM(merchantOrDescription, amount) {
  const ai = getGemini();
  if (!ai) return null;

  const categories = getCategoryNames();
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const model = ai.getGenerativeModel({ model: modelName });

  const prompt = `You are a spending categorizer. Given a payment recipient or description, pick the ONE best matching category.

Allowed categories (return exactly one of these names):
${categories.map(c => `- ${c}`).join('\n')}

Payment context:
- Recipient/description: "${(merchantOrDescription || '').trim()}"
${amount != null ? `- Amount: ₹${amount}` : ''}

Examples: "restaurant" → Food & Dining, "cafe" → Food & Dining, "auto" → Transport, "pharmacy" → Health, "netflix" → Subscriptions, "landlord" → Rent & Housing.

Return ONLY the exact category name from the list above, nothing else. If truly unclear, return "Other".`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/^["']|["']$/g, '').trim();
    if (categories.includes(cleaned)) return cleaned;
    if (cleaned === 'Other') return 'Other';
    return null;
  } catch (err) {
    console.error('inferCategoryWithLLM error:', err.message);
    return null;
  }
}

module.exports = { inferCategoryWithLLM };

/**
 * Unified intent agent: one LLM call to interpret any payment/expense message and return
 * a single structured output matching our schema (transaction or group_expense).
 * Like ChatGPT/Claude – the agent knows the desired output shape and interprets the message accordingly.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getCategoryNames } = require('../categories/defaults.js');

let genAI = null;

function getGemini() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.length > 10) genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

const CATEGORIES = getCategoryNames();

/**
 * Parse user message into exactly one of: transaction | group_expense.
 * Returns null if the message is not a payment/expense (e.g. "hello") or parsing fails.
 *
 * @returns {Promise<{
 *   type: 'transaction' | 'group_expense',
 *   amount: number,
 *   category: string,
 *   merchant_name?: string,
 *   group_name?: string,
 *   description?: string,
 *   shares?: Array<{ person: string, amount: number }> | null
 * } | null>}
 */
async function parseWithUnifiedAgent(text) {
  const ai = getGemini();
  if (!ai) return null;

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const model = ai.getGenerativeModel({ model: modelName });

  const prompt = `You are a financial assistant. The user sends messages about payments or group expenses. Your job is to interpret the message and output ONE structured JSON object that matches our schema.

Output schema (use exactly these field names):
- type: either "transaction" (simple payment to record) or "group_expense" (expense to add to a group, possibly with custom split)
- amount: number (INR)
- category: exactly one of these: ${CATEGORIES.join(', ')}. Infer from context: restaurant/cafe/dinner/food → "Food & Dining", cab/auto/uber → "Transport", pharmacy/medicine → "Health", etc.
- For type "transaction": include merchant_name (who/where the payment went).
- For type "group_expense": include group_name (e.g. "306", "Apartment", "Trip"), description (e.g. "dinner", "groceries"), and optionally shares. shares: null means equal split. Otherwise array of { "person": "me" or a name (e.g. "friend", "Raj", "Samkit"), "amount": number }. Sum of share amounts must equal total amount. "friend owes me 200" means friend's share is 200; "I owe 100 to Samkit" means my share is 100. Use "me" for the person who paid (the user). If only some shares are stated, add { "person": "others", "amount": remainder } so the sum equals total.

Examples:
- "500 to restaurant" → {"type":"transaction","amount":500,"category":"Food & Dining","merchant_name":"restaurant"}
- "Paid 500 to restaurant" → {"type":"transaction","amount":500,"category":"Food & Dining","merchant_name":"restaurant"}
- "Paid 200 for dinner at a restaurant" → {"type":"transaction","amount":200,"category":"Food & Dining","merchant_name":"restaurant"}
- "i paid 500 at a restaurant in group 306 for dinner where my friend owes me 200" → {"type":"group_expense","amount":500,"category":"Food & Dining","group_name":"306","description":"dinner","shares":[{"person":"friend","amount":200},{"person":"me","amount":300}]}
- "Expense 500 to 306 where friend owes 200" → {"type":"group_expense","amount":500,"category":"Food & Dining","group_name":"306","description":"expense","shares":[{"person":"friend","amount":200},{"person":"me","amount":300}]}
- "expense 500 dinner in Apartment" → {"type":"group_expense","amount":500,"category":"Food & Dining","group_name":"Apartment","description":"dinner","shares":null}
- "paid 500 for dinner in group 306 where I owe 100 to Samkit" → {"type":"group_expense","amount":500,"category":"Food & Dining","group_name":"306","description":"dinner","shares":[{"person":"me","amount":100},{"person":"Samkit","amount":100},{"person":"others","amount":300}]}

If the message is clearly NOT a payment or group expense (e.g. "hello", "what's the weather"), return exactly: {"type":"none"}
If there is an amount and recipient/merchant but no group, use type "transaction". If there is a group (by name or number like 306) and an expense, use type "group_expense".

Return ONLY valid JSON. No markdown, no code block, no explanation.`;

  const fullPrompt = `${prompt}\n\nUser message: "${(text || '').trim().replace(/"/g, '\\"')}"`;

  try {
    const result = await model.generateContent(fullPrompt);
    let responseText = result.response.text().trim();
    if (responseText.startsWith('```')) responseText = responseText.replace(/```json?\n?/g, '').replace(/```\n?/g, '');
    const parsed = JSON.parse(responseText);

    if (parsed.type === 'none') return null;

    const amount = parseFloat(parsed.amount);
    if (isNaN(amount) || amount <= 0) return null;

    const category = parsed.category && CATEGORIES.includes(parsed.category) ? parsed.category : 'Other';

    if (parsed.type === 'transaction') {
      const merchant = (parsed.merchant_name || '').trim() || 'Unknown';
      return { type: 'transaction', amount, category, merchant_name: merchant };
    }

    if (parsed.type === 'group_expense') {
      const groupName = (parsed.group_name || '').trim();
      if (!groupName) return null;
      const description = (parsed.description || 'Expense').trim();
      let shares = parsed.shares;
      if (shares && Array.isArray(shares)) {
        shares = shares
          .map(s => ({ person: String(s.person || '').trim(), amount: parseFloat(s.amount) }))
          .filter(s => s.person && !isNaN(s.amount) && s.amount > 0);
        const sum = shares.reduce((a, s) => a + s.amount, 0);
        if (Math.abs(sum - amount) > 0.02) {
          const remainder = Math.round((amount - sum) * 100) / 100;
          const meEntry = shares.find(s => s.person.toLowerCase() === 'me');
          if (meEntry) meEntry.amount = Math.round((meEntry.amount + remainder) * 100) / 100;
          else shares.push({ person: 'me', amount: remainder });
        }
      } else {
        shares = null;
      }
      return {
        type: 'group_expense',
        amount,
        category,
        group_name: groupName,
        description,
        shares: shares && shares.length > 0 ? shares : null
      };
    }

    return null;
  } catch (err) {
    console.error('unifiedIntentAgent error:', err.message);
    return null;
  }
}

/**
 * Whether to try the unified agent (message might be a payment or expense).
 * Skip if it's clearly a known command (help, budget, groups, etc.) or too short.
 */
function shouldTryAgent(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length < 3) return false;
  // Contains something that could be an amount (digit) and payment/expense cues
  const hasNumber = /\d+/.test(t);
  const looksLikePaymentOrExpense = /\b(?:paid|pay|expense|spent|to\s+\w+|in\s+group|owes?|owe\s+\d|for\s+\w+|at\s+a?\s*\w+)\b/i.test(t) || /^\d+\s+to\s+/i.test(t);
  return hasNumber && (looksLikePaymentOrExpense || t.split(/\s+/).length >= 3);
}

module.exports = { parseWithUnifiedAgent, shouldTryAgent };

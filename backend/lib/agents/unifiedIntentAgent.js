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
  if (!ai) {
    console.warn('unifiedIntentAgent: GEMINI_API_KEY not set or invalid – skipping');
    return null;
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = ai.getGenerativeModel({ model: modelName });

  const prompt = `You are a financial assistant. The user sends messages about payments, group expenses, or informal debt (IOUs). Your job is to interpret the message and output ONE structured JSON object that matches our schema.

Output schema (use exactly these field names):
- type: one of "transaction" | "group_expense" | "owed_to_me" | "i_owe" | "none"
- amount: number (INR) – required for all except type "none"
- For type "transaction": merchant_name (required – who/where; if unknown use "none" type), category. Always use "Food & Dining" for restaurant, cafe, dinner, food, eatery, bar, pub. Use "Transport" for cab, auto, uber, ola. Use "Health" for pharmacy, medicine.
- If the user says what the payment was for (e.g. "for dinner", "for groceries", "for petrol"), infer the category from that and set "is_p2p": false so we do NOT ask what it was for. E.g. "I paid Rachit 200 for dinner" → category "Food & Dining", merchant_name "Rachit", is_p2p false. "Paid John 500 for groceries" → category "Groceries", is_p2p false.
- If the recipient is clearly a person's name and the user did NOT state what it was for, add "is_p2p": true so we ask what it was for.
- For "500" alone or message with only an amount and no recipient, return {"type":"none"} – do not guess.
- For type "group_expense": group_name, description, shares (array or null). "friend owes me 200" = friend's share 200; "I owe 100 to Samkit" = my share 100. Sum of shares = amount.
- For type "owed_to_me": person_name (who owes the user). E.g. "Samkit owes me 500" → person_name "Samkit", amount 500. "Someone owes me 200" → person_name "Someone".
- For type "i_owe": person_name (who the user owes). E.g. "I owe Raj 500" → person_name "Raj", amount 500. "I owe someone 500" → person_name "Someone".

Examples:
- "100 to john" → {"type":"transaction","amount":100,"merchant_name":"john","category":"Other","is_p2p":true}
- "I paid Rachit 200 for dinner" → {"type":"transaction","amount":200,"merchant_name":"Rachit","category":"Food & Dining","is_p2p":false}
- "Paid 500 for groceries to mom" → {"type":"transaction","amount":500,"merchant_name":"mom","category":"Groceries","is_p2p":false}
- "500 to restaurant" → {"type":"transaction","amount":500,"category":"Food & Dining","merchant_name":"restaurant"}
- "Paid 500 to restaurant" → {"type":"transaction","amount":500,"category":"Food & Dining","merchant_name":"restaurant"}
- "500" only or just a number with no recipient → {"type":"none"}
- "Raj owes me 200" → {"type":"owed_to_me","person_name":"Raj","amount":200}
- "I owe Priya 500" → {"type":"i_owe","person_name":"Priya","amount":500}
- "I owe someone 500" → {"type":"i_owe","person_name":"Someone","amount":500}
- "Paid 500 to restaurant" → {"type":"transaction","amount":500,"category":"Food & Dining","merchant_name":"restaurant"}
- "i paid 500 at a restaurant in group 306 for dinner where my friend owes me 200" → {"type":"group_expense","amount":500,"category":"Food & Dining","group_name":"306","description":"dinner","shares":[{"person":"friend","amount":200},{"person":"me","amount":300}]}

If the message is clearly NOT a payment, group expense, or IOU (e.g. "hello", "500" alone), return exactly: {"type":"none"}
Do NOT return type "transaction" with merchant_name "Unknown" or empty – return "none" instead so we can ask who they paid.
Prefer "owed_to_me" when someone owes the user (e.g. "X owes me Y"). Prefer "i_owe" when the user owes someone (e.g. "I owe X Y").

Return ONLY valid JSON. No markdown, no code block, no explanation.`;

  const fullPrompt = `${prompt}\n\nUser message: "${(text || '').trim().replace(/"/g, '\\"')}"`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    if (!response) {
      console.error('unifiedIntentAgent: no response from Gemini');
      return null;
    }
    let responseText = response.text().trim();
    if (responseText.startsWith('```')) responseText = responseText.replace(/```json?\n?/g, '').replace(/```\n?/g, '');
    const parsed = JSON.parse(responseText);

    if (parsed.type === 'none') return null;

    const amount = parseFloat(parsed.amount);
    if (isNaN(amount) || amount <= 0) return null;

    const category = parsed.category && CATEGORIES.includes(parsed.category) ? parsed.category : 'Other';

    if (parsed.type === 'transaction') {
      const merchant = (parsed.merchant_name || '').trim();
      if (!merchant || merchant.toLowerCase() === 'unknown') return null;
      const category = parsed.category && CATEGORIES.includes(parsed.category) ? parsed.category : 'Other';
      const is_p2p = parsed.is_p2p === true || parsed.is_p2p === 'true';
      return { type: 'transaction', amount, category, merchant_name: merchant, is_p2p };
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

    if (parsed.type === 'owed_to_me') {
      const person_name = (parsed.person_name || 'Someone').trim();
      return { type: 'owed_to_me', person_name, amount };
    }

    if (parsed.type === 'i_owe') {
      const person_name = (parsed.person_name || 'Someone').trim();
      return { type: 'i_owe', person_name, amount };
    }

    return null;
  } catch (err) {
    console.error('unifiedIntentAgent error:', err.message);
    if (err.response) console.error('  response:', err.response);
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
  const looksLikePaymentOrExpense = /\b(?:paid|pay|expense|spent|to\s+\w+|in\s+group|owes?\s+me|i\s+owe|owe\s+\d|for\s+\w+|at\s+a?\s*\w+)\b/i.test(t) || /^\d+\s+to\s+/i.test(t);
  return hasNumber && (looksLikePaymentOrExpense || t.split(/\s+/).length >= 3);
}

module.exports = { parseWithUnifiedAgent, shouldTryAgent };

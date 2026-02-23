/**
 * Use Gemini to parse natural-language expense messages with optional custom splits.
 * E.g. "expense 500 dinner in Apartment, Raj owes 200, I owe 100"
 *      "paid 500 for dinner in group 306 where I owe 100 to Samkit"
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getGemini() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.length > 10) genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

/**
 * Parse expense message with optional custom shares.
 * @param {string} text - User message
 * @returns {Promise<{ amount: number, description: string, groupName: string, shares: Array<{ person: string, amount: number }> | null } | null>}
 * - person: 'me' for the sender, or a name (e.g. 'Raj', 'Samkit')
 * - shares: null means equal split; otherwise sum of amount must equal total amount
 */
async function parseExpenseWithLLM(text) {
  const ai = getGemini();
  if (!ai) return null;

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = ai.getGenerativeModel({ model: modelName });

  const prompt = `Parse this expense/split message into JSON. The user paid for something and is adding it to a group, possibly with custom split amounts.

Rules:
- total_amount: number (INR)
- description: short string (e.g. "dinner", "groceries")
- group_name: name of the group. Extract from "in X", "group X", "to X", "group 306", "expense 500 to 306" → use "306" or "X"
- shares: null if equal split. Otherwise array of { "person": "me" or a name, "amount": number }. "me" = the person who paid. Sum of amounts MUST equal total_amount. If user only states some shares (e.g. "Raj owes 200, I owe 100" for 500 total), add { "person": "others", "amount": remainder } so the sum equals total_amount.

Examples:
"expense 500 dinner in Apartment" → {"total_amount":500,"description":"dinner","group_name":"Apartment","shares":null}
"expense 500 to 306 where friend owes 200" → {"total_amount":500,"description":"expense","group_name":"306","shares":[{"person":"friend","amount":200},{"person":"me","amount":300}]}
"paid 500 for dinner in group 306, friend owes me 200" → total 500, friend's share 200, so my share 300: {"total_amount":500,"description":"dinner","group_name":"306","shares":[{"person":"friend","amount":200},{"person":"me","amount":300}]}
"expense 500 dinner in Apartment, Raj owes 200, I owe 100" → Raj 200, me 100, rest 200: {"total_amount":500,"description":"dinner","group_name":"Apartment","shares":[{"person":"Raj","amount":200},{"person":"me","amount":100},{"person":"others","amount":200}]}
"paid 500 for dinner in group 306 where I owe 100 to Samkit" → my share 100, Samkit gets 100 from me; rest 400: {"total_amount":500,"description":"dinner","group_name":"306","shares":[{"person":"me","amount":100},{"person":"Samkit","amount":100},{"person":"others","amount":300}]}

Return ONLY valid JSON. No markdown.

Message: "${text.replace(/"/g, '\\"')}"`;

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();
    if (responseText.startsWith('```')) responseText = responseText.replace(/```json?\n?/g, '').replace(/```\n?/g, '');
    const parsed = JSON.parse(responseText);
    const amount = parseFloat(parsed.total_amount);
    if (isNaN(amount) || amount <= 0) return null;
    const description = (parsed.description || 'Expense').trim();
    const groupName = (parsed.group_name || '').trim();
    if (!groupName) return null;
    let shares = parsed.shares;
    if (shares && Array.isArray(shares)) {
      shares = shares
        .map(s => ({ person: String(s.person || '').trim(), amount: parseFloat(s.amount) }))
        .filter(s => s.person && !isNaN(s.amount) && s.amount > 0);
      const sum = shares.reduce((a, s) => a + s.amount, 0);
      if (Math.abs(sum - amount) > 0.02) {
        const remainder = Math.round((amount - sum) * 100) / 100;
        if (remainder > 0) {
          const meEntry = shares.find(s => s.person.toLowerCase() === 'me');
          if (meEntry) meEntry.amount = Math.round((meEntry.amount + remainder) * 100) / 100;
          else shares.push({ person: 'me', amount: remainder });
        }
      }
    }
    return { amount, description, groupName, shares: shares && shares.length > 0 ? shares : null };
  } catch (err) {
    console.error('parseExpenseWithLLM error:', err.message);
    return null;
  }
}

module.exports = { parseExpenseWithLLM };

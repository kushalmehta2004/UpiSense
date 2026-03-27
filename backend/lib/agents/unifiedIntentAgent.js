/**
 * Unified intent agent: one LLM call to interpret any payment/expense message and return
 * a single structured output matching our schema (transaction or group_expense).
 * Like ChatGPT/Claude – the agent knows the desired output shape and interprets the message accordingly.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getCategoryNames } = require('../categories/defaults.js');
const { getTodayIST } = require('../dateUtils.js');

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

  const modelName = process.env.GEMINI_MODEL || 'gemma-3-27b-it';
  const model = ai.getGenerativeModel({ model: modelName });

  const prompt = `You are a financial assistant. The user sends messages about payments, group expenses, or informal debt (IOUs). Your job is to interpret the message and output ONE structured JSON object that matches our schema.

Output schema (use exactly these field names):
- type: one of "transaction" | "group_expense" | "owed_to_me" | "i_owe" | "paid_back" | "i_paid_back" | "report" | "forecast" | "set_budget" | "list_owed_to_me" | "list_i_owe" | "request_money" | "help" | "none"
- amount: number (INR) – required for all except type "none", "report", "forecast", "list_owed_to_me", "list_i_owe", "help"
- For type "transaction": merchant_name (required – who/where; if unknown use "none" type), category. Always use "Food & Dining" for restaurant, cafe, dinner, food, eatery, bar, pub. Use "Transport" for cab, auto, uber, ola. Use "Health" for pharmacy, medicine.
- IMPORTANT: "paid back" and "returned" are DEBT SETTLEMENTS, not expenses. Use type "paid_back" when someone who OWES the user pays them back (e.g. "Kushal paid back 1230", "Ravi returned my 500", "Priya paid me back 200"). Use type "i_paid_back" when the user pays back someone they owe (e.g. "I paid back Samkit 300", "I returned 500 to Raj"). Do NOT use type "transaction" for these – they are not transport or any expense category.
- If the user says what the payment was for (e.g. "for dinner", "for groceries", "for petrol"), infer the category from that and set "is_p2p": false so we do NOT ask what it was for. E.g. "I paid Rachit 200 for dinner" → category "Food & Dining", merchant_name "Rachit", is_p2p false. "Paid John 500 for groceries" → category "Groceries", is_p2p false.
- If the recipient is clearly a person's name and the user did NOT state what it was for, add "is_p2p": true so we ask what it was for.
- For "500" alone or message with only an amount and no recipient, return {"type":"none"} – do not guess.
- For type "group_expense": group_name, description, shares (array or null). "friend owes me 200" = friend's share 200; "I owe 100 to Samkit" = my share 100. Sum of shares = amount.
- For type "owed_to_me": person_name (who owes the user). E.g. "Samkit owes me 500" → person_name "Samkit", amount 500. "Someone owes me 200" → person_name "Someone".
- For type "i_owe": person_name (who the user owes). E.g. "I owe Raj 500" → person_name "Raj", amount 500. "I owe someone 500" → person_name "Someone".
- For type "paid_back": person_name (who paid the user back – someone who owed them). E.g. "Kushal paid back 1230" → person_name "Kushal", amount 1230. "Ravi returned my 500" → person_name "Ravi", amount 500. "Priya paid me back" with amount → person_name "Priya", amount.
- For type "i_paid_back": person_name (who the user paid back – someone they owed). E.g. "I paid back Samkit 300" → person_name "Samkit", amount 300. "I returned 500 to Raj" → person_name "Raj", amount 500.
- For type "report": report_month (number 0-11, 0 is Jan) based on user's mention of the month. If no year mentioned, assume the current year for report_year. If only year is mentioned, report_month is null. Example: "feb 2026" -> report_month: 1, report_year: 2026.
- For type "forecast": target_month (number 0-11, 0 is Jan) and target_year (YYYY). If the user says "predict next month" or "forecast my budget", infer the target month (usually the upcoming month) based on today's date: {{TODAY_IST}}.
- For type "set_budget": category (e.g., Food & Dining, Groceries, Travel), amount.
- For type "list_owed_to_me": no extra fields. Used for questions like "who owes me?"
- For type "list_i_owe": no extra fields. Used for questions like "who do I owe?"
- For type "request_money": person_name (the name/number to ask), amount.
- For type "help": no extra fields. Used for questions like "what can you do?" or "hi".
- expense_date (optional): use ONLY for type "transaction" or "group_expense". When the user mentions a date for the expense, set this to YYYY-MM-DD. Parse: "on 23rd February 2026", "on 23 Feb 2026", "23/02/2026", "yesterday", "day before yesterday", "last Monday", "on 20th" (current month). Use today's date (in IST) for "today" or when no date is mentioned. Today's date (IST) is: {{TODAY_IST}}. Do NOT include expense_date if the message has no date; we will use today. When you include expense_date, use exactly YYYY-MM-DD.

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
- "Kushal paid back 1230" → {"type":"paid_back","person_name":"Kushal","amount":1230}
- "Ravi returned my 500" → {"type":"paid_back","person_name":"Ravi","amount":500}
- "I paid back Samkit 300" → {"type":"i_paid_back","person_name":"Samkit","amount":300}
- "I returned 500 to Raj" → {"type":"i_paid_back","person_name":"Raj","amount":500}
- "Paid 500 to restaurant" → {"type":"transaction","amount":500,"category":"Food & Dining","merchant_name":"restaurant"}
- "i paid 500 at a restaurant in group 306 for dinner where my friend owes me 200" → {"type":"group_expense","amount":500,"category":"Food & Dining","group_name":"306","description":"dinner","shares":[{"person":"friend","amount":200},{"person":"me","amount":300}]}
- "Paid for dinner on 23rd February 2026 500 at restaurant" → {"type":"transaction","amount":500,"merchant_name":"restaurant","category":"Food & Dining","expense_date":"2026-02-23"}
- "Paid for dinner yesterday 300 to cafe" → {"type":"transaction","amount":300,"merchant_name":"cafe","category":"Food & Dining","expense_date":"<yesterday in YYYY-MM-DD>"}
- "Paid for dinner day before yesterday 400 at cafe" → {"type":"transaction","amount":400,"merchant_name":"cafe","category":"Food & Dining","expense_date":"<day before yesterday YYYY-MM-DD>"}
- "what did i spend this month" → {"type":"report","report_year":2026,"report_month":<current_month>}
- "monthly report for feb 2026" → {"type":"report","report_month":1,"report_year":2026}
- "predict my expenses for next month" → {"type":"forecast","target_month":<next_month>,"target_year":2026}
- "forecast my march budget" → {"type":"forecast","target_month":2,"target_year":2026}
- "set my food budget to 5000" → {"type":"set_budget","category":"Food & Dining","amount":5000}
- "who owes me money?" → {"type":"list_owed_to_me"}
- "who do i owe money to?" → {"type":"list_i_owe"}
- "ask rahul for 500" → {"type":"request_money","person_name":"rahul","amount":500}
- "what can you do?" → {"type":"help"}

If the message is clearly NOT a payment, group expense, or IOU (e.g. "hello", "500" alone), return exactly: {"type":"none"}
Do NOT return type "transaction" with merchant_name "Unknown" or empty – return "none" instead so we can ask who they paid.
Prefer "owed_to_me" when someone owes the user (e.g. "X owes me Y"). Prefer "i_owe" when the user owes someone (e.g. "I owe X Y").
Prefer "paid_back" when someone who owed the user returns money (e.g. "X paid back Y", "X returned my Y"). Prefer "i_paid_back" when the user pays back someone they owe (e.g. "I paid back X Y", "I returned Y to X").

Return ONLY valid JSON. No markdown, no code block, no explanation.`;

  const todayIST = getTodayIST();
  const promptWithDate = prompt.replace(/\{\{TODAY_IST\}\}/g, todayIST);
  const fullPrompt = `${promptWithDate}\n\nUser message: "${(text || '').trim().replace(/"/g, '\\"')}"`;

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

    const amount = parsed.amount !== undefined ? parseFloat(parsed.amount) : 0;
    const category = parsed.category && CATEGORIES.includes(parsed.category) ? parsed.category : 'Other';

    if (parsed.type === 'transaction') {
      const merchant = (parsed.merchant_name || '').trim();
      if (!merchant || merchant.toLowerCase() === 'unknown') return null;
      const category = parsed.category && CATEGORIES.includes(parsed.category) ? parsed.category : 'Other';
      const is_p2p = parsed.is_p2p === true || parsed.is_p2p === 'true';
      let expense_date = null;
      if (parsed.expense_date && typeof parsed.expense_date === 'string') {
        const d = parsed.expense_date.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) expense_date = d;
      }
      return { type: 'transaction', amount, category, merchant_name: merchant, is_p2p, expense_date };
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
      let expense_date = null;
      if (parsed.expense_date && typeof parsed.expense_date === 'string') {
        const d = parsed.expense_date.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) expense_date = d;
      }
      return {
        type: 'group_expense',
        amount,
        category,
        group_name: groupName,
        description,
        shares: shares && shares.length > 0 ? shares : null,
        expense_date
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

    if (parsed.type === 'paid_back') {
      const person_name = (parsed.person_name || 'Someone').trim();
      return { type: 'paid_back', person_name, amount };
    }

    if (parsed.type === 'i_paid_back') {
      const person_name = (parsed.person_name || 'Someone').trim();
      return { type: 'i_paid_back', person_name, amount };
    }

    if (parsed.type === 'report') {
      const now = new Date();
      let year = parsed.report_year ? parseInt(parsed.report_year, 10) : now.getFullYear();
      let month = parsed.report_month !== undefined && parsed.report_month !== null ? parseInt(parsed.report_month, 10) : now.getMonth();
      return { type: 'report', report_year: year, report_month: month };
    }

    if (parsed.type === 'forecast') {
      const now = new Date();
      let year = parsed.target_year ? parseInt(parsed.target_year, 10) : now.getFullYear();
      let month = parsed.target_month !== undefined && parsed.target_month !== null ? parseInt(parsed.target_month, 10) : (now.getMonth() + 1) % 12;
      return { type: 'forecast', target_year: year, target_month: month };
    }

    if (parsed.type === 'set_budget') {
      return { type: 'set_budget', category: category, amount };
    }

    if (parsed.type === 'list_owed_to_me') return { type: 'list_owed_to_me' };
    if (parsed.type === 'list_i_owe') return { type: 'list_i_owe' };
    if (parsed.type === 'help') return { type: 'help' };

    if (parsed.type === 'request_money') {
      const person_name = (parsed.person_name || 'Someone').trim();
      return { type: 'request_money', person_name, amount };
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
  if (t.length < 2) return false;
  
  const isInformationIntent = /\b(?:report|summary|spend|spending|budget|predict|forecast|who\s+owes|who\s+i|who\s+do\s+i|ask\s+|request\s+|remind\s+|help|menu|start|hi|hello)\b/i.test(t);
  const hasNumber = /\d+/.test(t);
  const looksLikePaymentOrExpense = /\b(?:paid|pay|expense|spent|to\s+\w+|in\s+group|owes?\s+me|i\s+owe|owe\s+\d|for\s+\w+|at\s+a?\s*\w+)\b/i.test(t) || /^\d+\s+to\s+/i.test(t);
  
  return isInformationIntent || (hasNumber && (looksLikePaymentOrExpense || t.split(/\s+/).length >= 3));
}

module.exports = { parseWithUnifiedAgent, shouldTryAgent };

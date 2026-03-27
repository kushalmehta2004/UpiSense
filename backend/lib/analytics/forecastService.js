/**
 * Future Expense Predictor (AI Forecaster)
 * Uses Gemini to analyze past month spending and predict future budget
 * taking into account macro trends like inflation, fuel prices, and festivals.
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
 * Fetches spending data for a specific month and year grouped by category.
 */
async function getMonthlySpending(supabase, userId, year, month) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  
  const { data, error } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', userId)
    .gte('timestamp', start.toISOString())
    .lte('timestamp', end.toISOString());
    
  if (error) throw error;
  
  const byCategory = {};
  let total = 0;
  
  (data || []).forEach(row => {
    const cat = row.category || 'Other';
    const amt = Number(row.amount || 0);
    byCategory[cat] = (byCategory[cat] || 0) + amt;
    total += amt;
  });
  
  return { byCategory, total, start, end };
}

/**
 * Generate a forecast message using Gemini based on past spending.
 */
async function generateForecastMessage(supabase, userId, targetYear, targetMonth) {
  const ai = getGemini();
  if (!ai) {
    throw new Error('AI service is not configured (missing key). Cannot generate forecast.');
  }

  // To predict targetMonth, we look at the user's spending from the *previous* month.
  let priorMonth = targetMonth - 1;
  let priorYear = targetYear;
  if (priorMonth < 0) {
    priorMonth = 11;
    priorYear -= 1;
  }

  const { byCategory, total, start } = await getMonthlySpending(supabase, userId, priorYear, priorMonth);
  
  const priorMonthName = start.toLocaleString('en-IN', { month: 'long' });
  const targetDate = new Date(Date.UTC(targetYear, targetMonth, 1));
  const targetMonthName = targetDate.toLocaleString('en-IN', { month: 'long' });

  if (total === 0) {
    return `🔮 *Budget Forecast - ${targetMonthName} ${targetYear}*\n\nI need at least 1 month of past spending data to generate a forecast. Start tracking your expenses and ask me again next month!`;
  }

  const spendingContext = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `${cat}: ₹${amt}`)
    .join('\n');

  const prompt = `You are a savvy, highly intelligent AI Financial Advisor for an Indian user. You speak in a smart, friendly, slightly casual but extremely insightful tone.

Your task is to predict the user's budget for ${targetMonthName} ${targetYear} based on their spending from last month (${priorMonthName} ${priorYear}).

User's past spending (${priorMonthName}):
Total: ₹${total}
Breakdown:
${spendingContext}

Instructions:
1. Act as an expert on current Indian macroeconomic realities (inflation, fuel price volatility, standard utility costs).
2. Consider any upcoming seasonal events in India during ${targetMonthName} (e.g. Diwali, Holi, wedding season, summer vacations, etc.) that might increase specific categories.
3. Factor in global trends if relevant (e.g. "fuel costs are unstable globally, expect transport to rise").
4. Provide a realistic budget prediction for ${targetMonthName}.
5. Give 2-3 specific, actionable warnings or suggestions based on their *actual* past categories (e.g. "You spent a lot on Food & Dining. Try to cut back by ₹500 to offset rising fuel prices").

Format the output nicely for WhatsApp, using bold text (*text*) and standard emojis. Keep it concise (max 150 words). Do NOT use markdown headers (#).`;

  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const model = ai.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return `🔮 *AI Budget Forecast - ${targetMonthName} ${targetYear}*\n\n${responseText.trim()}`;
  } catch (err) {
    console.error('Forecast generation error:', err);
    throw new Error('Failed to generate forecast with AI.');
  }
}

module.exports = {
  getMonthlySpending,
  generateForecastMessage
};

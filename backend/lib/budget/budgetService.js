/**
 * Tier 1: Monthly budget per category
 * Set via WhatsApp: "budget Food 15000" or "set budget Groceries 20000"
 */

const { DEFAULT_CATEGORIES } = require('../categories/defaults.js');

/**
 * Match user input to a category name (partial match, case-insensitive)
 * @param {string} input - e.g. "Food", "Groceries"
 * @returns {string|null} - Full category name or null
 */
function matchCategoryName(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim().toLowerCase();
  const names = DEFAULT_CATEGORIES.map(c => c.name);
  const exact = names.find(n => n.toLowerCase() === trimmed);
  if (exact) return exact;
  const partial = names.find(n => n.toLowerCase().includes(trimmed) || trimmed.includes(n.toLowerCase()));
  return partial || null;
}

/**
 * Parse "budget <category> <amount>" or "set budget <category> <amount>"
 * @param {string} text - Full message
 * @returns {{ category: string, amount: number }|null}
 */
function parseBudgetCommand(text) {
  const normalized = text.trim().toLowerCase();
  const setBudgetMatch = normalized.match(/^(?:set\s+)?budget\s+(.+?)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*$/);
  if (!setBudgetMatch) return null;
  const categoryPart = setBudgetMatch[1].trim();
  const amountStr = setBudgetMatch[2].replace(/,/g, '');
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return null;
  const category = matchCategoryName(categoryPart);
  if (!category) return null;
  return { category, amount };
}

/**
 * Set or update budget for user + category (monthly)
 */
async function setBudget(supabase, userId, category, amountLimit) {
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      {
        user_id: userId,
        category,
        amount_limit: amountLimit,
        period: 'monthly',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,category' }
    )
    .select('id, category, amount_limit')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Get total spend for user in category for current month (UTC)
 */
async function getSpendThisMonth(supabase, userId, category) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('category', category)
    .gte('timestamp', start.toISOString())
    .lte('timestamp', end.toISOString());
  if (error) throw error;
  const total = (data || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return total;
}

/**
 * Get budget for user + category if set
 */
async function getBudget(supabase, userId, category) {
  const { data, error } = await supabase
    .from('budgets')
    .select('amount_limit')
    .eq('user_id', userId)
    .eq('category', category)
    .maybeSingle();
  if (error) throw error;
  return data?.amount_limit != null ? Number(data.amount_limit) : null;
}

/**
 * After a transaction is saved: check if user has a budget for this category
 * and if spend is >= 80% or >= 100%, return alert message (or null)
 */
async function getBudgetAlertAfterTransaction(supabase, userId, category, newAmount) {
  const limit = await getBudget(supabase, userId, category);
  if (limit == null) return null;
  const spend = await getSpendThisMonth(supabase, userId, category);
  if (spend >= limit) {
    return `⚠️ *Budget alert:* Your *${category}* budget for this month is ₹${limit.toLocaleString('en-IN')}. You've spent ₹${spend.toLocaleString('en-IN')} (over limit).`;
  }
  const pct = (spend / limit) * 100;
  if (pct >= 80) {
    return `⚠️ *Budget alert:* You've used ${Math.round(pct)}% of your *${category}* budget (₹${spend.toLocaleString('en-IN')} of ₹${limit.toLocaleString('en-IN')}).`;
  }
  return null;
}

/**
 * List user's budgets for "my budgets" type command
 */
async function listBudgets(supabase, userId) {
  const { data, error } = await supabase
    .from('budgets')
    .select('category, amount_limit')
    .eq('user_id', userId)
    .order('category');
  if (error) throw error;
  return data || [];
}

module.exports = {
  matchCategoryName,
  parseBudgetCommand,
  setBudget,
  getSpendThisMonth,
  getBudget,
  getBudgetAlertAfterTransaction,
  listBudgets
};

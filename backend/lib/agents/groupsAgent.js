/**
 * Groups agent: claims messages about adding group expenses (equal or custom split).
 * E.g. "expense 500 to 306 where friend owes 200", "paid 500 dinner in Apartment, Raj owes 200"
 */

const { parseAddExpenseCommand, addExpense, addExpenseWithShares, resolveSharesToUserIds } = require('../expenses/expenseService.js');
const { findGroupByName } = require('../groups/groupService.js');
const { parseExpenseWithLLM } = require('../expenses/expenseLlmParser.js');

/** Whether this message looks like a group expense (add expense / split) */
function shouldHandle(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  const hasAmount = /(?:expense|paid|spent)\s*[\d,]+/i.test(t);
  const hasGroupOrSplit = /\b(?:in|group|to)\s+[\w\d]+/i.test(t) || /owes?|owe\s+\d/i.test(t);
  return hasAmount && hasGroupOrSplit;
}

/**
 * Process group expense. context: { supabase, userId, senderId, sendWhatsAppText, reply }
 * Returns true if handled, false to fall through.
 */
async function process(text, context) {
  const { supabase, userId, senderId, sendWhatsAppText, reply } = context;
  if (!supabase || !userId) return false;

  // 1) Try strict regex first: "expense 500 dinner in Apartment"
  const expenseInput = parseAddExpenseCommand(text);
  if (expenseInput) {
    try {
      const group = await findGroupByName(supabase, userId, expenseInput.groupName);
      if (!group) {
        await sendWhatsAppText(senderId, `❌ Group "${expenseInput.groupName}" not found. Reply _groups_ to see your groups.`);
        return true;
      }
      const expenseDate = new Date().toISOString().slice(0, 10);
      await addExpense(supabase, group.id, userId, expenseInput.amount, expenseInput.description, expenseDate);
      await sendWhatsAppText(senderId, `✅ Added expense: ₹${expenseInput.amount.toLocaleString('en-IN')} – ${expenseInput.description} in *${group.name}* (split equally).`);
      return true;
    } catch (err) {
      console.error('Groups agent (regex expense) error:', err.message);
      return false;
    }
  }

  // 2) Natural language: "expense 500 to 306 where friend owes 200"
  try {
    const llmExpense = await parseExpenseWithLLM(text);
    if (!llmExpense) return false;

    const group = await findGroupByName(supabase, userId, llmExpense.groupName);
    if (!group) {
      await sendWhatsAppText(senderId, `❌ Group "${llmExpense.groupName}" not found. Reply _groups_ to see your groups.`);
      return true;
    }
    const expenseDate = new Date().toISOString().slice(0, 10);
    if (llmExpense.shares && llmExpense.shares.length > 0) {
      const resolved = await resolveSharesToUserIds(supabase, group.id, userId, llmExpense.shares);
      if (resolved.length > 0) {
        await addExpenseWithShares(supabase, group.id, userId, llmExpense.amount, llmExpense.description, expenseDate, resolved);
        await sendWhatsAppText(senderId, `✅ Added expense: ₹${llmExpense.amount.toLocaleString('en-IN')} – ${llmExpense.description} in *${group.name}* (custom split).`);
      } else {
        await addExpense(supabase, group.id, userId, llmExpense.amount, llmExpense.description, expenseDate);
        await sendWhatsAppText(senderId, `✅ Added expense: ₹${llmExpense.amount.toLocaleString('en-IN')} – ${llmExpense.description} in *${group.name}* (split equally).`);
      }
    } else {
      await addExpense(supabase, group.id, userId, llmExpense.amount, llmExpense.description, expenseDate);
      await sendWhatsAppText(senderId, `✅ Added expense: ₹${llmExpense.amount.toLocaleString('en-IN')} – ${llmExpense.description} in *${group.name}* (split equally).`);
    }
    return true;
  } catch (err) {
    console.error('Groups agent (LLM expense) error:', err.message);
    return false;
  }
}

module.exports = { shouldHandle, process };

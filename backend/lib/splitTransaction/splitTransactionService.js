/**
 * Tier 1: "Split this transaction" – link last transaction to a group expense
 */

const { findGroupByName } = require('../groups/groupService.js');
const { addExpense } = require('../expenses/expenseService.js');

/**
 * Set pending split for user (last recorded transaction)
 */
async function setPendingSplit(supabase, userId, transactionId) {
  await supabase.from('pending_split_transaction').upsert(
    { user_id: userId, transaction_id: transactionId },
    { onConflict: 'user_id' }
  );
}

/**
 * Parse "split Apartment" or "split in Apartment"
 */
function parseSplitCommand(text) {
  const t = text.trim().toLowerCase();
  const match = t.match(/^split\s+(?:in\s+)?(.+)$/);
  return match ? match[1].trim() : null;
}

/**
 * If user has pending split and sent "split GroupName", create expense and clear pending
 */
async function handleSplitReply(supabase, userId, text) {
  const groupName = parseSplitCommand(text);
  if (!groupName) return { handled: false };
  const { data: pending } = await supabase
    .from('pending_split_transaction')
    .select('transaction_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!pending) return { handled: false };
  const { data: txn } = await supabase
    .from('transactions')
    .select('amount, merchant_name')
    .eq('id', pending.transaction_id)
    .single();
  if (!txn) {
    await supabase.from('pending_split_transaction').delete().eq('user_id', userId);
    return { handled: true, error: 'Transaction not found.' };
  }
  const group = await findGroupByName(supabase, userId, groupName);
  if (!group) return { handled: true, error: `Group "${groupName}" not found. Reply _groups_ to see your groups.` };
  const expenseDate = new Date().toISOString().slice(0, 10);
  await addExpense(supabase, group.id, userId, Number(txn.amount), txn.merchant_name || 'Split expense', expenseDate);
  await supabase.from('pending_split_transaction').delete().eq('user_id', userId);
  return { handled: true, message: `✅ Split ₹${Number(txn.amount).toLocaleString('en-IN')} in *${group.name}* (${txn.merchant_name || 'expense'}).` };
}

module.exports = {
  setPendingSplit,
  parseSplitCommand,
  handleSplitReply
};

/**
 * Tier 1: Recurring detection – suggest "Mark as recurring?" after similar transaction
 */

/**
 * Check if there's a similar transaction (same merchant, similar amount) in last 30 days
 */
async function findSimilarRecentTransaction(supabase, userId, merchant, amount) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data } = await supabase
    .from('transactions')
    .select('id, amount, merchant_name')
    .eq('user_id', userId)
    .eq('merchant_name', merchant)
    .gte('timestamp', thirtyDaysAgo.toISOString())
    .order('timestamp', { ascending: false })
    .limit(5);
  if (!data?.length) return null;
  const tolerance = 0.05;
  const similar = data.find(row => Math.abs(Number(row.amount) - amount) / amount <= tolerance);
  return similar || null;
}

/**
 * Set pending recurring suggestion for user (so next "yes" marks it)
 */
async function setPendingRecurringSuggestion(supabase, userId, transactionId) {
  await supabase.from('pending_recurring_suggestion').upsert(
    { user_id: userId, transaction_id: transactionId },
    { onConflict: 'user_id' }
  );
}

/**
 * If user replied yes to recurring, mark transaction and clear pending
 */
async function handleRecurringYes(supabase, userId) {
  const { data: pending } = await supabase
    .from('pending_recurring_suggestion')
    .select('transaction_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!pending) return false;
  await supabase.from('transactions').update({ is_recurring: true }).eq('id', pending.transaction_id);
  await supabase.from('pending_recurring_suggestion').delete().eq('user_id', userId);
  return true;
}

module.exports = {
  findSimilarRecentTransaction,
  setPendingRecurringSuggestion,
  handleRecurringYes
};

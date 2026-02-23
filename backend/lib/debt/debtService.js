/**
 * IOU / debt tracking: "X owes me" and "I owe X"
 * Separate list from transactions – informal debt only.
 */

/**
 * Add a debt entry (owed_to_me or i_owe)
 */
async function addDebtEntry(supabase, userId, direction, personName, amount, note) {
  const { error } = await supabase.from('debt_entries').insert([{
    user_id: userId,
    direction,
    person_name: (personName || 'Someone').trim(),
    amount: Number(amount),
    note: note ? String(note).trim().slice(0, 500) : null
  }]);
  if (error) throw error;
}

/**
 * Get all "owed to me" entries, summed by person
 */
async function getOwedToMe(supabase, userId) {
  const { data } = await supabase
    .from('debt_entries')
    .select('person_name, amount')
    .eq('user_id', userId)
    .eq('direction', 'owed_to_me');
  const byPerson = {};
  for (const row of data || []) {
    const name = (row.person_name || 'Someone').trim();
    byPerson[name] = (byPerson[name] || 0) + Number(row.amount);
  }
  return Object.entries(byPerson).map(([person_name, amount]) => ({ person_name, amount: Math.round(amount * 100) / 100 }));
}

/**
 * Get all "I owe" entries, summed by person
 */
async function getIOwe(supabase, userId) {
  const { data } = await supabase
    .from('debt_entries')
    .select('person_name, amount')
    .eq('user_id', userId)
    .eq('direction', 'i_owe');
  const byPerson = {};
  for (const row of data || []) {
    const name = (row.person_name || 'Someone').trim();
    byPerson[name] = (byPerson[name] || 0) + Number(row.amount);
  }
  return Object.entries(byPerson).map(([person_name, amount]) => ({ person_name, amount: Math.round(amount * 100) / 100 }));
}

/**
 * Format "who owes me" for WhatsApp
 */
function formatOwedToMeMessage(entries) {
  if (!entries.length) return '📋 *Who owes you*\n\nNo one owes you anything right now.';
  const lines = entries.map(e => `  • ${e.person_name}: ₹${e.amount.toLocaleString('en-IN')}`);
  return '📋 *Who owes you*\n\n' + lines.join('\n');
}

/**
 * Format "who I owe" for WhatsApp
 */
function formatIOweMessage(entries) {
  if (!entries.length) return '📋 *Who you owe*\n\nYou don\'t owe anyone right now.';
  const lines = entries.map(e => `  • ${e.person_name}: ₹${e.amount.toLocaleString('en-IN')}`);
  return '📋 *Who you owe*\n\n' + lines.join('\n');
}

/**
 * Parse "who owes me" / "owed to me" / "list owed to me"
 */
function parseOwedToMeCommand(text) {
  const t = text.trim().toLowerCase();
  if (/^(?:who\s+owes\s+me|owed\s+to\s+me|list\s+owed\s+to\s+me|people\s+who\s+owe\s+me)$/i.test(t)) return true;
  return false;
}

/**
 * Parse "i owe" / "who i owe" / "my debts" / "who do i owe"
 */
function parseIOweCommand(text) {
  const t = text.trim().toLowerCase();
  if (/^(?:i\s+owe|who\s+i\s+owe|my\s+debts|who\s+do\s+i\s+owe|people\s+i\s+owe)$/i.test(t)) return true;
  return false;
}

module.exports = {
  addDebtEntry,
  getOwedToMe,
  getIOwe,
  formatOwedToMeMessage,
  formatIOweMessage,
  parseOwedToMeCommand,
  parseIOweCommand
};

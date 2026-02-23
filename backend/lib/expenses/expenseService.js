/**
 * Tier 1: Add expense (equal split), balance summary, settle up
 */

const { findGroupByName } = require('../groups/groupService.js');

/**
 * Parse "expense 500 dinner in Apartment" or "expense 900 in Trip"
 */
function parseAddExpenseCommand(text) {
  const t = text.trim();
  const match = t.match(/^expense\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:(.+?)\s+)?in\s+(.+)$/i);
  if (!match) return null;
  const amount = parseFloat(match[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;
  const description = match[2]?.trim() || 'Expense';
  const groupName = match[3].trim();
  return { amount, description, groupName };
}

/**
 * Get group member user_ids (only UpiSense users) for equal split
 */
async function getGroupMemberUserIds(supabase, groupId) {
  const { data } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .not('user_id', 'is', null);
  return [...new Set((data || []).map(r => r.user_id).filter(Boolean))];
}

/**
 * Add expense: paid_by pays full amount, split equally among all group members (with user_id)
 */
async function addExpense(supabase, groupId, paidByUserId, amount, description, expenseDate) {
  const memberIds = await getGroupMemberUserIds(supabase, groupId);
  if (memberIds.length === 0) throw new Error('Group has no members with UpiSense accounts');
  const share = Math.round((amount / memberIds.length) * 100) / 100;
  const { data: expense, error: eErr } = await supabase
    .from('expenses')
    .insert([{ group_id: groupId, paid_by_user_id: paidByUserId, amount, description, expense_date: expenseDate }])
    .select('id')
    .single();
  if (eErr) throw eErr;
  await supabase.from('expense_participants').insert(
    memberIds.map(uid => ({ expense_id: expense.id, user_id: uid, share_amount: share }))
  );
  return expense.id;
}

/**
 * Add expense with custom shares. shares = [{ user_id, amount }]. Sum of amounts must equal total (with 0.02 tolerance).
 */
async function addExpenseWithShares(supabase, groupId, paidByUserId, amount, description, expenseDate, shares) {
  const sum = shares.reduce((a, s) => a + Number(s.amount), 0);
  if (Math.abs(sum - amount) > 0.02) throw new Error('Share amounts must sum to the total expense amount');
  const { data: expense, error: eErr } = await supabase
    .from('expenses')
    .insert([{ group_id: groupId, paid_by_user_id: paidByUserId, amount, description, expense_date: expenseDate }])
    .select('id')
    .single();
  if (eErr) throw eErr;
  const rows = shares.map(s => ({ expense_id: expense.id, user_id: s.user_id, share_amount: Number(s.amount) }));
  const { error: pErr } = await supabase.from('expense_participants').insert(rows);
  if (pErr) throw pErr;
  return expense.id;
}

/**
 * Compute net balance: for each (from, to) how much from owes to.
 * Returns Map of "fromUserId_toUserId" -> amount (positive = from owes to)
 */
async function computeBalances(supabase, groupId) {
  const { data: exps } = await supabase
    .from('expenses')
    .select('id, paid_by_user_id, amount')
    .eq('group_id', groupId);
  const balances = {};
  const getKey = (a, b) => `${a}_${b}`;
  for (const e of exps || []) {
    const { data: parts } = await supabase
      .from('expense_participants')
      .select('user_id, share_amount')
      .eq('expense_id', e.id);
    const payer = e.paid_by_user_id;
    for (const p of parts || []) {
      if (p.user_id === payer) continue;
      const k = getKey(p.user_id, payer);
      balances[k] = (balances[k] || 0) + Number(p.share_amount);
    }
  }
  const { data: settles } = await supabase
    .from('settle_ups')
    .select('from_user_id, to_user_id, amount')
    .eq('group_id', groupId);
  for (const s of settles || []) {
    const k = getKey(s.from_user_id, s.to_user_id);
    balances[k] = (balances[k] || 0) - Number(s.amount);
  }
  return balances;
}

/**
 * Get "you owe" and "you're owed" for a user in a group. Returns { youOwe: [{ userId, amount }], owedToYou: [{ userId, amount }] }
 */
async function getBalanceForUser(supabase, groupId, userId) {
  const balances = await computeBalances(supabase, groupId);
  const youOwe = [];
  const owedToYou = [];
  for (const [key, amt] of Object.entries(balances)) {
    const num = Math.round(Number(amt) * 100) / 100;
    if (num <= 0) continue;
    const [fromId, toId] = key.split('_');
    if (fromId === userId) youOwe.push({ userId: toId, amount: num });
    if (toId === userId) owedToYou.push({ userId: fromId, amount: num });
  }
  return { youOwe, owedToYou };
}

/**
 * Format balance message for WhatsApp (with user names/phones)
 */
async function formatBalanceMessage(supabase, groupName, youOwe, owedToYou, currentUserId) {
  const userIds = [...youOwe.map(o => o.userId), ...owedToYou.map(o => o.userId)];
  const uniq = [...new Set(userIds)];
  let names = {};
  if (uniq.length > 0) {
    const { data: users } = await supabase.from('users').select('id, name, phone').in('id', uniq);
    (users || []).forEach(u => { names[u.id] = u.name || u.phone || u.id.slice(0, 8); });
  }
  const lines = [`📊 *${groupName}* – Your balance`, ''];
  if (youOwe.length === 0 && owedToYou.length === 0) {
    lines.push('You\'re all settled up! 🎉');
    return lines.join('\n');
  }
  if (youOwe.length > 0) {
    lines.push('*You owe:*');
    youOwe.forEach(o => lines.push(`  ${names[o.userId] || o.userId}: ₹${o.amount.toLocaleString('en-IN')}`));
    lines.push('');
  }
  if (owedToYou.length > 0) {
    lines.push('*You\'re owed:*');
    owedToYou.forEach(o => lines.push(`  ${names[o.userId] || o.userId}: ₹${o.amount.toLocaleString('en-IN')}`));
  }
  return lines.join('\n');
}

/**
 * Parse "balance Apartment" or "balance in Trip"
 */
function parseBalanceCommand(text) {
  const t = text.trim();
  const match = t.match(/^balance\s+(?:in\s+)?(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Record settle-up: fromUser paid toUser amount
 */
async function settleUp(supabase, groupId, fromUserId, toUserId, amount) {
  const { error } = await supabase
    .from('settle_ups')
    .insert([{ group_id: groupId, from_user_id: fromUserId, to_user_id: toUserId, amount }]);
  if (error) throw error;
}

/**
 * Parse "settle 500 with Raj" or "settle up 500 to 919876543210 in Apartment"
 * We need to identify "Raj" or phone – for now support "settle <amount> with <name or last 4 digits>" or "settle <amount> to <phone> in <group>"
 */
function parseSettleCommand(text) {
  const t = text.trim();
  let match = t.match(/^settle(?:\s+up)?\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s+to\s+(\d+)\s+in\s+(.+)$/i);
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    const phone = match[2].replace(/\D/g, '');
    const groupName = match[3].trim();
    return { amount, toPhone: phone.length === 10 ? `91${phone}` : phone, groupName };
  }
  match = t.match(/^settle(?:\s+up)?\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s+with\s+(.+)\s+in\s+(.+)$/i);
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    const toIdentifier = match[2].trim();
    const groupName = match[3].trim();
    return { amount, toNameOrPhone: toIdentifier, groupName };
  }
  return null;
}

/**
 * Resolve "to" in settle: by phone or by name (match user in group)
 */
async function resolveSettleToUser(supabase, groupId, toPhoneOrName) {
  const numeric = toPhoneOrName.replace(/\D/g, '');
  const phone = numeric.length >= 10 ? (numeric.length === 10 ? `91${numeric}` : numeric) : null;
  if (phone) {
    const { data: byPhone } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('phone', phone)
      .not('user_id', 'is', null)
      .limit(1);
    if (byPhone?.[0]) return byPhone[0].user_id;
  }
  const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', groupId).not('user_id', 'is', null);
  const userIds = [...new Set((members || []).map(m => m.user_id))];
  if (userIds.length === 0) return null;
  const { data: users } = await supabase.from('users').select('id, name, phone, whatsapp_number').in('id', userIds);
  const nameLower = toPhoneOrName.toLowerCase();
  for (const u of users || []) {
    if (u.phone === phone || u.whatsapp_number === phone) return u.id;
    if (u.name && u.name.toLowerCase().includes(nameLower)) return u.id;
    if (numeric.length >= 4 && (String(u.phone || '').endsWith(numeric.slice(-4)) || String(u.whatsapp_number || '').endsWith(numeric.slice(-4)))) return u.id;
  }
  return null;
}

/**
 * Resolve LLM share entries to [{ user_id, amount }]. person "me" → paidByUserId; "others" → split among members not yet in shares; names → resolveSettleToUser.
 */
async function resolveSharesToUserIds(supabase, groupId, paidByUserId, shares) {
  const memberIds = await getGroupMemberUserIds(supabase, groupId);
  if (memberIds.length === 0) throw new Error('Group has no members with UpiSense accounts');
  const result = [];
  const othersEntry = shares.find(s => (String(s.person || '').toLowerCase() === 'others'));
  const othersAmount = othersEntry ? othersEntry.amount : 0;
  const rest = shares.filter(s => (String(s.person || '').toLowerCase() !== 'others'));
  const resolvedIds = new Set();
  for (const s of rest) {
    const person = String(s.person || '').trim();
    let uid = null;
    if (person.toLowerCase() === 'me') uid = paidByUserId;
    else uid = await resolveSettleToUser(supabase, groupId, person);
    if (uid) {
      result.push({ user_id: uid, amount: s.amount });
      resolvedIds.add(uid);
    }
  }
  if (othersAmount > 0) {
    const remaining = memberIds.filter(id => !resolvedIds.has(id));
    if (remaining.length === 0) {
      const meShare = result.find(r => r.user_id === paidByUserId);
      if (meShare) meShare.amount = Math.round((meShare.amount + othersAmount) * 100) / 100;
      else result.push({ user_id: paidByUserId, amount: othersAmount });
    } else {
      const perPerson = Math.round((othersAmount / remaining.length) * 100) / 100;
      let extra = Math.round((othersAmount - perPerson * remaining.length) * 100) / 100;
      remaining.forEach((id, i) => {
        result.push({ user_id: id, amount: perPerson + (i === 0 ? extra : 0) });
      });
    }
  }
  // Merge same user_id (e.g. "me" + "others" → one row per user)
  const byUser = new Map();
  for (const r of result) {
    byUser.set(r.user_id, (byUser.get(r.user_id) || 0) + r.amount);
  }
  return [...byUser.entries()].map(([user_id, amount]) => ({ user_id, amount: Math.round(amount * 100) / 100 }));
}

module.exports = {
  parseAddExpenseCommand,
  addExpense,
  addExpenseWithShares,
  resolveSharesToUserIds,
  getBalanceForUser,
  formatBalanceMessage,
  parseBalanceCommand,
  settleUp,
  parseSettleCommand,
  resolveSettleToUser,
  getGroupMemberUserIds
};

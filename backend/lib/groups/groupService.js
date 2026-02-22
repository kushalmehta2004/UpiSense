/**
 * Tier 1: Expense groups – create, add members, list
 */

const { normalizeForWhatsApp } = require('../phoneUtils.js');

/**
 * Parse "create group <name>" or "new group <name>"
 */
function parseCreateGroupCommand(text) {
  const t = text.trim();
  const match = t.match(/^(?:create|new)\s+group\s+(.+)$/i);
  if (!match) return null;
  const name = match[1].trim();
  return name.length > 0 ? name : null;
}

/**
 * Parse "add <phone> to <group>" – phone can be digits or "name" (we use digits)
 */
function parseAddToGroupCommand(text) {
  const t = text.trim();
  const match = t.match(/^add\s+(.+?)\s+to\s+(.+)$/i);
  if (!match) return null;
  const phonePart = match[1].trim();
  const groupName = match[2].trim();
  const phone = phonePart.replace(/\D/g, '');
  if (phone.length < 10 || !groupName) return null;
  const normalizedPhone = phone.length === 10 ? `91${phone}` : phone;
  return { phone: normalizedPhone, groupName };
}

/**
 * Create group and add creator as first member
 */
async function createGroup(supabase, userId, groupName, creatorPhone) {
  const { data: group, error: gErr } = await supabase
    .from('expense_groups')
    .insert([{ name: groupName, created_by_user_id: userId, currency: 'INR' }])
    .select('id, name')
    .single();
  if (gErr) throw gErr;
  await supabase.from('group_members').insert([{
    group_id: group.id,
    user_id: userId,
    phone: normalizeForWhatsApp(creatorPhone)
  }]);
  return group;
}

/**
 * Find group by name for user (groups they belong to)
 */
async function findGroupByName(supabase, userId, groupName) {
  const { data: members } = await supabase
    .from('group_members')
    .select('group_id, expense_groups(id, name)')
    .eq('user_id', userId);
  if (!members?.length) return null;
  const byName = members.find(m => m.expense_groups?.name?.toLowerCase() === groupName.toLowerCase());
  if (byName) return { id: byName.expense_groups.id, name: byName.expense_groups.name };
  const { data: groups } = await supabase
    .from('expense_groups')
    .select('id, name')
    .eq('created_by_user_id', userId)
    .ilike('name', groupName);
  if (groups?.[0]) return groups[0];
  return null;
}

/**
 * Add member to group by phone. If user exists with that phone, link user_id.
 */
async function addMemberToGroup(supabase, groupId, phone, addedByUserId) {
  const normalized = normalizeForWhatsApp(phone);
  let userId = null;
  const { data: u } = await supabase.from('users').select('id').or(`phone.eq.${normalized},whatsapp_number.eq.${normalized}`).limit(1);
  if (u?.[0]) userId = u[0].id;
  const { error } = await supabase
    .from('group_members')
    .upsert(
      { group_id: groupId, user_id: userId, phone: normalized, added_at: new Date().toISOString() },
      { onConflict: 'group_id,phone' }
    );
  if (error) throw error;
  return { phone: normalized, userId };
}

/**
 * List groups for user (member or creator)
 */
async function listGroupsForUser(supabase, userId) {
  const { data: created } = await supabase
    .from('expense_groups')
    .select('id, name')
    .eq('created_by_user_id', userId);
  const { data: memberOf } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);
  const ids = new Set([...(created || []).map(c => c.id), ...(memberOf || []).map(m => m.group_id)]);
  if (ids.size === 0) return created || [];
  const { data: all } = await supabase
    .from('expense_groups')
    .select('id, name')
    .in('id', [...ids]);
  return all || [];
}

module.exports = {
  parseCreateGroupCommand,
  parseAddToGroupCommand,
  createGroup,
  findGroupByName,
  addMemberToGroup,
  listGroupsForUser
};

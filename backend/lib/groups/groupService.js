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
    .select('id, name, created_by_user_id')
    .eq('created_by_user_id', userId);
  const { data: memberOf } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);
  const ids = new Set([...(created || []).map(c => c.id), ...(memberOf || []).map(m => m.group_id)]);
  if (ids.size === 0) return (created || []).map(c => ({ ...c, isCreator: true }));
  const { data: all } = await supabase
    .from('expense_groups')
    .select('id, name, created_by_user_id')
    .in('id', [...ids]);
  return (all || []).map(g => ({ id: g.id, name: g.name, isCreator: g.created_by_user_id === userId }));
}

/**
 * Create group from dashboard (creator phone from users table)
 */
async function createGroupFromDashboard(supabase, userId, groupName) {
  const { data: user } = await supabase.from('users').select('phone, whatsapp_number').eq('id', userId).single();
  const creatorPhone = user?.whatsapp_number || user?.phone || String(userId).replace(/-/g, '').slice(0, 15);
  return createGroup(supabase, userId, groupName, creatorPhone);
}

/**
 * Delete group – only creator can delete
 */
async function deleteGroup(supabase, groupId, userId) {
  const { data: group } = await supabase
    .from('expense_groups')
    .select('created_by_user_id')
    .eq('id', groupId)
    .single();
  if (!group || group.created_by_user_id !== userId) {
    throw new Error('Only the group creator can delete the group');
  }
  const { error } = await supabase.from('expense_groups').delete().eq('id', groupId);
  if (error) throw error;
}

/**
 * Update group name – only creator
 */
async function updateGroupName(supabase, groupId, userId, newName) {
  const { data: group } = await supabase
    .from('expense_groups')
    .select('created_by_user_id')
    .eq('id', groupId)
    .single();
  if (!group || group.created_by_user_id !== userId) {
    throw new Error('Only the group creator can rename the group');
  }
  const { error } = await supabase
    .from('expense_groups')
    .update({ name: newName.trim(), updated_at: new Date().toISOString() })
    .eq('id', groupId);
  if (error) throw error;
}

/**
 * Remove a member from the group. Creator can remove anyone; member can remove themselves (leave).
 * memberId = group_members.id
 */
async function removeMemberFromGroup(supabase, groupId, memberId, userId) {
  const { data: memberRow } = await supabase
    .from('group_members')
    .select('id, user_id')
    .eq('id', memberId)
    .eq('group_id', groupId)
    .single();
  if (!memberRow) throw new Error('Member not found');
  const { data: group } = await supabase
    .from('expense_groups')
    .select('created_by_user_id')
    .eq('id', groupId)
    .single();
  const isCreator = group?.created_by_user_id === userId;
  const isSelf = memberRow.user_id === userId;
  if (!isCreator && !isSelf) throw new Error('Only the creator can remove other members');
  const { error } = await supabase.from('group_members').delete().eq('id', memberId).eq('group_id', groupId);
  if (error) throw error;
}

/**
 * List members of a group (for dashboard)
 */
async function getGroupMembers(supabase, groupId) {
  const { data, error } = await supabase
    .from('group_members')
    .select('id, user_id, phone, display_name')
    .eq('group_id', groupId)
    .order('added_at', { ascending: true });
  if (error) throw error;
  const userIds = [...new Set((data || []).map(m => m.user_id).filter(Boolean))];
  let names = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, name, phone').in('id', userIds);
    (users || []).forEach(u => { names[u.id] = u.name || u.phone || u.id.slice(0, 8); });
  }
  return (data || []).map(m => ({
    ...m,
    name: m.user_id ? (names[m.user_id] || m.phone) : m.phone,
  }));
}

module.exports = {
  parseCreateGroupCommand,
  parseAddToGroupCommand,
  createGroup,
  createGroupFromDashboard,
  findGroupByName,
  addMemberToGroup,
  listGroupsForUser,
  deleteGroup,
  updateGroupName,
  removeMemberFromGroup,
  getGroupMembers,
};

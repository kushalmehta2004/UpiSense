/**
 * Dashboard API – Groups, budgets, family, report
 * All endpoints require JWT and are user-scoped.
 */

const { createClient } = require('@supabase/supabase-js');
const { listGroupsForUser } = require('../lib/groups/groupService.js');
const { getBalanceForUser } = require('../lib/expenses/expenseService.js');
const { listBudgets, getSpendThisMonth } = require('../lib/budget/budgetService.js');
const { getFamilySpendingThisMonth } = require('../lib/family/familyService.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const plugin = async (fastify) => {
  /**
   * GET /api/groups
   * List expense groups for the current user
   */
  fastify.get('/api/groups', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const groups = await listGroupsForUser(supabase, userId);
      return reply.send({ success: true, groups });
    } catch (error) {
      console.error('❌ Groups list error:', error.message);
      return reply.code(500).send({ error: error.message || 'Server error' });
    }
  });

  /**
   * GET /api/groups/summary
   * Totals across all groups: totalYouOwe, totalOwedToYou, and per-group breakdown
   */
  fastify.get('/api/groups/summary', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const groups = await listGroupsForUser(supabase, userId);
      let totalYouOwe = 0;
      let totalOwedToYou = 0;
      const perGroup = [];
      for (const g of groups) {
        const { youOwe, owedToYou } = await getBalanceForUser(supabase, g.id, userId);
        const youOweSum = youOwe.reduce((s, o) => s + o.amount, 0);
        const owedSum = owedToYou.reduce((s, o) => s + o.amount, 0);
        totalYouOwe += youOweSum;
        totalOwedToYou += owedSum;
        perGroup.push({ id: g.id, name: g.name, youOwe: youOweSum, owedToYou: owedSum });
      }
      return reply.send({
        success: true,
        totalYouOwe,
        totalOwedToYou,
        groupCount: groups.length,
        groups: perGroup
      });
    } catch (error) {
      console.error('❌ Groups summary error:', error.message);
      return reply.code(500).send({ error: error.message || 'Server error' });
    }
  });

  /**
   * GET /api/groups/:id
   * Group detail: name, balance for current user (you owe / owed to you with names), recent expenses
   */
  fastify.get('/api/groups/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const { id: groupId } = request.params;

      const { data: group, error: gErr } = await supabase
        .from('expense_groups')
        .select('id, name, currency')
        .eq('id', groupId)
        .single();
      if (gErr || !group) return reply.code(404).send({ error: 'Group not found' });

      const { data: membership } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
      if (!membership) return reply.code(403).send({ error: 'Not a member of this group' });

      const { youOwe, owedToYou } = await getBalanceForUser(supabase, groupId, userId);
      const userIds = [...youOwe.map(o => o.userId), ...owedToYou.map(o => o.userId)];
      let userNames = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, name, phone').in('id', userIds);
        (users || []).forEach(u => { userNames[u.id] = u.name || u.phone || u.id.slice(0, 8); });
      }

      const youOweWithNames = youOwe.map(o => ({ ...o, name: userNames[o.userId] || 'Unknown' }));
      const owedToYouWithNames = owedToYou.map(o => ({ ...o, name: userNames[o.userId] || 'Unknown' }));

      const { data: expenses } = await supabase
        .from('expenses')
        .select('id, amount, description, expense_date, paid_by_user_id, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(20);
      const payerIds = [...new Set((expenses || []).map(e => e.paid_by_user_id).filter(Boolean))];
      let payerNames = {};
      if (payerIds.length > 0) {
        const { data: payers } = await supabase.from('users').select('id, name, phone').in('id', payerIds);
        (payers || []).forEach(u => { payerNames[u.id] = u.name || u.phone || 'Unknown'; });
      }
      const expensesWithPayer = (expenses || []).map(e => ({
        ...e,
        paid_by_name: payerNames[e.paid_by_user_id] || 'Unknown'
      }));

      return reply.send({
        success: true,
        group,
        youOwe: youOweWithNames,
        owedToYou: owedToYouWithNames,
        expenses: expensesWithPayer
      });
    } catch (error) {
      console.error('❌ Group detail error:', error.message);
      return reply.code(500).send({ error: error.message || 'Server error' });
    }
  });

  /**
   * GET /api/budgets
   * List budgets with current month spend for each
   */
  fastify.get('/api/budgets', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const budgets = await listBudgets(supabase, userId);
      const withSpend = await Promise.all(
        budgets.map(async (b) => {
          const spend = await getSpendThisMonth(supabase, userId, b.category);
          return {
            ...b,
            spend,
            limit: Number(b.amount_limit),
            percent: b.amount_limit > 0 ? Math.min(100, Math.round((spend / Number(b.amount_limit)) * 100)) : 0
          };
        })
      );
      return reply.send({ success: true, budgets: withSpend });
    } catch (error) {
      console.error('❌ Budgets list error:', error.message);
      return reply.code(500).send({ error: error.message || 'Server error' });
    }
  });

  /**
   * GET /api/family/summary
   * Combined spending (you + linked family) for current month
   */
  fastify.get('/api/family/summary', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const data = await getFamilySpendingThisMonth(supabase, userId);
      const summary = Object.entries(data.byCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
      return reply.send({
        success: true,
        byCategory: summary,
        total: data.total,
        from: data.start.toISOString().slice(0, 10),
        to: data.end.toISOString().slice(0, 10)
      });
    } catch (error) {
      console.error('❌ Family summary error:', error.message);
      return reply.code(500).send({ error: error.message || 'Server error' });
    }
  });

  /**
   * GET /api/report
   * Spending by category for a period (same as WhatsApp report). Query: from=YYYY-MM-DD, to=YYYY-MM-DD (default: current month)
   */
  fastify.get('/api/report', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const { from, to } = request.query;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const fromDate = from || startOfMonth.toISOString().slice(0, 10);
      const toDate = to || endOfMonth.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', userId)
        .gte('timestamp', `${fromDate}T00:00:00`)
        .lte('timestamp', `${toDate}T23:59:59`);
      if (error) throw error;

      const byCategory = {};
      (data || []).forEach(row => {
        const cat = row.category || 'Other';
        byCategory[cat] = (byCategory[cat] || 0) + Number(row.amount || 0);
      });
      const summary = Object.entries(byCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
      const total = summary.reduce((s, x) => s + x.amount, 0);

      return reply.send({
        success: true,
        byCategory: summary,
        total,
        from: fromDate,
        to: toDate
      });
    } catch (error) {
      console.error('❌ Report error:', error.message);
      return reply.code(500).send({ error: error.message || 'Server error' });
    }
  });
};

module.exports = plugin;

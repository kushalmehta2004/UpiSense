/**
 * Dashboard API - Transactions, summary, daily trend
 * All endpoints require JWT and are user-scoped.
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const plugin = async (fastify) => {
  /**
   * GET /api/transactions
   * List transactions with pagination and filters
   * Query: page=1, limit=20, category=..., from=YYYY-MM-DD, to=YYYY-MM-DD, search=...
   */
  fastify.get('/api/transactions', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const { page = 1, limit = 20, category, from, to, search } = request.query;

      let query = supabase
        .from('transactions')
        .select('id, amount, merchant_name, category, source_app, timestamp, created_at', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }
      if (from) {
        query = query.gte('timestamp', `${from}T00:00:00`);
      }
      if (to) {
        query = query.lte('timestamp', `${to}T23:59:59`);
      }
      if (search && search.trim()) {
        query = query.or(`merchant_name.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%`);
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const fromIdx = (pageNum - 1) * limitNum;

      const { data, error, count } = await query.range(fromIdx, fromIdx + limitNum - 1);

      if (error) throw error;

      return reply.send({
        success: true,
        transactions: data || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum)
        }
      });
    } catch (error) {
      console.error('❌ Transactions list error:', error.message);
      return reply.code(500).send({ error: error.message || 'Server error' });
    }
  });

  /**
   * GET /api/transactions/summary
   * Sum by category for date range
   * Query: from=YYYY-MM-DD, to=YYYY-MM-DD (default: current month)
   */
  fastify.get('/api/transactions/summary', {
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
        .lte('timestamp', `${toDate}T23:59:59`)
        .not('amount', 'is', null);

      if (error) throw error;

      // Aggregate by category
      const byCategory = {};
      const total = { amount: 0 };
      (data || []).forEach((row) => {
        const cat = row.category || 'Uncategorized';
        if (!byCategory[cat]) byCategory[cat] = { category: cat, amount: 0 };
        const amt = parseFloat(row.amount) || 0;
        byCategory[cat].amount += amt;
        total.amount += amt;
      });

      const summary = Object.values(byCategory).sort((a, b) => b.amount - a.amount);

      return reply.send({
        success: true,
        summary,
        total: total.amount,
        from: fromDate,
        to: toDate
      });
    } catch (error) {
      console.error('❌ Transactions summary error:', error.message);
      return reply.code(500).send({ error: error.message || 'Server error' });
    }
  });

  /**
   * GET /api/transactions/daily-trend
   * Daily spend for last 7 days
   */
  fastify.get('/api/transactions/daily-trend', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const days = Math.min(30, Math.max(7, parseInt(request.query.days, 10) || 7));

      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);

      const { data, error } = await supabase
        .from('transactions')
        .select('timestamp, amount')
        .eq('user_id', userId)
        .gte('timestamp', start.toISOString())
        .lte('timestamp', end.toISOString())
        .not('amount', 'is', null);

      if (error) throw error;

      // Group by date
      const byDate = {};
      for (let d = 0; d <= days; d++) {
        const date = new Date(start);
        date.setDate(date.getDate() + d);
        const key = date.toISOString().slice(0, 10);
        byDate[key] = { date: key, amount: 0, count: 0 };
      }

      (data || []).forEach((row) => {
        const key = row.timestamp ? new Date(row.timestamp).toISOString().slice(0, 10) : null;
        if (key && byDate[key]) {
          byDate[key].amount += parseFloat(row.amount) || 0;
          byDate[key].count += 1;
        }
      });

      const trend = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

      return reply.send({
        success: true,
        trend,
        days
      });
    } catch (error) {
      console.error('❌ Daily trend error:', error.message);
      return reply.code(500).send({ error: error.message || 'Server error' });
    }
  });
};

module.exports = plugin;

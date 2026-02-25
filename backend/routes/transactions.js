/**
 * Dashboard API - Transactions, summary, daily trend
 * All endpoints require JWT and are user-scoped.
 * Uses service-role client when available so RLS does not block reads (backend enforces user_id).
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;
const sb = supabaseAdmin || supabase;

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

      let query = sb
        .from('transactions')
        .select('id, amount, merchant_name, category, notes, source_app, timestamp, created_at', { count: 'exact' })
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
        const term = `%${search.trim()}%`;
        query = query.or(`merchant_name.ilike.${term},category.ilike.${term},notes.ilike.${term}`);
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const fromIdx = (pageNum - 1) * limitNum;

      const { data, error, count } = await query.range(fromIdx, fromIdx + limitNum - 1);

      if (error) throw error;

      // Supabase may return count as undefined in some versions; fallback to a count query
      let totalCount = count;
      if (totalCount == null || totalCount === undefined) {
        let countQuery = sb
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);
        if (category) countQuery = countQuery.eq('category', category);
        if (from) countQuery = countQuery.gte('timestamp', `${from}T00:00:00`);
        if (to) countQuery = countQuery.lte('timestamp', `${to}T23:59:59`);
        if (search && search.trim()) {
          const term = `%${search.trim()}%`;
          countQuery = countQuery.or(`merchant_name.ilike.${term},category.ilike.${term},notes.ilike.${term}`);
        }
        const { count: countResult } = await countQuery;
        totalCount = countResult != null ? countResult : (data || []).length;
      }

      return reply.send({
        success: true,
        transactions: data || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount ?? 0,
          totalPages: Math.ceil((totalCount ?? 0) / limitNum)
        }
      });
    } catch (error) {
      console.error('❌ Transactions list error:', error.message);
      return reply.code(500).send({ error: error.message || 'Server error' });
    }
  });

  /**
   * PATCH /api/transactions/:id
   * Update a transaction (amount, merchant_name, category, notes). User must own the transaction.
   */
  fastify.patch('/api/transactions/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const { id } = request.params;
      const { amount, merchant_name, category, notes } = request.body || {};

      const allowed = {};
      if (amount !== undefined) {
        const n = parseFloat(amount);
        if (Number.isNaN(n) || n < 0) {
          return reply.code(400).send({ error: 'Invalid amount' });
        }
        allowed.amount = n;
      }
      if (merchant_name !== undefined) allowed.merchant_name = String(merchant_name).trim() || null;
      if (category !== undefined) allowed.category = String(category).trim() || null;
      if (notes !== undefined) allowed.notes = String(notes).trim() || null;

      if (Object.keys(allowed).length === 0) {
        return reply.code(400).send({ error: 'No valid fields to update' });
      }

      allowed.updated_at = new Date().toISOString();

      const { data, error } = await sb
        .from('transactions')
        .update(allowed)
        .eq('id', id)
        .eq('user_id', userId)
        .select('id, amount, merchant_name, category, notes, source_app, timestamp, created_at, updated_at')
        .single();

      if (error) throw error;
      if (!data) {
        return reply.code(404).send({ error: 'Transaction not found' });
      }

      return reply.send({ success: true, transaction: data });
    } catch (error) {
      console.error('❌ Transaction update error:', error.message);
      return reply.code(error.code === 'PGRST116' ? 404 : 500).send({ error: error.message || 'Server error' });
    }
  });

  /**
   * DELETE /api/transactions/:id
   * Delete a transaction. User must own the transaction.
   */
  fastify.delete('/api/transactions/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const { id } = request.params;

      const { error } = await sb
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      return reply.send({ success: true });
    } catch (error) {
      console.error('❌ Transaction delete error:', error.message);
      return reply.code(error.code === 'PGRST116' ? 404 : 500).send({ error: error.message || 'Server error' });
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

      const { data, error } = await sb
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
   * Daily spend: either last N days (query: days) or a date range (query: from, to)
   */
  fastify.get('/api/transactions/daily-trend', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const { from: fromQuery, to: toQuery, days: daysQuery } = request.query;

      let start;
      let end;
      let days;

      if (fromQuery && toQuery) {
        start = new Date(fromQuery);
        end = new Date(toQuery);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          return reply.code(400).send({ error: 'Invalid from or to date' });
        }
        if (start > end) {
          [start, end] = [end, start];
        }
        days = Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
      } else {
        days = Math.min(30, Math.max(7, parseInt(daysQuery, 10) || 7));
        end = new Date();
        start = new Date();
        start.setDate(start.getDate() - days);
      }

      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);

      const { data, error } = await sb
        .from('transactions')
        .select('timestamp, amount')
        .eq('user_id', userId)
        .gte('timestamp', new Date(startStr).toISOString())
        .lte('timestamp', new Date(endStr + 'T23:59:59.999Z').toISOString())
        .not('amount', 'is', null);

      if (error) throw error;

      // Build one entry per day in range
      const byDate = {};
      const walk = new Date(start);
      while (walk <= end) {
        const key = walk.toISOString().slice(0, 10);
        byDate[key] = { date: key, amount: 0, count: 0 };
        walk.setDate(walk.getDate() + 1);
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
        days,
        from: startStr,
        to: endStr
      });
    } catch (error) {
      console.error('❌ Daily trend error:', error.message);
      return reply.code(500).send({ error: error.message || 'Server error' });
    }
  });
};

module.exports = plugin;

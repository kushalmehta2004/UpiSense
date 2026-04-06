const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

function normalizeEmail(email) {
  if (typeof email !== 'string') return null;
  const v = email.trim().toLowerCase();
  if (!v) return null;
  if (v.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  return v;
}

const plugin = async (fastify) => {
  fastify.post('/api/waitlist', async (request, reply) => {
    try {
      if (!supabaseAdmin) {
        return reply.code(503).send({ success: false, error: 'Waitlist is not configured.' });
      }

      const email = normalizeEmail(request.body?.email);
      if (!email) return reply.code(400).send({ success: false, error: 'Invalid email address.' });

      const { error } = await supabaseAdmin
        .from('waitlist_signups')
        .insert([{ email, source: 'website' }], { returning: 'minimal' });

      if (!error) return reply.send({ success: true, alreadySignedUp: false });

      // Duplicate email (unique/PK violation). Keep response friendly.
      if (String(error.code) === '23505' || String(error.message || '').toLowerCase().includes('duplicate')) {
        return reply.send({ success: true, alreadySignedUp: true });
      }

      return reply.code(500).send({ success: false, error: 'Could not save signup.' });
    } catch (e) {
      return reply.code(500).send({ success: false, error: 'Internal error' });
    }
  });
};

module.exports = plugin;


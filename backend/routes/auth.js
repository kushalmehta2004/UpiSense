const { createClient } = require('@supabase/supabase-js');
const { normalizeForWhatsApp, getPhoneVariants } = require('../lib/phoneUtils.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const plugin = async (fastify, options) => {
  /**
   * POST /auth/signup
   * Request: { phone: string, name?: string }
   * Response: { message: string, sessionId: string, otp: string (dev only) }
   */
  fastify.post('/auth/signup', async (request, reply) => {
    const { phone, name } = request.body;

    // Validate phone
    if (!phone || !phone.match(/^[0-9]{10,15}$/)) {
      return reply.code(400).send({ 
        error: 'Invalid phone number. Must be 10-15 digits.' 
      });
    }

    try {
      // Check if user exists (try both 9372999366 and 919372999366 formats)
      const variants = getPhoneVariants(phone);
      let existing = null;
      for (const v of variants) {
        const { data: byPhone } = await supabase.from('users').select('id, phone, name').eq('phone', v).limit(1);
        if (byPhone?.[0]) { existing = byPhone[0]; break; }
        const { data: byWa } = await supabase.from('users').select('id, phone, name').eq('whatsapp_number', v).limit(1);
        if (byWa?.[0]) { existing = byWa[0]; break; }
      }

      if (existing) {
        console.log(`👤 User ${phone} already exists. Sending OTP...`);
        return reply.send({
          message: 'OTP sent to your phone',
          sessionId: `session_${Date.now()}`,
          otp: '123456' // FOR DEVELOPMENT ONLY - Remove in production
        });
      }

      console.log(`✨ New signup: ${phone}`);

      // TODO: Send OTP via MSG91 or similar service
      // For now, accept any 6-digit OTP
      return reply.send({
        message: 'OTP sent to your phone',
        sessionId: `session_${Date.now()}`,
        otp: '123456' // FOR DEVELOPMENT ONLY
      });
    } catch (error) {
      console.error('❌ Signup error:', error.message);
      return reply.code(500).send({ error: 'Server error' });
    }
  });

  /**
   * POST /auth/verify
   * Request: { phone: string, otp: string }
   * Response: { success: true, token: string, user: {...} }
   */
  fastify.post('/auth/verify', async (request, reply) => {
    const { phone, otp, name: nameFromBody } = request.body || {};

    if (!phone || !otp) {
      return reply.code(400).send({ error: 'Missing phone or OTP' });
    }

    // Validate phone format
    if (!phone.match(/^[0-9]{10,15}$/)) {
      return reply.code(400).send({ 
        error: 'Invalid phone number' 
      });
    }

    try {
      // TODO: Verify OTP with MSG91 or similar service
      // For development, accept OTP "123456"
      const validOtps = ['123456', '111111', '000000'];
      if (!validOtps.includes(otp)) {
        return reply.code(401).send({ error: 'Invalid OTP' });
      }

      // Get or create user (try both 9372999366 and 919372999366 formats to avoid duplicates)
      const variants = getPhoneVariants(phone);
      let user = null;
      for (const v of variants) {
        const { data: byPhone } = await supabase.from('users').select('*').eq('phone', v).limit(1);
        if (byPhone?.[0]) { user = byPhone[0]; break; }
        const { data: byWa } = await supabase.from('users').select('*').eq('whatsapp_number', v).limit(1);
        if (byWa?.[0]) { user = byWa[0]; break; }
      }

      if (!user) {
        // Create user on first OTP verification (normalize for consistent storage)
        const digits = phone.replace(/\D/g, '');
        const whatsappNumber = normalizeForWhatsApp(phone);
        const phoneStored = digits.length === 10 ? digits : whatsappNumber; // store 10-digit as phone
        const { data: newUser, error } = await supabase
          .from('users')
          .insert([{
            phone: phoneStored,
            whatsapp_number: whatsappNumber,
            name: (nameFromBody && String(nameFromBody).trim()) ? String(nameFromBody).trim().slice(0, 255) : 'User',
            plan: 'free'
          }])
          .select('*')
          .single();

        if (error) {
          // Race: user may have been created (e.g. by webhook); try lookup again
          if (error.code === '23505' || error.message?.includes('duplicate key')) {
            for (const v of variants) {
              const { data: found } = await supabase.from('users').select('*').eq('phone', v).limit(1);
              if (found?.[0]) { user = found[0]; break; }
              const { data: found2 } = await supabase.from('users').select('*').eq('whatsapp_number', v).limit(1);
              if (found2?.[0]) { user = found2[0]; break; }
            }
          }
          if (!user) {
            console.error('❌ Error creating user:', error.message);
            return reply.code(500).send({ error: 'Failed to create user' });
          }
        } else {
          user = newUser;
          console.log(`✅ Created new user: ${user.id}`);
        }
      } else {
        console.log(`✅ Authenticated existing user: ${user.id}`);
      }

      // Generate JWT token
      try {
        console.log('🔑 Attempting to sign JWT token...');
        const token = fastify.jwt.sign({ 
          userId: user.id, 
          phone: user.phone 
        });

        console.log('✅ JWT token generated successfully');
        console.log('Token type:', typeof token);
        console.log('Token value:', token.substring ? token.substring(0, 30) : token);

        return reply.send({
          success: true,
          token,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            plan: user.plan,
            whatsapp_number: user.whatsapp_number
          }
        });
      } catch (jwtError) {
        console.error('❌ JWT signing error:', jwtError.message);
        console.error('Stack:', jwtError.stack);
        return reply.code(500).send({ error: 'Failed to generate token', details: jwtError.message });
      }
    } catch (error) {
      console.error('❌ Verify error:', error.message);
      console.error('Full error:', error);
      return reply.code(500).send({ error: error.message || 'Server error' });
    }
  });

  /**
   * GET /auth/profile
   * Returns current user profile (requires JWT)
   * Header: Authorization: Bearer <token>
   */
  fastify.get('/auth/profile', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user;

      const { data: user, error } = await supabase
        .from('users')
        .select('id, phone, name, plan, whatsapp_number, created_at')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('❌ User not found:', userId);
        return reply.code(404).send({ error: 'User not found' });
      }

      console.log(`✅ Retrieved profile for: ${user.phone}`);
      return reply.send({
        success: true,
        user
      });
    } catch (error) {
      if (error.message.includes('Authorization')) {
        return reply.code(401).send({ error: 'Unauthorized - missing or invalid token' });
      }
      console.error('❌ Profile error:', error.message);
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  /**
   * PATCH /auth/profile
   * Update current user profile (name, etc.). Requires JWT.
   * Body: { name?: string }
   */
  fastify.patch('/auth/profile', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user;
      const { name } = request.body || {};

      const updates = {};
      if (typeof name === 'string') {
        const trimmed = name.trim().slice(0, 255);
        if (trimmed) updates.name = trimmed;
      }

      if (Object.keys(updates).length === 0) {
        const { data: user } = await supabase.from('users').select('id, phone, name, plan, whatsapp_number, created_at').eq('id', userId).single();
        return reply.send({ success: true, user: user || {} });
      }

      const { data: user, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('id, phone, name, plan, whatsapp_number, created_at')
        .single();

      if (error) {
        console.error('❌ Profile update error:', error.message);
        return reply.code(500).send({ error: 'Failed to update profile' });
      }

      return reply.send({ success: true, user });
    } catch (error) {
      if (error.message.includes('Authorization')) {
        return reply.code(401).send({ error: 'Unauthorized - missing or invalid token' });
      }
      console.error('❌ Profile update error:', error.message);
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  /**
   * POST /auth/logout
   * Just returns success (client should delete token)
   */
  fastify.post('/auth/logout', async (request, reply) => {
    try {
      await request.jwtVerify();
      console.log(`✅ User logged out`);
      return reply.send({ success: true, message: 'Logged out' });
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  /**
   * GET /auth/verify-token
   * Check if token is valid
   */
  fastify.get('/auth/verify-token', async (request, reply) => {
    try {
      await request.jwtVerify();
      return reply.send({ valid: true });
    } catch (error) {
      return reply.code(401).send({ valid: false, error: 'Invalid token' });
    }
  });
};

module.exports = plugin;

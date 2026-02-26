const { createClient } = require('@supabase/supabase-js');
const { normalizeForWhatsApp, getPhoneVariants } = require('../lib/phoneUtils.js');
const { sendOtp: sendOtpSms, verifyOtp: verifyOtpCode, isConfigured: isOtpServiceConfigured } = require('../lib/otpService.js');
const { sendOtp: sendEmailOtp, verifyOtp: verifyEmailOtp, isConfigured: isEmailOtpConfigured } = require('../lib/emailOtpService.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Service-role client for operations that must bypass RLS (e.g. profile, delete account).
// Set SUPABASE_SERVICE_ROLE_KEY in production so auth routes work with RLS enabled on users.
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;
const sb = supabaseAdmin || supabase;

const plugin = async (fastify, options) => {
  /**
   * POST /auth/signup
   * Request: { phone: string, name?: string, email: string }
   * Sends OTP to email (Gmail SMTP). GMAIL_USER + GMAIL_APP_PASSWORD required.
   */
  fastify.post('/auth/signup', async (request, reply) => {
    const { phone, name, email } = request.body;

    if (!phone || !phone.match(/^[0-9]{10,15}$/)) {
      return reply.code(400).send({ error: 'Invalid phone number. Must be 10-15 digits.' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return reply.code(400).send({ error: 'Email is required.' });
    }
    const emailTrimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return reply.code(400).send({ error: 'Invalid email address.' });
    }

    try {
      const variants = getPhoneVariants(phone);
      let existing = null;
      for (const v of variants) {
        const { data: byPhone } = await sb.from('users').select('id, phone, name').eq('phone', v).limit(1);
        if (byPhone?.[0]) { existing = byPhone[0]; break; }
        const { data: byWa } = await sb.from('users').select('id, phone, name').eq('whatsapp_number', v).limit(1);
        if (byWa?.[0]) { existing = byWa[0]; break; }
      }

      if (existing) {
        console.log(`👤 User ${phone} already exists. Sending OTP to email...`);
      } else {
        console.log(`✨ New signup: ${phone}, email: ${emailTrimmed}`);
      }

      if (!isEmailOtpConfigured()) {
        return reply.code(503).send({ error: 'OTP service is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env to send verification codes to email.' });
      }
      const result = await sendEmailOtp(emailTrimmed);
      if (!result.sent) {
        console.error('[auth] Email OTP send failed:', result.error);
        return reply.code(502).send({ error: result.error || 'Failed to send OTP. Try again.' });
      }
      return reply.send({ message: 'OTP sent to your email', sessionId: `session_${Date.now()}` });
    } catch (error) {
      console.error('❌ Signup error:', error.message);
      return reply.code(500).send({ error: 'Server error' });
    }
  });

  /**
   * POST /auth/verify
   * Request: { phone, email, otp, name?, rememberMe? }
   * Verifies email OTP, then get/create user by phone and set email.
   * Response: { success: true, token: string, user: {...} }
   */
  fastify.post('/auth/verify', async (request, reply) => {
    const { phone: phoneFromBody, email: emailFromBody, otp, name: nameFromBody, rememberMe } = request.body || {};
    const phone = phoneFromBody;
    let verifiedEmail = null;

    try {
      if (!phone || !otp) {
        return reply.code(400).send({ error: 'Missing phone or OTP' });
      }
      if (!phone.match(/^[0-9]{10,15}$/)) {
        return reply.code(400).send({ error: 'Invalid phone number' });
      }
      const emailTrimmed = emailFromBody && String(emailFromBody).trim().toLowerCase();
      if (isEmailOtpConfigured()) {
        if (!emailTrimmed) {
          return reply.code(400).send({ error: 'Email is required for verification.' });
        }
        if (!verifyEmailOtp(emailTrimmed, otp)) {
          return reply.code(401).send({ error: 'Invalid or expired OTP. Request a new code.' });
        }
        verifiedEmail = emailTrimmed;
      } else if (isOtpServiceConfigured()) {
        if (!verifyOtpCode(phone, otp)) {
          return reply.code(401).send({ error: 'Invalid or expired OTP. Request a new code.' });
        }
        verifiedEmail = emailTrimmed || null;
      } else {
        return reply.code(401).send({ error: 'Invalid or expired OTP. Request a new code.' });
      }

      // Get or create user (try both 9372999366 and 919372999366 formats to avoid duplicates)
      const variants = getPhoneVariants(phone);
      let user = null;
      for (const v of variants) {
        const { data: byPhone } = await sb.from('users').select('*').eq('phone', v).limit(1);
        if (byPhone?.[0]) { user = byPhone[0]; break; }
        const { data: byWa } = await sb.from('users').select('*').eq('whatsapp_number', v).limit(1);
        if (byWa?.[0]) { user = byWa[0]; break; }
      }

      if (!user) {
        // Create user on first OTP verification (normalize for consistent storage).
        // Use service_role client so RLS allows insert (users table has no INSERT policy for anon).
        const digits = phone.replace(/\D/g, '');
        const whatsappNumber = normalizeForWhatsApp(phone);
        const phoneStored = digits.length === 10 ? digits : whatsappNumber; // store 10-digit as phone
        const insertPayload = {
          phone: phoneStored,
          whatsapp_number: whatsappNumber,
          name: (nameFromBody && String(nameFromBody).trim()) ? String(nameFromBody).trim().slice(0, 255) : 'User',
          plan: 'free'
        };
        if (verifiedEmail) insertPayload.email = verifiedEmail.slice(0, 255);
        const { data: newUser, error } = await sb
          .from('users')
          .insert([insertPayload])
          .select('*')
          .single();

        if (error) {
          // Race: user may have been created (e.g. by webhook); try lookup again
          if (error.code === '23505' || error.message?.includes('duplicate key')) {
            for (const v of variants) {
              const { data: found } = await sb.from('users').select('*').eq('phone', v).limit(1);
              if (found?.[0]) { user = found[0]; break; }
              const { data: found2 } = await sb.from('users').select('*').eq('whatsapp_number', v).limit(1);
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
        if (verifiedEmail) {
          await sb.from('users').update({ email: verifiedEmail.slice(0, 255), updated_at: new Date().toISOString() }).eq('id', user.id);
          user = { ...user, email: verifiedEmail };
        }
      }

      // Generate JWT token (long-lived when rememberMe, else session-length)
      try {
        console.log('🔑 Attempting to sign JWT token...');
        const longLived = rememberMe !== false;
        const token = fastify.jwt.sign(
          { userId: user.id, phone: user.phone },
          { expiresIn: longLived ? '30d' : '24h' }
        );

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
            whatsapp_number: user.whatsapp_number,
            email: user.email || null
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
   * GET /auth/config
   * useRealOtp / useEmailOtp for frontend OTP UI.
   */
  fastify.get('/auth/config', async (request, reply) => {
    return reply.send({
      useRealOtp: isEmailOtpConfigured() || isOtpServiceConfigured(),
      useEmailOtp: isEmailOtpConfigured(),
    });
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

      const { data: user, error } = await sb
        .from('users')
        .select('id, phone, name, plan, whatsapp_number, email, created_at')
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
        const { data: user } = await sb.from('users').select('id, phone, name, plan, whatsapp_number, email, created_at').eq('id', userId).single();
        return reply.send({ success: true, user: user || {} });
      }

      const { data: user, error } = await sb
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('id, phone, name, plan, whatsapp_number, email, created_at')
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

  /**
   * DELETE /auth/account
   * Permanently delete the current user and all related data. Requires JWT.
   * Uses service-role client so RLS does not block the delete.
   */
  fastify.delete('/auth/account', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user;

      if (supabaseAdmin) {
        const { error } = await supabaseAdmin.rpc('delete_user_account', { p_user_id: userId });
        if (error) {
          console.error('❌ Delete account error:', error.message);
          return reply.code(500).send({ error: 'Failed to delete account' });
        }
      } else {
        const { error } = await sb.from('users').delete().eq('id', userId);
        if (error) {
          console.error('❌ Delete account error:', error.message);
          return reply.code(500).send({
            error: 'Account deletion is not configured. Set SUPABASE_SERVICE_ROLE_KEY and run the delete_user_account migration.',
          });
        }
      }

      console.log(`✅ Account deleted: ${userId}`);
      return reply.send({ success: true, message: 'Account and all data deleted' });
    } catch (error) {
      if (error.message?.includes('Authorization')) {
        return reply.code(401).send({ error: 'Unauthorized - missing or invalid token' });
      }
      console.error('❌ Delete account error:', error.message);
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
};

module.exports = plugin;

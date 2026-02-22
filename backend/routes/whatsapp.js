const { createClient } = require('@supabase/supabase-js');
const { parseTransactionUnified } = require('../lib/parsers/unifiedParser.js');
const { getCategoryForMerchant, ensureLoaded, dictionary } = require('../lib/merchants/lookup.js');
const { categorizeTransaction, saveToMerchantMemory } = require('../lib/categorization/categorizeTransaction.js');
const { DEFAULT_CATEGORIES } = require('../lib/categories/defaults.js');
const { seedCategories } = require('../lib/categories/seedCategories.js');
const {
  sendClarificationAndSavePending,
  parseClarificationReply,
  handleClarificationReply
} = require('../lib/whatsapp/clarificationFlow.js');
const { sendWhatsAppText } = require('../lib/whatsapp/sendMessage.js');
const { getFinalConfidence } = require('../lib/categorization/confidence.js');
const { logParseFailure, logError, getParseFailureSummary } = require('../lib/logger.js');
const { getPhoneVariants, normalizeForWhatsApp } = require('../lib/phoneUtils.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const plugin = async (fastify, options) => {
  // Seed categories on plugin load (idempotent)
  fastify.addHook('onReady', async () => {
    try {
      const result = await seedCategories(supabase);
      console.log(`📂 Categories: ${result.message}`);
    } catch (err) {
      console.warn('⚠️ Category seed failed:', err.message);
    }
  });

  fastify.get('/webhook/whatsapp', async (request, reply) => {
    const {
      'hub.mode': mode,
      'hub.challenge': challenge,
      'hub.verify_token': token
    } = request.query;

    console.log('🔐 Webhook verification attempt:', { mode, token: token ? '***' : 'missing', hasChallenge: !!challenge });

    if (mode !== 'subscribe') {
      console.log('❌ Invalid mode:', mode);
      return reply.code(400).send({ error: 'Invalid mode' });
    }

    const expectedToken = process.env.META_VERIFY_TOKEN;
    if (!expectedToken) {
      console.log('❌ META_VERIFY_TOKEN not set in environment');
      return reply.code(500).send('Server misconfiguration');
    }
    if (token !== expectedToken) {
      console.log('❌ Invalid token (mismatch)');
      return reply.code(403).send('Forbidden');
    }

    if (challenge === undefined || challenge === null) {
      console.log('❌ No hub.challenge in request');
      return reply.code(400).send('Missing challenge');
    }

    console.log('✅ Webhook verified successfully');
    return reply.type('text/plain').send(String(challenge));
  });

  fastify.post('/webhook/whatsapp', async (request, reply) => {
    try {
      const body = request.body;
      
      console.log('\n📨 Incoming WhatsApp webhook:');
      console.log(JSON.stringify(body, null, 2));

      if (!body.entry || !body.entry[0]) {
        console.log('⚠️  No entry in webhook body');
        return reply.send({ success: true });
      }

      const changes = body.entry[0].changes;
      if (!changes || !changes[0]) {
        console.log('⚠️  No changes in entry');
        return reply.send({ success: true });
      }

      const { value } = changes[0];
      
      // Handle status updates
      if (value.statuses) {
        console.log('📊 Message status update (delivery/read)');
        return reply.send({ success: true });
      }

      // Handle incoming messages
      if (!value.messages) {
        console.log('⚠️  No messages in value');
        return reply.send({ success: true });
      }

      const message = value.messages[0];
      const senderId = message.from;
      const messageId = message.id;
      const timestamp = message.timestamp;
      const text = message.text?.body;

      if (!text) {
        console.log('⚠️  No text content in message');
        return reply.send({ success: true });
      }

      console.log(`\n✉️  Message received:`);
      console.log(`   From: ${senderId}`);
      console.log(`   ID: ${messageId}`);
      console.log(`   Text: ${text}`);
      console.log(`   Timestamp: ${new Date(timestamp * 1000).toISOString()}`);

      // Task 5: Check for P2P clarification reply (e.g. "1" or "2")
      const choice = parseClarificationReply(text);
      if (choice !== null) {
        const variants = getPhoneVariants(senderId);
        let clarificationUser = null;
        for (const v of variants) {
          const { data: u } = await supabase.from('users').select('id').eq('whatsapp_number', v).limit(1);
          if (u?.[0]) { clarificationUser = u[0]; break; }
          const { data: u2 } = await supabase.from('users').select('id').eq('phone', v).limit(1);
          if (u2?.[0]) { clarificationUser = u2[0]; break; }
        }
        if (clarificationUser) {
          const user = clarificationUser;
          const { data: pending } = await supabase
            .from('pending_clarifications')
            .select('transaction_id, merchant_name, upi_id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (pending) {
            const category = await handleClarificationReply(supabase, user.id, choice, pending);
            await sendWhatsAppText(senderId, `✅ Saved as *${category}*. Future payments to this person will use this category.`);
            console.log(`📥 Clarification: user chose ${choice} → ${category}`);
            return reply.send({ success: true });
          }
        }
      }

      // Parse transaction (regex first, LLM fallback)
      const parsed = await parseTransactionUnified(text);

      if (parsed) {
        console.log('\n✅ Transaction parsed successfully');

        // Get or create user (match both 919372999366 and 9372999366 formats)
        // Use limit(1) not maybeSingle() - duplicates can exist, we just need one
        const variants = getPhoneVariants(senderId);
        let user = null;
        for (const v of variants) {
          const { data: byWa } = await supabase.from('users').select('id').eq('whatsapp_number', v).limit(1);
          if (byWa?.[0]) { user = byWa[0]; break; }
          const { data: byPhone } = await supabase.from('users').select('id').eq('phone', v).limit(1);
          if (byPhone?.[0]) { user = byPhone[0]; break; }
        }

        let userId = user?.id;

        if (userId) {
          // Ensure whatsapp_number is updated to canonical format for future lookups
          await supabase.from('users').update({ whatsapp_number: normalizeForWhatsApp(senderId) }).eq('id', userId);
        }

        if (!userId) {
          const canonicalPhone = normalizeForWhatsApp(senderId);
          const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
              whatsapp_number: canonicalPhone,
              phone: canonicalPhone,
              name: `User_${canonicalPhone.slice(-4)}`,
              plan: 'free'
            }])
            .select('id')
            .single();

          if (error) {
            // Race: another request created user; do one more lookup
            if (error.code === '23505' || error.message?.includes('duplicate key')) {
              for (const v of variants) {
                const { data: found } = await supabase.from('users').select('id').eq('phone', v).limit(1);
                if (found?.[0]) { userId = found[0].id; break; }
                const { data: found2 } = await supabase.from('users').select('id').eq('whatsapp_number', v).limit(1);
                if (found2?.[0]) { userId = found2[0].id; break; }
              }
            }
            if (!userId) {
              console.error('❌ Error creating user:', error.message);
              return reply.code(500).send({ error: 'Failed to create user' });
            }
          } else {
            userId = newUser.id;
            console.log(`👤 Created new user: ${userId}`);
          }
        }

        // Categorize transaction (merchant_memory → dictionary → pending_clarification → default)
        const { category: assignedCategory, source: categorySource } = await categorizeTransaction(
          {
            merchant: parsed.merchant,
            upi_id: parsed.upi_id,
            is_p2p: parsed.is_p2p
          },
          userId,
          supabase
        );

        // Task 6: Final confidence (memory=0.95, dictionary=0.90, else parse confidence); <0.75 → ask confirm
        const { confidence: finalConfidence, shouldAskConfirm } = getFinalConfidence(
          parsed.confidence,
          categorySource
        );

        // Store transaction
        const { data: txn, error: txnError } = await supabase
          .from('transactions')
          .insert([{
            user_id: userId,
            amount: parsed.amount,
            merchant_name: parsed.merchant || parsed.upi_id || 'Unknown',
            upi_id: parsed.upi_id,
            category: assignedCategory,
            source_app: parsed.source_app || 'unknown',
            parse_method: parsed.parse_method || 'unknown',
            confidence: finalConfidence,
            timestamp: new Date(timestamp * 1000).toISOString()
          }])
          .select('id')
          .single();

        if (txnError) {
          console.error('❌ Error storing transaction:', txnError.message);
          return reply.code(500).send({ error: 'Failed to store transaction' });
        }

        console.log(`💾 Stored transaction: ${txn.id}`);
        console.log(`   Amount: ₹${parsed.amount} | Merchant: ${parsed.merchant || parsed.upi_id} | Category: ${assignedCategory} (${categorySource}) | Confidence: ${finalConfidence}`);

        // Task 5: If P2P needed clarification, send WhatsApp and save pending
        if (assignedCategory === 'pending_clarification') {
          try {
            await sendClarificationAndSavePending(supabase, {
              userId,
              whatsappNumber: senderId,
              transactionId: txn.id,
              merchantName: parsed.merchant || parsed.upi_id || 'Unknown',
              upiId: parsed.upi_id
            });
            console.log('📤 Sent P2P clarification message to', senderId.replace(/\d(?=\d{4})/g, '*'));
          } catch (err) {
            console.error('❌ Clarification send failed:', err.message);
          }
        } else if (shouldAskConfirm) {
          // Task 6: Low confidence — ask user to confirm category
          const merchant = parsed.merchant || parsed.upi_id || 'Unknown';
          const msg = `We categorized your payment of ₹${parsed.amount} to *${merchant}* as *${assignedCategory}*. Reply YES if correct, or tell us the right category.`;
          try {
            await sendWhatsAppText(senderId, msg);
            console.log('📤 Sent confidence confirmation request');
          } catch (err) {
            console.error('❌ Confirm message send failed:', err.message);
          }
        } else {
          // Success: send acknowledgement so user knows it was recorded
          const merchant = parsed.merchant || parsed.upi_id || 'Unknown';
          const msg = `✅ Recorded: ₹${parsed.amount} to *${merchant}* (${assignedCategory})`;
          try {
            await sendWhatsAppText(senderId, msg);
            console.log('📤 Sent transaction acknowledgement');
          } catch (err) {
            console.error('❌ Acknowledgement send failed:', err.message);
          }
        }

        return reply.send({ success: true, parsed: true, txnId: txn.id });
      } else {
        console.log('⚠️  Could not parse transaction (both regex and LLM failed)');
        await logParseFailure(text, 'Both regex and LLM failed', { from_masked: senderId ? senderId.slice(-4) : null }, supabase);
        return reply.send({ success: true, parsed: false, message: 'Transaction parsing failed. Please check the message format.' });
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error.message);
      logError('webhook', error, {});
      return reply.code(500).send({ error: 'Internal error' });
    }
  });

  // Parse transaction endpoint for testing
  fastify.post('/api/parse', async (request, reply) => {
    try {
      const { phone, message } = request.body;

      if (!message) {
        return reply.code(400).send({ error: 'Missing message field' });
      }

      console.log('\n🧪 Testing transaction parsing:');
      console.log(`   Message: ${message}`);

      const parsed = await parseTransactionUnified(message);

      if (parsed) {
        console.log('✅ Parse successful');
        return reply.send({ 
          success: true, 
          parsed: true, 
          data: {
            amount: parsed.amount,
            merchant: parsed.merchant || parsed.upi_id,
            source_app: parsed.source_app,
            confidence: parsed.confidence,
            ref: parsed.ref
          }
        });
      } else {
        console.log('⚠️  Could not parse message');
        await logParseFailure(message, 'Parse failed (api/parse)', {}, supabase);
        return reply.send({ 
          success: true, 
          parsed: false,
          message: 'Transaction parsing failed. Message format not recognized.'
        });
      }
    } catch (error) {
      console.error('❌ Parse error:', error.message);
      logError('api-parse', error, {});
      return reply.code(500).send({ error: error.message });
    }
  });

  // Task 7: Error summary for weekly review (call via cron or manually)
  fastify.get('/api/admin/error-summary', async (request, reply) => {
    try {
      const sinceDays = Math.min(31, Math.max(1, parseInt(request.query.since_days, 10) || 7));
      const summary = await getParseFailureSummary({ sinceDays, limit: 200 }, supabase);
      return reply.send({
        success: true,
        parse_failures: summary,
        hint: 'Set ?since_days=7 for last week. Use a cron job to hit this URL and email yourself.'
      });
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Seed categories (Task 4 - idempotent, run manually if needed)
  fastify.post('/api/categories/seed', async (request, reply) => {
    try {
      const result = await seedCategories(supabase);
      return reply.send({ success: true, ...result });
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // List categories (Task 4 - system defaults + DB)
  fastify.get('/api/categories', async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon, color, is_default')
        .is('user_id', null)
        .order('name');
      if (error) throw error;
      // If empty, return defaults (before seed runs)
      const categories = (data && data.length > 0) ? data : DEFAULT_CATEGORIES.map(c => ({ ...c, id: null, is_default: true }));
      return reply.send({ success: true, categories });
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Merchant lookup stats (merged dictionary size)
  fastify.get('/api/merchant/stats', async (request, reply) => {
    try {
      await ensureLoaded();
      const total = Object.keys(dictionary).length;
      return reply.send({ success: true, totalMerchants: total });
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Test merchant lookup (Task 2 - Merchant Dictionary)
  fastify.post('/api/merchant/category', async (request, reply) => {
    try {
      await ensureLoaded(); // Load public sources (D2C brands) on first request
      const { merchant } = request.body;
      if (!merchant) {
        return reply.code(400).send({ error: 'Missing merchant field' });
      }
      const result = getCategoryForMerchant(merchant);
      return reply.send({
        success: true,
        merchant,
        found: !!result,
        ...(result && { category: result.category, confidence: result.confidence })
      });
    } catch (error) {
      console.error('❌ Merchant lookup error:', error.message);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Test categorization flow (Task 3)
  fastify.post('/api/categorize', async (request, reply) => {
    try {
      const { merchant, upi_id, is_p2p, user_id } = request.body;
      if (!merchant && !upi_id) {
        return reply.code(400).send({ error: 'Provide merchant or upi_id' });
      }
      // Use first user as fallback for testing when user_id not provided
      let testUserId = user_id;
      if (!testUserId) {
        const { data: users } = await supabase.from('users').select('id').limit(1);
        testUserId = users?.[0]?.id;
      }
      if (!testUserId) {
        return reply.code(400).send({
          error: 'No user_id provided and no users in DB. Create a user first or pass user_id.'
        });
      }
      const txn = {
        merchant: merchant || upi_id,
        upi_id: upi_id || merchant,
        is_p2p: is_p2p === true
      };
      const { category, source } = await categorizeTransaction(txn, testUserId, supabase);
      return reply.send({
        success: true,
        merchant: txn.merchant,
        category,
        source
      });
    } catch (error) {
      console.error('❌ Categorize error:', error.message);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Add/update merchant memory (Task 3 - for testing & Task 5 clarification responses)
  fastify.post('/api/merchant-memory', async (request, reply) => {
    try {
      const { user_id, upi_id, merchant_name, category, is_p2p } = request.body;
      if (!user_id || !merchant_name || !category) {
        return reply.code(400).send({
          error: 'Missing required fields: user_id, merchant_name, category'
        });
      }
      await saveToMerchantMemory(supabase, {
        user_id,
        upi_id: upi_id || merchant_name,
        merchant_name,
        category,
        is_p2p: is_p2p === true
      });
      return reply.send({
        success: true,
        message: 'Merchant preference saved. Future transactions will use this category.'
      });
    } catch (error) {
      console.error('❌ Merchant memory save error:', error.message);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Mark message as read (optional endpoint)
  fastify.post('/api/mark-read', async (request, reply) => {
    const { messageId, phoneId } = request.body;
    console.log(`📖 Marking message ${messageId} as read`);
    // TODO: Implement in Week 4
    return reply.send({ success: true });
  });
};

module.exports = plugin;

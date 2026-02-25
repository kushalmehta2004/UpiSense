const { createClient } = require('@supabase/supabase-js');
const { parseTransactionUnified } = require('../lib/parsers/unifiedParser.js');
const { getCategoryForMerchant, ensureLoaded, dictionary } = require('../lib/merchants/lookup.js');
const { categorizeTransaction, saveToMerchantMemory } = require('../lib/categorization/categorizeTransaction.js');
const { DEFAULT_CATEGORIES } = require('../lib/categories/defaults.js');
const { seedCategories } = require('../lib/categories/seedCategories.js');
const {
  sendClarificationAndSavePending,
  parseClarificationReply,
  handleClarificationReply,
  handleNoteReply,
  getAskForNoteMessage,
  getCategoryForOptionIndex,
  getLabelForOptionIndex,
  buildReceiptCategoryMessage
} = require('../lib/whatsapp/clarificationFlow.js');
const { sendWhatsAppText, STOP_FOOTER } = require('../lib/whatsapp/sendMessage.js');
const { getHelpMessage } = require('../lib/whatsapp/helpMessage.js');
const { getFinalConfidence } = require('../lib/categorization/confidence.js');
const { logParseFailure, logError, getParseFailureSummary } = require('../lib/logger.js');
const { getPhoneVariants, normalizeForWhatsApp } = require('../lib/phoneUtils.js');
const {
  parseBudgetCommand,
  setBudget,
  getBudgetAlertAfterTransaction,
  matchCategoryName
} = require('../lib/budget/budgetService.js');
const {
  parseReportCommand,
  getSpendingByCategory,
  formatReportMessage
} = require('../lib/report/reportService.js');
const {
  parseCreateGroupCommand,
  parseAddToGroupCommand,
  createGroup,
  findGroupByName,
  addMemberToGroup,
  listGroupsForUser
} = require('../lib/groups/groupService.js');
const {
  addExpense,
  addExpenseWithShares,
  resolveSharesToUserIds,
  getBalanceForUser,
  formatBalanceMessage,
  parseBalanceCommand,
  settleUp,
  parseSettleCommand,
  resolveSettleToUser
} = require('../lib/expenses/expenseService.js');
const { shouldHandle: groupsShouldHandle, process: groupsAgentProcess } = require('../lib/agents/groupsAgent.js');
const { logAgentHandling } = require('../lib/agents/agentRouter.js');
const { parseWithUnifiedAgent, shouldTryAgent } = require('../lib/agents/unifiedIntentAgent.js');
// Groups feature: set ENABLE_GROUPS=true in .env to re-enable
const ENABLE_GROUPS = process.env.ENABLE_GROUPS === 'true';
// Family feature: set ENABLE_FAMILY=true in .env to re-enable
const ENABLE_FAMILY = process.env.ENABLE_FAMILY === 'true';
const { parseReceiptFromWhatsAppMedia } = require('../lib/receipt/receiptParser.js');
const {
  addToFamily,
  getFamilySpendingThisMonth,
  formatFamilySummaryMessage,
  parseAddToFamilyCommand
} = require('../lib/family/familyService.js');
const {
  parseRequestMoneyCommand,
  findUserByPhone
} = require('../lib/requestMoney/requestMoneyService.js');
const {
  addDebtEntry,
  getOwedToMe,
  getIOwe,
  formatOwedToMeMessage,
  formatIOweMessage,
  parseOwedToMeCommand,
  parseIOweCommand
} = require('../lib/debt/debtService.js');
const {
  findSimilarRecentTransaction,
  setPendingRecurringSuggestion,
  handleRecurringYes
} = require('../lib/recurring/recurringService.js');
const {
  setPendingSplit,
  handleSplitReply
} = require('../lib/splitTransaction/splitTransactionService.js');
const { amountForDb } = require('../lib/amountUtils.js');
const { dateStringToNoonISTUTC, getTodayIST } = require('../lib/dateUtils.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
// Service-role client: bypasses RLS so webhook can create/lookup users and write parse_failures (no user JWT in webhook).
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;
if (!supabaseAdmin) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. WhatsApp user creation will fail with RLS. Set it in Vercel → Project → Settings → Environment Variables and redeploy.');
}
const sb = supabaseAdmin || supabase;

/** Check if user has opted out of non-essential WhatsApp messages (STOP). */
async function isOptedOut(sb, userId) {
  const { data } = await sb.from('users').select('opted_out').eq('id', userId).single();
  return data?.opted_out === true;
}

/** Return a log-safe summary of webhook body (no message content / PII). */
function safeWebhookSummary(body) {
  if (!body || typeof body !== 'object') return { _: 'empty' };
  const out = { object: body.object, entry_count: body.entry?.length ?? 0 };
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  if (value?.statuses) {
    out.type = 'status';
    return out;
  }
  const msg = value?.messages?.[0];
  if (!msg) return out;
  out.type = 'message';
  out.message_id = msg.id;
  out.from = msg.from;
  out.timestamp = msg.timestamp;
  if (msg.text && typeof msg.text.body === 'string') {
    out.text_length = msg.text.body.length;
    out.has_text = true;
  } else {
    out.has_text = false;
  }
  if (msg.image) out.has_image = true;
  if (msg.interactive) out.has_interactive = true;
  return out;
}

const plugin = async (fastify, options) => {
  // Seed categories on plugin load (idempotent)
  fastify.addHook('onReady', async () => {
    try {
      const result = await seedCategories(sb);
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

      // Log structure only; never log message content (Privacy: no PII/OTP in logs)
      const safeSummary = safeWebhookSummary(body);
      console.log('\n📨 Incoming WhatsApp webhook:', JSON.stringify(safeSummary));

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
      const image = message.image;

      // Tier 1: Receipt/screenshot – image without text: parse and record as transaction
      if (!text && image?.id) {
        console.log('📷 Image received (receipt/screenshot)');
        try {
          const receipt = await parseReceiptFromWhatsAppMedia(image.id, image.mime_type || 'image/jpeg');
          if (receipt) {
            const variants = getPhoneVariants(senderId);
            let userId = null;
            for (const v of variants) {
              const { data: u } = await sb.from('users').select('id').eq('whatsapp_number', v).limit(1);
              if (u?.[0]) { userId = u[0].id; break; }
              const { data: u2 } = await sb.from('users').select('id').eq('phone', v).limit(1);
              if (u2?.[0]) { userId = u2[0].id; break; }
            }
            let justCreatedUser = false;
            if (!userId) {
              const canonicalPhone = normalizeForWhatsApp(senderId);
              const { data: newUser } = await sb.from('users').insert([{
                whatsapp_number: canonicalPhone,
                phone: canonicalPhone,
                name: `User`,
                plan: 'free'
              }]).select('id').single();
              if (newUser) {
                userId = newUser.id;
                justCreatedUser = true;
              }
            }
            if (userId) {
              const { category } = await categorizeTransaction(
                { merchant: receipt.merchant, upi_id: receipt.merchant, is_p2p: false },
                userId,
                sb
              );
              const txnTimestamp = receipt.date ? (dateStringToNoonISTUTC(receipt.date) || new Date(timestamp * 1000).toISOString()) : new Date(timestamp * 1000).toISOString();
              const { data: txn } = await sb.from('transactions').insert([{
                user_id: userId,
                amount: amountForDb(receipt.amount),
                merchant_name: receipt.merchant,
                upi_id: receipt.merchant,
                category: category || 'Other',
                source_app: 'receipt_parsed',
                parse_method: 'receipt_image',
                confidence: 0.85,
                timestamp: txnTimestamp
              }]).select('id').single();
              if (txn) {
                await sb.from('pending_category_confirmation').upsert(
                  { user_id: userId, transaction_id: txn.id },
                  { onConflict: 'user_id' }
                );
                await sendWhatsAppText(senderId, `✅ Recorded: ₹${receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} to *${receipt.merchant}*.\n\n${buildReceiptCategoryMessage()}`);
                const alertMsg = await getBudgetAlertAfterTransaction(sb, userId, category || 'Other', receipt.amount);
                if (alertMsg && !(await isOptedOut(sb, userId))) await sendWhatsAppText(senderId, alertMsg + STOP_FOOTER);
                if (justCreatedUser) {
                  try { await sendWhatsAppText(senderId, getHelpMessage(true)); } catch (e) { /* ignore */ }
                }
              }
            } else {
              await sendWhatsAppText(senderId, 'Could not create user. Please try again.');
            }
          } else {
            await sendWhatsAppText(senderId, 'Could not read amount from the image. Send a clearer receipt or type the transaction.');
          }
        } catch (err) {
          console.error('Receipt handling error:', err.message);
          await sendWhatsAppText(senderId, 'Something went wrong reading your receipt. Try again or send the transaction as text.');
        }
        return reply.send({ success: true });
      }

      if (!text) {
        console.log('⚠️  No text content in message');
        return reply.send({ success: true });
      }

      console.log(`\n✉️  Message received:`);
      console.log(`   From: ${senderId}`);
      console.log(`   ID: ${messageId}`);
      console.log(`   Text: ${text}`);
      console.log(`   Timestamp: ${new Date(timestamp * 1000).toISOString()}`);

      const variants = getPhoneVariants(senderId);

      // STOP/START: opt-out of non-essential WhatsApp messages (ToS compliance)
      const trimmedUpper = text.trim().toUpperCase();
      if (trimmedUpper === 'STOP') {
        for (const v of variants) {
          const { data: u } = await sb.from('users').select('id').eq('whatsapp_number', v).limit(1);
          if (u?.[0]) {
            await sb.from('users').update({ opted_out: true }).eq('id', u[0].id);
            break;
          }
          const { data: u2 } = await sb.from('users').select('id').eq('phone', v).limit(1);
          if (u2?.[0]) {
            await sb.from('users').update({ opted_out: true }).eq('id', u2[0].id);
            break;
          }
        }
        await sendWhatsAppText(senderId, 'You have been unsubscribed. Reply START to resubscribe.');
        return reply.send({ success: true });
      }
      if (trimmedUpper === 'START') {
        for (const v of variants) {
          const { data: u } = await sb.from('users').select('id').eq('whatsapp_number', v).limit(1);
          if (u?.[0]) {
            await sb.from('users').update({ opted_out: false }).eq('id', u[0].id);
            await sendWhatsAppText(senderId, 'You have been resubscribed.');
            return reply.send({ success: true });
          }
          const { data: u2 } = await sb.from('users').select('id').eq('phone', v).limit(1);
          if (u2?.[0]) {
            await sb.from('users').update({ opted_out: false }).eq('id', u2[0].id);
            await sendWhatsAppText(senderId, 'You have been resubscribed.');
            return reply.send({ success: true });
          }
        }
        await sendWhatsAppText(senderId, 'You have been resubscribed.');
        return reply.send({ success: true });
      }

      // Resolve user from senderId
      let msgUser = null;
      for (const v of variants) {
        const { data: u } = await sb.from('users').select('id').eq('whatsapp_number', v).limit(1);
        if (u?.[0]) { msgUser = u[0]; break; }
        const { data: u2 } = await sb.from('users').select('id').eq('phone', v).limit(1);
        if (u2?.[0]) { msgUser = u2[0]; break; }
      }

      if (msgUser) {
        const { data: pending } = await sb
          .from('pending_clarifications')
          .select('transaction_id, merchant_name, upi_id, awaiting_note')
          .eq('user_id', msgUser.id)
          .maybeSingle();

        // 1. Awaiting note (user selected "Other" and we asked for a note)
        if (pending?.awaiting_note) {
          const { category, note } = await handleNoteReply(sb, msgUser.id, text, pending);
          const confirm = note
            ? `✅ Saved as *${category}* with note: "${note}". Future payments to this person will use Other.`
            : `✅ Saved as *${category}*. Future payments to this person will use Other.`;
          await sendWhatsAppText(senderId, confirm);
          console.log(`📥 Note received: "${note}" for transaction ${pending.transaction_id}`);
          return reply.send({ success: true });
        }

        // 2. Clarification reply (1–6)
        const choice = parseClarificationReply(text);
        if (choice !== null && pending) {
          const result = await handleClarificationReply(sb, msgUser.id, choice, pending);
          if (result.askedForNote) {
            await sendWhatsAppText(senderId, getAskForNoteMessage());
            console.log('📤 Asked user for note (Other selected)');
          } else {
            const displayCategory = result.label ?? result.category;
            await sendWhatsAppText(senderId, `✅ Saved as *${displayCategory}*. Future payments to this person will use this category.`);
            console.log(`📥 Clarification: user chose ${choice} → ${result.category} (label: ${result.label})`);
          }
          return reply.send({ success: true });
        }
      }

      // ----- Tier 1: WhatsApp commands (need user; create if command from new user) -----
      let cmdUser = null;
      for (const v of variants) {
        const { data: u } = await sb.from('users').select('id, opted_out').eq('whatsapp_number', v).limit(1);
        if (u?.[0]) { cmdUser = u[0]; break; }
        const { data: u2 } = await sb.from('users').select('id, opted_out').eq('phone', v).limit(1);
        if (u2?.[0]) { cmdUser = u2[0]; break; }
      }
      const isBudgetCmd = /^(?:set\s+)?budget\s+.+\s+[\d,]+\.?\d*$/i.test(text.trim());
      const isReportCmd = /^(?:monthly\s+)?(?:report|summary)\s*\S*$/i.test(text.trim()) || /^(report|summary)$/i.test(text.trim());
      const isGroupCmd = ENABLE_GROUPS && (/^(?:create|new)\s+group\s+.+$/i.test(text.trim()) || /^add\s+.+\s+to\s+.+$/i.test(text.trim()) || /^groups$/i.test(text.trim()));
      const isExpenseCmd = ENABLE_GROUPS && (/^expense\s+\d+.+in\s+.+$/i.test(text.trim()) || /^balance\s+(?:in\s+)?.+$/i.test(text.trim()) || /^settle(?:\s+up)?\s+\d+.+$/i.test(text.trim()));
      const isFamilyCmd = ENABLE_FAMILY && (/^add\s+(?:to\s+)?family\s+\d+$/i.test(text.trim()) || /^add\s+\d+\s+to\s+family$/i.test(text.trim()) || /^family\s+summary$/i.test(text.trim()));
      const isRequestCmd = /^request\s+[\d,.]+\s+from\s+\d+$/i.test(text.trim()) || /^remind\s+.+\s+about\s+[\d,.]+\s*$/i.test(text.trim());
      const isHelpCmd = /^(help|menu|commands|start|what can you do|hi|hello)$/i.test(text.trim());
      const isDebtListCmd = parseOwedToMeCommand(text) || parseIOweCommand(text);
      if (!cmdUser && (isBudgetCmd || isReportCmd || isGroupCmd || isExpenseCmd || isFamilyCmd || isRequestCmd || isHelpCmd || isDebtListCmd)) {
        const canonicalPhone = normalizeForWhatsApp(senderId);
        const { data: newU, error } = await sb.from('users').insert([{
          whatsapp_number: canonicalPhone,
          phone: canonicalPhone,
          name: `User`,
          plan: 'free'
        }]).select('id').single();
        if (!error && newU) cmdUser = newU;
      }
      if (cmdUser) {
        const trimmedLower = text.trim().toLowerCase();
        const trimmedText = text.trim();

        // Two-name race: if user just answered "Who did you pay?" and a second message looks like another name, reconfirm
        const looksLikeSingleName = /^[a-zA-Z][a-zA-Z\s]{0,49}$/.test(trimmedText) && trimmedText.split(/\s+/).length <= 2 && !/^\d+$/.test(trimmedText);
        if (looksLikeSingleName) {
          const { data: lastReply } = await sb
            .from('last_recipient_reply')
            .select('amount, recipient_name, transaction_id, created_at')
            .eq('user_id', cmdUser.id)
            .maybeSingle();
          if (lastReply) {
            const ageSec = (Date.now() - new Date(lastReply.created_at).getTime()) / 1000;
            if (ageSec <= 25) {
              const secondName = trimmedText;
              const firstName = lastReply.recipient_name;
              await sb.from('transactions').delete().eq('id', lastReply.transaction_id);
              await sb.from('last_recipient_reply').delete().eq('user_id', cmdUser.id);
              const amt = amountForDb(lastReply.amount) ?? Number(lastReply.amount);
              await sb.from('pending_recipient_ask').upsert(
                { user_id: cmdUser.id, amount: amt },
                { onConflict: 'user_id' }
              );
              const amountDisplay = amt != null ? `₹${Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '₹?';
              await sendWhatsAppText(senderId, `You sent two names (*${firstName}* and *${secondName}*). Who did you pay ${amountDisplay} to? Reply with *only one* name.`);
              return reply.send({ success: true });
            }
          }
        }

        // Pending "Who did you pay ₹X to?" — next message is recipient name; use stored amount
        const { data: pendingRecipient } = await sb
          .from('pending_recipient_ask')
          .select('amount')
          .eq('user_id', cmdUser.id)
          .maybeSingle();
        if (pendingRecipient && text.trim()) {
          const recipientName = text.trim();
          const amount = amountForDb(pendingRecipient.amount) ?? Number(pendingRecipient.amount);
          if (amount == null || isNaN(amount) || amount <= 0) {
            await sb.from('pending_recipient_ask').delete().eq('user_id', cmdUser.id);
            await sendWhatsAppText(senderId, 'Please send the amount you paid (e.g. 500) first, then we\'ll ask who you paid it to.');
            return reply.send({ success: true });
          }
          await sb.from('pending_recipient_ask').delete().eq('user_id', cmdUser.id);
          const { category: assignedCategory, source: categorySource } = await categorizeTransaction(
            { merchant: recipientName, upi_id: null, is_p2p: true, amount },
            cmdUser.id,
            sb
          );
          const { data: txn, error: txnErr } = await sb
            .from('transactions')
            .insert([{
              user_id: cmdUser.id,
              amount: amountForDb(amount),
              merchant_name: recipientName,
              upi_id: null,
              category: assignedCategory,
              source_app: 'whatsapp',
              parse_method: 'pending_recipient',
              confidence: 0.9,
              timestamp: new Date().toISOString()
            }])
            .select('id')
            .single();
          if (txnErr) {
            console.error('❌ Error storing pending-recipient transaction:', txnErr.message);
            await sendWhatsAppText(senderId, `❌ Could not save: ${txnErr.message}`);
            return reply.send({ success: true });
          }
          await sb.from('last_recipient_reply').upsert({
            user_id: cmdUser.id,
            amount: amountForDb(amount),
            recipient_name: recipientName,
            transaction_id: txn.id
          }, { onConflict: 'user_id' });
          if (assignedCategory === 'pending_clarification') {
            try {
              await sendClarificationAndSavePending(sb, {
                userId: cmdUser.id,
                whatsappNumber: senderId,
                transactionId: txn.id,
                merchantName: recipientName,
                upiId: null
              });
            } catch (e) {
              console.error('Clarification send failed:', e.message);
              await sendWhatsAppText(senderId, `✔ Recorded: ₹${amount.toLocaleString('en-IN')} to ${recipientName}. We'll categorize it later.`);
            }
          } else {
            await sendWhatsAppText(senderId, `✔ Recorded: ₹${amount.toLocaleString('en-IN')} to ${recipientName} (${assignedCategory})`);
          }
          return reply.send({ success: true });
        }
        if (isHelpCmd) {
          await sendWhatsAppText(senderId, getHelpMessage());
          return reply.send({ success: true });
        }
        const { data: pendingRecurring } = await sb.from('pending_recurring_suggestion').select('transaction_id').eq('user_id', cmdUser.id).maybeSingle();
        if (pendingRecurring && (trimmedLower === 'yes' || trimmedLower === 'y')) {
          const ok = await handleRecurringYes(sb, cmdUser.id);
          await sendWhatsAppText(senderId, ok ? '✅ Marked as recurring. We\'ll use this for future insights.' : 'No pending suggestion.');
          return reply.send({ success: true });
        }
        const splitResult = await handleSplitReply(sb, cmdUser.id, text);
        if (splitResult.handled) {
          if (splitResult.error) await sendWhatsAppText(senderId, `❌ ${splitResult.error}`);
          else if (splitResult.message) await sendWhatsAppText(senderId, splitResult.message);
          return reply.send({ success: true });
        }
        // Category correction: user replied with a category name (e.g. "Transport") to our "tell us the right category" prompt
        const { data: pendingCat } = await sb.from('pending_category_confirmation').select('transaction_id').eq('user_id', cmdUser.id).maybeSingle();
        if (pendingCat) {
          const trimmed = text.trim().toLowerCase();
          const choiceNum = parseClarificationReply(text);
          if (choiceNum !== null) {
            const categoryFromOption = getCategoryForOptionIndex(choiceNum);
            const labelFromOption = getLabelForOptionIndex(choiceNum);
            const { error: updErr } = await sb.from('transactions').update({ category: categoryFromOption }).eq('id', pendingCat.transaction_id);
            if (!updErr) {
              await sb.from('pending_category_confirmation').delete().eq('user_id', cmdUser.id);
              await sendWhatsAppText(senderId, `✅ Saved as *${labelFromOption}*.`);
            }
            return reply.send({ success: true });
          }
          if (trimmed === 'yes' || trimmed === 'y') {
            await sb.from('pending_category_confirmation').delete().eq('user_id', cmdUser.id);
            await sendWhatsAppText(senderId, '✅ Got it! Category confirmed.');
            return reply.send({ success: true });
          }
          const category = matchCategoryName(text);
          if (category) {
            const { data: txn } = await sb.from('transactions').select('merchant_name, upi_id').eq('id', pendingCat.transaction_id).single();
            if (txn) {
              await sb.from('transactions').update({ category }).eq('id', pendingCat.transaction_id);
              await saveToMerchantMemory(sb, { user_id: cmdUser.id, merchant_name: txn.merchant_name || txn.upi_id || 'Unknown', upi_id: txn.upi_id || txn.merchant_name, category, is_p2p: false });
              await sb.from('pending_category_confirmation').delete().eq('user_id', cmdUser.id);
              await sendWhatsAppText(senderId, `✅ Saved as *${category}*. Future payments to this person will use this category.`);
            } else {
              await sb.from('pending_category_confirmation').delete().eq('user_id', cmdUser.id);
              await sendWhatsAppText(senderId, 'Transaction no longer found. Category not updated.');
            }
            return reply.send({ success: true });
          }
        }
        const budgetParsed = parseBudgetCommand(text);
        if (budgetParsed) {
          try {
            await setBudget(sb, cmdUser.id, budgetParsed.category, budgetParsed.amount);
            await sendWhatsAppText(senderId, `✅ Budget set: *${budgetParsed.category}* ₹${budgetParsed.amount.toLocaleString('en-IN')}/month. We'll alert you when you approach or exceed it.`);
          } catch (err) {
            console.error('Budget set error:', err.message);
            await sendWhatsAppText(senderId, `❌ Could not set budget: ${err.message}`);
          }
          return reply.send({ success: true });
        }
        const reportOpt = parseReportCommand(text);
        if (reportOpt) {
          try {
            const { byCategory, total, start, end } = await getSpendingByCategory(sb, cmdUser.id, reportOpt);
            const msg = formatReportMessage({ byCategory, total, start, end }, reportOpt.type);
            if (cmdUser.opted_out !== true) await sendWhatsAppText(senderId, (msg || 'No spending in this period.') + STOP_FOOTER);
          } catch (err) {
            console.error('Report error:', err.message);
            await sendWhatsAppText(senderId, `❌ Could not generate report: ${err.message}`);
          }
          return reply.send({ success: true });
        }
        if (parseOwedToMeCommand(text)) {
          try {
            const entries = await getOwedToMe(sb, cmdUser.id);
            await sendWhatsAppText(senderId, formatOwedToMeMessage(entries));
          } catch (err) {
            console.error('Owed to me list error:', err.message);
            await sendWhatsAppText(senderId, `❌ ${err.message}`);
          }
          return reply.send({ success: true });
        }
        if (parseIOweCommand(text)) {
          try {
            const entries = await getIOwe(sb, cmdUser.id);
            await sendWhatsAppText(senderId, formatIOweMessage(entries));
          } catch (err) {
            console.error('I owe list error:', err.message);
            await sendWhatsAppText(senderId, `❌ ${err.message}`);
          }
          return reply.send({ success: true });
        }
        const groupName = parseCreateGroupCommand(text);
        if (groupName) {
          if (!ENABLE_GROUPS) {
            await sendWhatsAppText(senderId, "Groups are temporarily unavailable. We'll bring them back soon.");
            return reply.send({ success: true });
          }
          try {
            const group = await createGroup(sb, cmdUser.id, groupName, senderId);
            await sendWhatsAppText(senderId, `✅ Group *${group.name}* created. Add members: _add 9876543210 to ${group.name}_`);
          } catch (err) {
            console.error('Create group error:', err.message);
            await sendWhatsAppText(senderId, `❌ Could not create group: ${err.message}`);
          }
          return reply.send({ success: true });
        }
        const addTo = parseAddToGroupCommand(text);
        if (addTo) {
          if (!ENABLE_GROUPS) {
            await sendWhatsAppText(senderId, "Groups are temporarily unavailable. We'll bring them back soon.");
            return reply.send({ success: true });
          }
          try {
            const group = await findGroupByName(sb, cmdUser.id, addTo.groupName);
            if (!group) {
              await sendWhatsAppText(senderId, `❌ Group "${addTo.groupName}" not found. Reply _groups_ to see your groups.`);
              return reply.send({ success: true });
            }
            await addMemberToGroup(sb, group.id, addTo.phone, cmdUser.id);
            await sendWhatsAppText(senderId, `✅ Added ${addTo.phone} to *${group.name}*.`);
          } catch (err) {
            console.error('Add to group error:', err.message);
            await sendWhatsAppText(senderId, `❌ Could not add: ${err.message}`);
          }
          return reply.send({ success: true });
        }
        if (/^groups$/i.test(text.trim())) {
          if (!ENABLE_GROUPS) {
            await sendWhatsAppText(senderId, "Groups are temporarily unavailable. We'll bring them back soon.");
            return reply.send({ success: true });
          }
          try {
            const groups = await listGroupsForUser(sb, cmdUser.id);
            if (!groups.length) {
              await sendWhatsAppText(senderId, 'You have no groups yet. Create one: _create group Apartment_');
              return reply.send({ success: true });
            }
            const list = groups.map(g => `• ${g.name}`).join('\n');
            await sendWhatsAppText(senderId, `📋 *Your groups*\n\n${list}\n\nAdd expense: _expense 500 dinner in Apartment_`);
          } catch (err) {
            console.error('List groups error:', err.message);
            await sendWhatsAppText(senderId, `❌ ${err.message}`);
          }
          return reply.send({ success: true });
        }
        // Unified intent agent first: one LLM interprets message → transaction or group_expense (schema-based)
        if (shouldTryAgent(text)) {
          try {
            const intent = await parseWithUnifiedAgent(text);
            if (intent) {
              logAgentHandling('UnifiedIntent', `${intent.type}: ${intent.amount}${intent.person_name ? ` ${intent.person_name}` : ''}${intent.category ? ` ${intent.category}` : ''}`);
              if (intent.type === 'owed_to_me') {
                await addDebtEntry(sb, cmdUser.id, 'owed_to_me', intent.person_name, intent.amount);
                await sendWhatsAppText(senderId, `✅ Recorded: *${intent.person_name}* owes you ₹${intent.amount.toLocaleString('en-IN')}. Reply _who owes me_ to see your list.`);
                return reply.send({ success: true });
              }
              if (intent.type === 'i_owe') {
                await addDebtEntry(sb, cmdUser.id, 'i_owe', intent.person_name, intent.amount);
                await sendWhatsAppText(senderId, `✅ Recorded: You owe *${intent.person_name}* ₹${intent.amount.toLocaleString('en-IN')}. Reply _who I owe_ to see your list.`);
                return reply.send({ success: true });
              }
              if (intent.type === 'paid_back') {
                await addDebtEntry(sb, cmdUser.id, 'owed_to_me', intent.person_name, -intent.amount);
                await sendWhatsAppText(senderId, `✅ Recorded: *${intent.person_name}* paid you back ₹${intent.amount.toLocaleString('en-IN')}. Your balance with them has been updated. Reply _who owes me_ to see your list.`);
                return reply.send({ success: true });
              }
              if (intent.type === 'i_paid_back') {
                await addDebtEntry(sb, cmdUser.id, 'i_owe', intent.person_name, -intent.amount);
                await sendWhatsAppText(senderId, `✅ Recorded: You paid back *${intent.person_name}* ₹${intent.amount.toLocaleString('en-IN')}. Your balance with them has been updated. Reply _who I owe_ to see your list.`);
                return reply.send({ success: true });
              }
              if (intent.type === 'group_expense') {
                if (!ENABLE_GROUPS) {
                  await sendWhatsAppText(senderId, "Groups are temporarily unavailable. We'll bring them back soon.");
                  return reply.send({ success: true });
                }
                const group = await findGroupByName(sb, cmdUser.id, intent.group_name);
                if (!group) {
                  await sendWhatsAppText(senderId, `❌ Group "${intent.group_name}" not found. Reply _groups_ to see your groups.`);
                  return reply.send({ success: true });
                }
                const expenseDate = intent.expense_date || getTodayIST();
                if (intent.shares && intent.shares.length > 0) {
                  const resolved = await resolveSharesToUserIds(sb, group.id, cmdUser.id, intent.shares);
                  if (resolved.length > 0) {
                    await addExpenseWithShares(sb, group.id, cmdUser.id, intent.amount, intent.description, expenseDate, resolved);
                    await sendWhatsAppText(senderId, `✅ Added expense: ₹${intent.amount.toLocaleString('en-IN')} – ${intent.description} in *${group.name}* (custom split).`);
                  } else {
                    await addExpense(sb, group.id, cmdUser.id, intent.amount, intent.description, expenseDate);
                    await sendWhatsAppText(senderId, `✅ Added expense: ₹${intent.amount.toLocaleString('en-IN')} – ${intent.description} in *${group.name}* (split equally).`);
                  }
                } else {
                  await addExpense(sb, group.id, cmdUser.id, intent.amount, intent.description, expenseDate);
                  await sendWhatsAppText(senderId, `✅ Added expense: ₹${intent.amount.toLocaleString('en-IN')} – ${intent.description} in *${group.name}* (split equally).`);
                }
                return reply.send({ success: true });
              }
              if (intent.type === 'transaction') {
                const isP2P = intent.is_p2p === true;
                const category = isP2P ? 'pending_clarification' : intent.category;
                const todayIST = getTodayIST();
                const txnTimestamp = (intent.expense_date && intent.expense_date !== todayIST)
                  ? (dateStringToNoonISTUTC(intent.expense_date) || new Date(timestamp * 1000).toISOString())
                  : new Date(timestamp * 1000).toISOString();
                const { data: txn, error: txnErr } = await sb
                  .from('transactions')
                  .insert([{
                    user_id: cmdUser.id,
                    amount: amountForDb(intent.amount),
                    merchant_name: intent.merchant_name || 'Unknown',
                    upi_id: null,
                    category,
                    source_app: 'unified_agent',
                    parse_method: 'unified_agent',
                    confidence: 0.9,
                    timestamp: txnTimestamp
                  }])
                  .select('id')
                  .single();
                if (txnErr) {
                  console.error('Unified agent transaction insert error:', txnErr.message);
                  await sendWhatsAppText(senderId, `❌ Could not save: ${txnErr.message}`);
                  return reply.send({ success: true });
                }
                if (isP2P) {
                  try {
                    await sendClarificationAndSavePending(sb, {
                      userId: cmdUser.id,
                      whatsappNumber: senderId,
                      transactionId: txn.id,
                      merchantName: intent.merchant_name || 'Unknown',
                      upiId: null
                    });
                  } catch (e) {
                    console.error('Clarification send failed:', e.message);
                  }
                  return reply.send({ success: true });
                }
                const dateSuffix = intent.expense_date ? ` on ${intent.expense_date}` : '';
                await sendWhatsAppText(senderId, `✅ Recorded: ₹${intent.amount.toLocaleString('en-IN')} to *${intent.merchant_name}* (${intent.category})${dateSuffix}`);
                try {
                  const alertMsg = await getBudgetAlertAfterTransaction(sb, cmdUser.id, intent.category, intent.amount);
                  if (alertMsg && cmdUser.opted_out !== true) await sendWhatsAppText(senderId, alertMsg + STOP_FOOTER);
                } catch (e) {
                  console.error('Budget alert check failed:', e.message);
                }
                return reply.send({ success: true });
              }
            }
          } catch (err) {
            console.error('Unified intent agent error:', err.message);
          }
        }

        // Groups agent fallback: expense/split messages (e.g. regex "expense 500 dinner in X")
        if (ENABLE_GROUPS && groupsShouldHandle(text)) {
          logAgentHandling('Groups', text.trim().slice(0, 60));
          const handled = await groupsAgentProcess(text, {
            sb,
            userId: cmdUser.id,
            senderId,
            sendWhatsAppText,
            reply
          });
          if (handled) return reply.send({ success: true });
        }
        const balanceGroupName = parseBalanceCommand(text);
        if (balanceGroupName) {
          if (!ENABLE_GROUPS) {
            await sendWhatsAppText(senderId, "Groups are temporarily unavailable. We'll bring them back soon.");
            return reply.send({ success: true });
          }
          try {
            const group = await findGroupByName(sb, cmdUser.id, balanceGroupName);
            if (!group) {
              await sendWhatsAppText(senderId, `❌ Group "${balanceGroupName}" not found.`);
              return reply.send({ success: true });
            }
            const { youOwe, owedToYou } = await getBalanceForUser(sb, group.id, cmdUser.id);
            const msg = await formatBalanceMessage(sb, group.name, youOwe, owedToYou, cmdUser.id);
            await sendWhatsAppText(senderId, msg);
          } catch (err) {
            console.error('Balance error:', err.message);
            await sendWhatsAppText(senderId, `❌ ${err.message}`);
          }
          return reply.send({ success: true });
        }
        const settleInput = parseSettleCommand(text);
        if (settleInput) {
          if (!ENABLE_GROUPS) {
            await sendWhatsAppText(senderId, "Groups are temporarily unavailable. We'll bring them back soon.");
            return reply.send({ success: true });
          }
          try {
            const group = await findGroupByName(sb, cmdUser.id, settleInput.groupName);
            if (!group) {
              await sendWhatsAppText(senderId, `❌ Group "${settleInput.groupName}" not found.`);
              return reply.send({ success: true });
            }
            const toIdentifier = settleInput.toPhone ?? settleInput.toNameOrPhone;
            const toUserId = await resolveSettleToUser(sb, group.id, toIdentifier);
            if (!toUserId) {
              await sendWhatsAppText(senderId, `❌ Could not find that member in the group. Use phone number or name.`);
              return reply.send({ success: true });
            }
            await settleUp(sb, group.id, cmdUser.id, toUserId, settleInput.amount);
            await sendWhatsAppText(senderId, `✅ Recorded: You paid ₹${settleInput.amount.toLocaleString('en-IN')}. Reply _balance ${group.name}_ to see updated balance.`);
          } catch (err) {
            console.error('Settle error:', err.message);
            await sendWhatsAppText(senderId, `❌ ${err.message}`);
          }
          return reply.send({ success: true });
        }
        const addFamilyPhone = parseAddToFamilyCommand(text);
        if (addFamilyPhone) {
          if (!ENABLE_FAMILY) {
            await sendWhatsAppText(senderId, "Family feature is temporarily unavailable. We'll bring it back soon.");
            return reply.send({ success: true });
          }
          try {
            const result = await addToFamily(sb, cmdUser.id, addFamilyPhone);
            if (result.ok) {
              await sendWhatsAppText(senderId, '✅ Added to family. Use _family summary_ to see combined spending.');
            } else {
              await sendWhatsAppText(senderId, `❌ ${result.error}`);
            }
          } catch (err) {
            await sendWhatsAppText(senderId, `❌ ${err.message}`);
          }
          return reply.send({ success: true });
        }
        if (/^family\s+summary$/i.test(text.trim())) {
          if (!ENABLE_FAMILY) {
            await sendWhatsAppText(senderId, "Family feature is temporarily unavailable. We'll bring it back soon.");
            return reply.send({ success: true });
          }
          try {
            const data = await getFamilySpendingThisMonth(sb, cmdUser.id);
            const msg = formatFamilySummaryMessage(data);
            await sendWhatsAppText(senderId, msg);
          } catch (err) {
            await sendWhatsAppText(senderId, `❌ ${err.message}`);
          }
          return reply.send({ success: true });
        }
        const requestMoney = parseRequestMoneyCommand(text);
        if (requestMoney) {
          try {
            const requester = await sb.from('users').select('name, phone').eq('id', cmdUser.id).single().then(r => r.data);
            const requesterLabel = requester?.name || requester?.phone || 'Someone';
            const target = await findUserByPhone(sb, requestMoney.phone);
            const amountStr = `₹${requestMoney.amount.toLocaleString('en-IN')}`;
            if (target?.whatsapp_number) {
              await sendWhatsAppText(target.whatsapp_number, `💬 *UpiSense:* ${requesterLabel} is reminding you: You owe them ${amountStr}.`);
              await sendWhatsAppText(senderId, `✅ Reminder sent to ${target.name || target.whatsapp_number}.`);
            } else {
              await sendWhatsAppText(senderId, `They're not on UpiSense yet. Forward this to them:\n\n_"You owe me ${amountStr}."_`);
            }
          } catch (err) {
            await sendWhatsAppText(senderId, `❌ ${err.message}`);
          }
          return reply.send({ success: true });
        }

      }

      // When groups are disabled, reply to group-like messages from anyone (e.g. new user typing "groups")
      if (!ENABLE_GROUPS && (/^groups$/i.test(text.trim()) || parseCreateGroupCommand(text) || parseAddToGroupCommand(text) || parseBalanceCommand(text) || parseSettleCommand(text))) {
        await sendWhatsAppText(senderId, "Groups are temporarily unavailable. We'll bring them back soon.");
        return reply.send({ success: true });
      }
      // When family is disabled, reply to family-like messages from anyone
      if (!ENABLE_FAMILY && (parseAddToFamilyCommand(text) || /^family\s+summary$/i.test(text.trim()))) {
        await sendWhatsAppText(senderId, "Family feature is temporarily unavailable. We'll bring it back soon.");
        return reply.send({ success: true });
      }

      // Fallback: transaction parse (regex + LLM) then categorize and store
      const parsed = await parseTransactionUnified(text);

      if (parsed) {
        logAgentHandling('Transaction', `₹${parsed.amount} to ${(parsed.merchant || parsed.upi_id || '?').slice(0, 40)}`);
        console.log('\n✅ Transaction parsed successfully');

        // Get or create user (match both 919372999366 and 9372999366 formats)
        // Use limit(1) not maybeSingle() - duplicates can exist, we just need one
        const variants = getPhoneVariants(senderId);
        let user = null;
        for (const v of variants) {
          const { data: byWa } = await sb.from('users').select('id').eq('whatsapp_number', v).limit(1);
          if (byWa?.[0]) { user = byWa[0]; break; }
          const { data: byPhone } = await sb.from('users').select('id').eq('phone', v).limit(1);
          if (byPhone?.[0]) { user = byPhone[0]; break; }
        }

        let userId = user?.id;

        if (userId) {
          // Ensure whatsapp_number is updated to canonical format for future lookups (service_role bypasses RLS)
          await sb.from('users').update({ whatsapp_number: normalizeForWhatsApp(senderId) }).eq('id', userId);
        }

        if (!userId) {
          const canonicalPhone = normalizeForWhatsApp(senderId);
          const { data: newUser, error } = await sb
            .from('users')
            .insert([{
              whatsapp_number: canonicalPhone,
              phone: canonicalPhone,
              name: `User`,
              plan: 'free'
            }])
            .select('id')
            .single();

          if (error) {
            // Race: another request created user; do one more lookup
            if (error.code === '23505' || error.message?.includes('duplicate key')) {
              for (const v of variants) {
                const { data: found } = await sb.from('users').select('id').eq('phone', v).limit(1);
                if (found?.[0]) { userId = found[0].id; break; }
                const { data: found2 } = await sb.from('users').select('id').eq('whatsapp_number', v).limit(1);
                if (found2?.[0]) { userId = found2[0].id; break; }
              }
            }
            if (!userId) {
              console.error('❌ Error creating user:', error.message);
              if (error.message?.includes('row-level security') && !supabaseAdmin) {
                console.error('💡 Fix: Add SUPABASE_SERVICE_ROLE_KEY in Vercel (Settings → Environment Variables). Get the key from Supabase Dashboard → Project Settings → API → service_role (secret). Then redeploy.');
              }
              return reply.code(500).send({ error: 'Failed to create user' });
            }
          } else {
            userId = newUser.id;
            console.log(`👤 Created new user: ${userId}`);
            try {
              await sendWhatsAppText(senderId, getHelpMessage(true));
            } catch (e) {
              console.error('Welcome/help send failed:', e.message);
            }
          }
        }

        const merchantStr = (parsed.merchant || parsed.upi_id || '').trim();
        const isUnknownMerchant = !merchantStr || merchantStr.toLowerCase() === 'unknown';
        const amountNum = parsed.amount != null ? amountForDb(parsed.amount) : null;
        const validAmount = amountNum != null && amountNum > 0;

        if (isUnknownMerchant) {
          if (!validAmount) {
            await sendWhatsAppText(senderId, 'Send the amount you paid (e.g. 500 or 99.50) and we\'ll ask who you paid it to.');
            return reply.send({ success: true });
          }
          const amountToStore = amountForDb(amountNum) ?? amountNum;
          await sb.from('pending_recipient_ask').upsert(
            { user_id: userId, amount: amountToStore },
            { onConflict: 'user_id' }
          );
          const amountDisplay = `₹${(amountToStore ?? amountNum).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
          await sendWhatsAppText(senderId, `Who did you pay ${amountDisplay} to? Reply with the name or place so we can categorize it.`);
          return reply.send({ success: true });
        }

        // Reject 0 or null amount for known merchant
        if (!validAmount) {
          await sendWhatsAppText(senderId, 'Please send a valid amount (e.g. 500).');
          return reply.send({ success: true });
        }

        // Categorize transaction (merchant_memory → dictionary → LLM inference → P2P clarification → default)
        const { category: assignedCategory, source: categorySource } = await categorizeTransaction(
          {
            merchant: parsed.merchant,
            upi_id: parsed.upi_id,
            is_p2p: parsed.is_p2p,
            amount: parsed.amount
          },
          userId,
          sb
        );

        // Task 6: Final confidence (memory=0.95, dictionary=0.90, else parse confidence); <0.75 → ask confirm
        const { confidence: finalConfidence, shouldAskConfirm } = getFinalConfidence(
          parsed.confidence,
          categorySource
        );

        // Store transaction
        const { data: txn, error: txnError } = await sb
          .from('transactions')
          .insert([{
            user_id: userId,
            amount: amountForDb(parsed.amount),
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
        if (categorySource === 'llm') logAgentHandling('Category', `${assignedCategory} (LLM)`);

        // Task 5: If P2P needed clarification, send WhatsApp and save pending
        if (assignedCategory === 'pending_clarification') {
          try {
            await sendClarificationAndSavePending(sb, {
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
          // Task 6: Low confidence — ask user to confirm category; save pending so reply "Transport" updates it
          const { data: txnRow } = await sb.from('transactions').select('amount, merchant_name').eq('id', txn.id).single();
          const amountDisplay = txnRow?.amount != null ? Number(txnRow.amount).toLocaleString('en-IN') : (parsed.amount != null ? String(parsed.amount) : '?');
          const merchant = txnRow?.merchant_name || parsed.merchant || parsed.upi_id || 'Unknown';
          const msg = `We categorized your payment of ₹${amountDisplay} to *${merchant}* as *${assignedCategory}*. Reply YES if correct, or tell us the right category (e.g. Transport, Food).`;
          try {
            await sb.from('pending_category_confirmation').upsert({ user_id: userId, transaction_id: txn.id }, { onConflict: 'user_id' });
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
          // Tier 1: Budget alert when approaching or exceeding limit (skip if user opted out)
          try {
            const alertMsg = await getBudgetAlertAfterTransaction(sb, userId, assignedCategory, parsed.amount);
            if (alertMsg && !(await isOptedOut(sb, userId))) await sendWhatsAppText(senderId, alertMsg + STOP_FOOTER);
          } catch (err) {
            console.error('Budget alert check failed:', err.message);
          }
        }

        return reply.send({ success: true, parsed: true, txnId: txn.id });
      } else {
        console.log('⚠️  Could not parse transaction (both regex and LLM failed)');
        await logParseFailure(text, 'Both regex and LLM failed', { from_masked: senderId ? senderId.slice(-4) : null }, sb);
        return reply.send({ success: true, parsed: false, message: 'Transaction parsing failed. Please check the message format.' });
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error.message);
      logError('webhook', error, {});
      return reply.code(500).send({ error: 'Internal error' });
    }
  });

  // Test unified intent agent (GET so you can curl easily)
  fastify.get('/api/test-intent', async (request, reply) => {
    try {
      const message = request.query.message || request.query.m;
      if (!message) {
        return reply.code(400).send({ error: 'Missing message. Use ?message=500+to+restaurant' });
      }
      let intent = null;
      let errorDetail = null;
      try {
        intent = await parseWithUnifiedAgent(message);
      } catch (e) {
        errorDetail = e.message || String(e);
        console.error('❌ test-intent parse error:', errorDetail);
      }
      const hasKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10);
      return reply.send({
        success: true,
        message,
        intent,
        debug: intent ? undefined : { GEMINI_API_KEY_set: hasKey, error: errorDetail || (hasKey ? 'Agent returned null (parse or type=none)' : 'Set GEMINI_API_KEY in .env and restart') }
      });
    } catch (error) {
      console.error('❌ test-intent error:', error.message);
      return reply.code(500).send({ error: error.message });
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
        await logParseFailure(message, 'Parse failed (api/parse)', {}, sb);
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
      const summary = await getParseFailureSummary({ sinceDays, limit: 200 }, sb);
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
      const result = await seedCategories(sb);
      return reply.send({ success: true, ...result });
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // List categories (Task 4 - system defaults + DB)
  fastify.get('/api/categories', async (request, reply) => {
    try {
      const { data, error } = await sb
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
        const { data: users } = await sb.from('users').select('id').limit(1);
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
      const { category, source } = await categorizeTransaction(txn, testUserId, sb);
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
      await saveToMerchantMemory(sb, {
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

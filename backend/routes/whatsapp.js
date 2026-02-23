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
  getAskForNoteMessage
} = require('../lib/whatsapp/clarificationFlow.js');
const { sendWhatsAppText } = require('../lib/whatsapp/sendMessage.js');
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
  parseAddExpenseCommand,
  addExpense,
  getBalanceForUser,
  formatBalanceMessage,
  parseBalanceCommand,
  settleUp,
  parseSettleCommand,
  resolveSettleToUser
} = require('../lib/expenses/expenseService.js');
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
  findSimilarRecentTransaction,
  setPendingRecurringSuggestion,
  handleRecurringYes
} = require('../lib/recurring/recurringService.js');
const {
  setPendingSplit,
  handleSplitReply
} = require('../lib/splitTransaction/splitTransactionService.js');

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
              const { data: u } = await supabase.from('users').select('id').eq('whatsapp_number', v).limit(1);
              if (u?.[0]) { userId = u[0].id; break; }
              const { data: u2 } = await supabase.from('users').select('id').eq('phone', v).limit(1);
              if (u2?.[0]) { userId = u2[0].id; break; }
            }
            let justCreatedUser = false;
            if (!userId) {
              const canonicalPhone = normalizeForWhatsApp(senderId);
              const { data: newUser } = await supabase.from('users').insert([{
                whatsapp_number: canonicalPhone,
                phone: canonicalPhone,
                name: `User_${canonicalPhone.slice(-4)}`,
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
                supabase
              );
              const txnTimestamp = receipt.date ? `${receipt.date}T12:00:00.000Z` : new Date(timestamp * 1000).toISOString();
              const { data: txn } = await supabase.from('transactions').insert([{
                user_id: userId,
                amount: receipt.amount,
                merchant_name: receipt.merchant,
                upi_id: receipt.merchant,
                category: category || 'Other',
                source_app: 'receipt_parsed',
                parse_method: 'receipt_image',
                confidence: 0.85,
                timestamp: txnTimestamp
              }]).select('id').single();
              if (txn) {
                await sendWhatsAppText(senderId, `✅ Recorded from receipt: ₹${receipt.amount.toLocaleString('en-IN')} to *${receipt.merchant}* (${category || 'Other'})`);
                const alertMsg = await getBudgetAlertAfterTransaction(supabase, userId, category || 'Other', receipt.amount);
                if (alertMsg) await sendWhatsAppText(senderId, alertMsg);
                if (justCreatedUser) {
                  try { await sendWhatsAppText(senderId, getHelpMessage()); } catch (e) { /* ignore */ }
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

      // Resolve user from senderId
      const variants = getPhoneVariants(senderId);
      let msgUser = null;
      for (const v of variants) {
        const { data: u } = await supabase.from('users').select('id').eq('whatsapp_number', v).limit(1);
        if (u?.[0]) { msgUser = u[0]; break; }
        const { data: u2 } = await supabase.from('users').select('id').eq('phone', v).limit(1);
        if (u2?.[0]) { msgUser = u2[0]; break; }
      }

      if (msgUser) {
        const { data: pending } = await supabase
          .from('pending_clarifications')
          .select('transaction_id, merchant_name, upi_id, awaiting_note')
          .eq('user_id', msgUser.id)
          .maybeSingle();

        // 1. Awaiting note (user selected "Other" and we asked for a note)
        if (pending?.awaiting_note) {
          const { category, note } = await handleNoteReply(supabase, msgUser.id, text, pending);
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
          const result = await handleClarificationReply(supabase, msgUser.id, choice, pending);
          if (result.askedForNote) {
            await sendWhatsAppText(senderId, getAskForNoteMessage());
            console.log('📤 Asked user for note (Other selected)');
          } else {
            await sendWhatsAppText(senderId, `✅ Saved as *${result.category}*. Future payments to this person will use this category.`);
            console.log(`📥 Clarification: user chose ${choice} → ${result.category}`);
          }
          return reply.send({ success: true });
        }
      }

      // ----- Tier 1: WhatsApp commands (need user; create if command from new user) -----
      let cmdUser = null;
      for (const v of variants) {
        const { data: u } = await supabase.from('users').select('id').eq('whatsapp_number', v).limit(1);
        if (u?.[0]) { cmdUser = u[0]; break; }
        const { data: u2 } = await supabase.from('users').select('id').eq('phone', v).limit(1);
        if (u2?.[0]) { cmdUser = u2[0]; break; }
      }
      const isBudgetCmd = /^(?:set\s+)?budget\s+.+\s+[\d,]+\.?\d*$/i.test(text.trim());
      const isReportCmd = /^(?:monthly\s+)?(?:report|summary)\s*\S*$/i.test(text.trim()) || /^(report|summary)$/i.test(text.trim());
      const isGroupCmd = /^(?:create|new)\s+group\s+.+$/i.test(text.trim()) || /^add\s+.+\s+to\s+.+$/i.test(text.trim()) || /^groups$/i.test(text.trim());
      const isExpenseCmd = /^expense\s+\d+.+in\s+.+$/i.test(text.trim()) || /^balance\s+(?:in\s+)?.+$/i.test(text.trim()) || /^settle(?:\s+up)?\s+\d+.+$/i.test(text.trim());
      const isFamilyCmd = /^add\s+(?:to\s+)?family\s+\d+$/i.test(text.trim()) || /^add\s+\d+\s+to\s+family$/i.test(text.trim()) || /^family\s+summary$/i.test(text.trim());
      const isRequestCmd = /^request\s+[\d,.]+\s+from\s+\d+$/i.test(text.trim()) || /^remind\s+.+\s+about\s+[\d,.]+\s*$/i.test(text.trim());
      const isHelpCmd = /^(help|menu|commands|start|what can you do|hi|hello)$/i.test(text.trim());
      if (!cmdUser && (isBudgetCmd || isReportCmd || isGroupCmd || isExpenseCmd || isFamilyCmd || isRequestCmd || isHelpCmd)) {
        const canonicalPhone = normalizeForWhatsApp(senderId);
        const { data: newU, error } = await supabase.from('users').insert([{
          whatsapp_number: canonicalPhone,
          phone: canonicalPhone,
          name: `User_${canonicalPhone.slice(-4)}`,
          plan: 'free'
        }]).select('id').single();
        if (!error && newU) cmdUser = newU;
      }
      if (cmdUser) {
        const trimmedLower = text.trim().toLowerCase();
        if (isHelpCmd) {
          await sendWhatsAppText(senderId, getHelpMessage());
          return reply.send({ success: true });
        }
        const { data: pendingRecurring } = await supabase.from('pending_recurring_suggestion').select('transaction_id').eq('user_id', cmdUser.id).maybeSingle();
        if (pendingRecurring && (trimmedLower === 'yes' || trimmedLower === 'y')) {
          const ok = await handleRecurringYes(supabase, cmdUser.id);
          await sendWhatsAppText(senderId, ok ? '✅ Marked as recurring. We\'ll use this for future insights.' : 'No pending suggestion.');
          return reply.send({ success: true });
        }
        const splitResult = await handleSplitReply(supabase, cmdUser.id, text);
        if (splitResult.handled) {
          if (splitResult.error) await sendWhatsAppText(senderId, `❌ ${splitResult.error}`);
          else if (splitResult.message) await sendWhatsAppText(senderId, splitResult.message);
          return reply.send({ success: true });
        }
        // Category correction: user replied with a category name (e.g. "Transport") to our "tell us the right category" prompt
        const { data: pendingCat } = await supabase.from('pending_category_confirmation').select('transaction_id').eq('user_id', cmdUser.id).maybeSingle();
        if (pendingCat) {
          const trimmed = text.trim().toLowerCase();
          if (trimmed === 'yes' || trimmed === 'y') {
            await supabase.from('pending_category_confirmation').delete().eq('user_id', cmdUser.id);
            await sendWhatsAppText(senderId, '✅ Got it! Category confirmed.');
            return reply.send({ success: true });
          }
          const category = matchCategoryName(text);
          if (category) {
            const { data: txn } = await supabase.from('transactions').select('merchant_name, upi_id').eq('id', pendingCat.transaction_id).single();
            if (txn) {
              await supabase.from('transactions').update({ category }).eq('id', pendingCat.transaction_id);
              await saveToMerchantMemory(supabase, { user_id: cmdUser.id, merchant_name: txn.merchant_name || txn.upi_id || 'Unknown', upi_id: txn.upi_id || txn.merchant_name, category, is_p2p: false });
              await supabase.from('pending_category_confirmation').delete().eq('user_id', cmdUser.id);
              await sendWhatsAppText(senderId, `✅ Saved as *${category}*. Future payments to this person will use this category.`);
            } else {
              await supabase.from('pending_category_confirmation').delete().eq('user_id', cmdUser.id);
              await sendWhatsAppText(senderId, 'Transaction no longer found. Category not updated.');
            }
            return reply.send({ success: true });
          }
        }
        const budgetParsed = parseBudgetCommand(text);
        if (budgetParsed) {
          try {
            await setBudget(supabase, cmdUser.id, budgetParsed.category, budgetParsed.amount);
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
            const { byCategory, total, start, end } = await getSpendingByCategory(supabase, cmdUser.id, reportOpt);
            const msg = formatReportMessage({ byCategory, total, start, end }, reportOpt.type);
            await sendWhatsAppText(senderId, msg || 'No spending in this period.');
          } catch (err) {
            console.error('Report error:', err.message);
            await sendWhatsAppText(senderId, `❌ Could not generate report: ${err.message}`);
          }
          return reply.send({ success: true });
        }
        const groupName = parseCreateGroupCommand(text);
        if (groupName) {
          try {
            const group = await createGroup(supabase, cmdUser.id, groupName, senderId);
            await sendWhatsAppText(senderId, `✅ Group *${group.name}* created. Add members: _add 9876543210 to ${group.name}_`);
          } catch (err) {
            console.error('Create group error:', err.message);
            await sendWhatsAppText(senderId, `❌ Could not create group: ${err.message}`);
          }
          return reply.send({ success: true });
        }
        const addTo = parseAddToGroupCommand(text);
        if (addTo) {
          try {
            const group = await findGroupByName(supabase, cmdUser.id, addTo.groupName);
            if (!group) {
              await sendWhatsAppText(senderId, `❌ Group "${addTo.groupName}" not found. Reply _groups_ to see your groups.`);
              return reply.send({ success: true });
            }
            await addMemberToGroup(supabase, group.id, addTo.phone, cmdUser.id);
            await sendWhatsAppText(senderId, `✅ Added ${addTo.phone} to *${group.name}*.`);
          } catch (err) {
            console.error('Add to group error:', err.message);
            await sendWhatsAppText(senderId, `❌ Could not add: ${err.message}`);
          }
          return reply.send({ success: true });
        }
        if (/^groups$/i.test(text.trim())) {
          try {
            const groups = await listGroupsForUser(supabase, cmdUser.id);
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
        const expenseInput = parseAddExpenseCommand(text);
        if (expenseInput) {
          try {
            const group = await findGroupByName(supabase, cmdUser.id, expenseInput.groupName);
            if (!group) {
              await sendWhatsAppText(senderId, `❌ Group "${expenseInput.groupName}" not found. Reply _groups_ to see your groups.`);
              return reply.send({ success: true });
            }
            const expenseDate = new Date().toISOString().slice(0, 10);
            await addExpense(supabase, group.id, cmdUser.id, expenseInput.amount, expenseInput.description, expenseDate);
            await sendWhatsAppText(senderId, `✅ Added expense: ₹${expenseInput.amount.toLocaleString('en-IN')} – ${expenseInput.description} in *${group.name}* (split equally).`);
          } catch (err) {
            console.error('Add expense error:', err.message);
            await sendWhatsAppText(senderId, `❌ ${err.message}`);
          }
          return reply.send({ success: true });
        }
        const balanceGroupName = parseBalanceCommand(text);
        if (balanceGroupName) {
          try {
            const group = await findGroupByName(supabase, cmdUser.id, balanceGroupName);
            if (!group) {
              await sendWhatsAppText(senderId, `❌ Group "${balanceGroupName}" not found.`);
              return reply.send({ success: true });
            }
            const { youOwe, owedToYou } = await getBalanceForUser(supabase, group.id, cmdUser.id);
            const msg = await formatBalanceMessage(supabase, group.name, youOwe, owedToYou, cmdUser.id);
            await sendWhatsAppText(senderId, msg);
          } catch (err) {
            console.error('Balance error:', err.message);
            await sendWhatsAppText(senderId, `❌ ${err.message}`);
          }
          return reply.send({ success: true });
        }
        const settleInput = parseSettleCommand(text);
        if (settleInput) {
          try {
            const group = await findGroupByName(supabase, cmdUser.id, settleInput.groupName);
            if (!group) {
              await sendWhatsAppText(senderId, `❌ Group "${settleInput.groupName}" not found.`);
              return reply.send({ success: true });
            }
            const toIdentifier = settleInput.toPhone ?? settleInput.toNameOrPhone;
            const toUserId = await resolveSettleToUser(supabase, group.id, toIdentifier);
            if (!toUserId) {
              await sendWhatsAppText(senderId, `❌ Could not find that member in the group. Use phone number or name.`);
              return reply.send({ success: true });
            }
            await settleUp(supabase, group.id, cmdUser.id, toUserId, settleInput.amount);
            await sendWhatsAppText(senderId, `✅ Recorded: You paid ₹${settleInput.amount.toLocaleString('en-IN')}. Reply _balance ${group.name}_ to see updated balance.`);
          } catch (err) {
            console.error('Settle error:', err.message);
            await sendWhatsAppText(senderId, `❌ ${err.message}`);
          }
          return reply.send({ success: true });
        }
        const addFamilyPhone = parseAddToFamilyCommand(text);
        if (addFamilyPhone) {
          try {
            const result = await addToFamily(supabase, cmdUser.id, addFamilyPhone);
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
          try {
            const data = await getFamilySpendingThisMonth(supabase, cmdUser.id);
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
            const requester = await supabase.from('users').select('name, phone').eq('id', cmdUser.id).single().then(r => r.data);
            const requesterLabel = requester?.name || requester?.phone || 'Someone';
            const target = await findUserByPhone(supabase, requestMoney.phone);
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
            try {
              await sendWhatsAppText(senderId, getHelpMessage());
            } catch (e) {
              console.error('Welcome/help send failed:', e.message);
            }
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
          // Task 6: Low confidence — ask user to confirm category; save pending so reply "Transport" updates it
          const { data: txnRow } = await supabase.from('transactions').select('amount, merchant_name').eq('id', txn.id).single();
          const amountDisplay = txnRow?.amount != null ? Number(txnRow.amount).toLocaleString('en-IN') : (parsed.amount != null ? String(parsed.amount) : '?');
          const merchant = txnRow?.merchant_name || parsed.merchant || parsed.upi_id || 'Unknown';
          const msg = `We categorized your payment of ₹${amountDisplay} to *${merchant}* as *${assignedCategory}*. Reply YES if correct, or tell us the right category (e.g. Transport, Food).`;
          try {
            await supabase.from('pending_category_confirmation').upsert({ user_id: userId, transaction_id: txn.id }, { onConflict: 'user_id' });
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
          // Tier 1: Budget alert when approaching or exceeding limit
          try {
            const alertMsg = await getBudgetAlertAfterTransaction(supabase, userId, assignedCategory, parsed.amount);
            if (alertMsg) await sendWhatsAppText(senderId, alertMsg);
          } catch (err) {
            console.error('Budget alert check failed:', err.message);
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

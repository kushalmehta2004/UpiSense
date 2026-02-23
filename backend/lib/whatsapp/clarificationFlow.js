/**
 * Task 5: WhatsApp clarification flow for P2P transactions
 * Build message, parse reply, map to category
 */

const { P2P_CLARIFICATION_OPTIONS } = require('../categories/defaults.js');
const { sendWhatsAppText } = require('./sendMessage.js');
const { saveToMerchantMemory } = require('../categorization/categorizeTransaction.js');

const OTHER_OPTION_INDEX = 6; // "Other" is option 6

/**
 * Build clarification message text
 */
function buildClarificationMessage(merchantName) {
  const lines = [
    `Payment to *${merchantName}* detected. What was this for?`,
    ''
  ];
  P2P_CLARIFICATION_OPTIONS.forEach((opt, i) => {
    lines.push(`${i + 1}️⃣ ${opt.label}`);
  });
  lines.push('');
  lines.push('Reply with the number (1–6).');
  return lines.join('\n');
}

/**
 * Send clarification question via WhatsApp and record pending state
 */
async function sendClarificationAndSavePending(supabase, params) {
  const { userId, whatsappNumber, transactionId, merchantName, upiId } = params;
  const message = buildClarificationMessage(merchantName);
  const sendResult = await sendWhatsAppText(whatsappNumber, message);
  if (!sendResult.success) {
    console.error('❌ Clarification WhatsApp send failed:', sendResult.error);
    throw new Error(sendResult.error || 'WhatsApp send failed');
  }

  await supabase.from('pending_clarifications').delete().eq('user_id', userId);
  const { error } = await supabase.from('pending_clarifications').insert({
    user_id: userId,
    transaction_id: transactionId,
    merchant_name: merchantName,
    upi_id: upiId || merchantName
  });
  if (error) throw error;
}

/**
 * Parse user reply: "1" or "2" etc. Returns 1-based index or null
 */
function parseClarificationReply(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const num = parseInt(trimmed, 10);
  if (num >= 1 && num <= P2P_CLARIFICATION_OPTIONS.length) return num;
  return null;
}

/**
 * Get category and label for option index (1-based). Use label in user-facing messages.
 */
function getCategoryForOptionIndex(index) {
  const opt = P2P_CLARIFICATION_OPTIONS[index - 1];
  return opt ? opt.category : 'Other';
}

function getLabelForOptionIndex(index) {
  const opt = P2P_CLARIFICATION_OPTIONS[index - 1];
  return opt ? opt.label : 'Other';
}

/**
 * Handle clarification reply: save to merchant_memory, update transaction, clear pending.
 * If choice is "Other" (6), asks for a note instead of finishing.
 * @returns {{ done: boolean, category?: string, askedForNote?: boolean }}
 */
async function handleClarificationReply(supabase, userId, choiceIndex, pendingRow) {
  const category = getCategoryForOptionIndex(choiceIndex);

  // "Other" → ask for note, don't finish yet
  if (choiceIndex === OTHER_OPTION_INDEX) {
    await supabase
      .from('pending_clarifications')
      .update({ awaiting_note: true })
      .eq('user_id', userId);
    return { done: false, askedForNote: true };
  }

  await saveToMerchantMemory(supabase, {
    user_id: userId,
    upi_id: pendingRow.upi_id,
    merchant_name: pendingRow.merchant_name,
    category,
    is_p2p: true
  });

  await supabase
    .from('transactions')
    .update({ category })
    .eq('id', pendingRow.transaction_id);

  await supabase
    .from('pending_clarifications')
    .delete()
    .eq('user_id', userId);

  const label = getLabelForOptionIndex(choiceIndex);
  return { done: true, category, label };
}

/**
 * Handle note reply (when user selected "Other" and sent their note)
 */
async function handleNoteReply(supabase, userId, noteText, pendingRow) {
  const note = (noteText || '').trim().slice(0, 500) || null;
  const category = 'Other';

  await saveToMerchantMemory(supabase, {
    user_id: userId,
    upi_id: pendingRow.upi_id,
    merchant_name: pendingRow.merchant_name,
    category,
    is_p2p: true
  });

  await supabase
    .from('transactions')
    .update({ category, notes: note })
    .eq('id', pendingRow.transaction_id);

  await supabase
    .from('pending_clarifications')
    .delete()
    .eq('user_id', userId);

  return { category, note };
}

/** Message to send when asking for note (after user selects Other) */
function getAskForNoteMessage() {
  return 'Add a note to remember what this was for (e.g. concert ticket, dinner):';
}

module.exports = {
  buildClarificationMessage,
  sendClarificationAndSavePending,
  parseClarificationReply,
  getCategoryForOptionIndex,
  getLabelForOptionIndex,
  handleClarificationReply,
  handleNoteReply,
  getAskForNoteMessage,
  P2P_OPTIONS_COUNT: P2P_CLARIFICATION_OPTIONS.length
};

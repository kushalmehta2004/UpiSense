/**
 * Task 5: WhatsApp clarification flow for P2P transactions
 * Build message, parse reply, map to category
 */

const { P2P_CLARIFICATION_OPTIONS } = require('../categories/defaults.js');
const { sendWhatsAppText } = require('./sendMessage.js');
const { saveToMerchantMemory } = require('../categorization/categorizeTransaction.js');

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
 * Get category for option index (1-based)
 */
function getCategoryForOptionIndex(index) {
  const opt = P2P_CLARIFICATION_OPTIONS[index - 1];
  return opt ? opt.category : 'Other';
}

/**
 * Handle clarification reply: save to merchant_memory, update transaction, clear pending
 */
async function handleClarificationReply(supabase, userId, choiceIndex, pendingRow) {
  const category = getCategoryForOptionIndex(choiceIndex);
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

  return category;
}

module.exports = {
  buildClarificationMessage,
  sendClarificationAndSavePending,
  parseClarificationReply,
  getCategoryForOptionIndex,
  handleClarificationReply,
  P2P_OPTIONS_COUNT: P2P_CLARIFICATION_OPTIONS.length
};

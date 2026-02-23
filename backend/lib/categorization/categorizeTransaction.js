/**
 * Transaction categorization: merchant_memory → dictionary → LLM inference → P2P clarification → default
 */

const { getCategoryForMerchant, ensureLoaded } = require('../merchants/lookup.js');
const { inferCategoryWithLLM } = require('./inferCategoryWithLLM.js');

/**
 * Determine category for a parsed transaction
 * 1. Check merchant_memory (user's learned preferences)
 * 2. Check dictionary (known merchants)
 * 3. If P2P and not found: pending_clarification (WhatsApp flow in Task 5)
 * 4. Default: Other
 *
 * @param {Object} txn - Parsed transaction { merchant, upi_id, is_p2p }
 * @param {string} userId - User UUID
 * @param {Object} supabase - Supabase client
 * @returns {Promise<{ category: string, source: 'memory'|'dictionary'|'llm'|'pending_clarification'|'default' }>}
 */
async function categorizeTransaction(txn, userId, supabase) {
  const merchantName = txn.merchant || txn.upi_id || 'Unknown';
  const upiId = txn.upi_id || null;
  const isP2P = txn.is_p2p === true;

  // 1. Check merchant_memory first (user's learned preferences)
  const memoryCategory = await getFromMerchantMemory(userId, upiId, merchantName, supabase);
  if (memoryCategory) {
    return { category: memoryCategory, source: 'memory' };
  }

  // 2. Check dictionary (known merchants)
  await ensureLoaded();
  const dictResult = getCategoryForMerchant(merchantName);
  if (dictResult) {
    return { category: dictResult.category, source: 'dictionary' };
  }

  // Also try UPI ID part (e.g. "swiggy@paytm" -> lookup "swiggy")
  if (upiId) {
    const upiPart = upiId.split('@')[0];
    if (upiPart && upiPart !== merchantName) {
      const dictResult2 = getCategoryForMerchant(upiPart);
      if (dictResult2) {
        return { category: dictResult2.category, source: 'dictionary' };
      }
    }
  }

  // 3. If P2P and unknown: needs clarification (Task 5 will send WhatsApp)
  if (isP2P) {
    return { category: 'pending_clarification', source: 'pending_clarification' };
  }

  // 4. Use Gemini to infer category from merchant/description (e.g. "restaurant" → Food & Dining)
  try {
    const llmCategory = await inferCategoryWithLLM(merchantName, txn.amount ?? null);
    if (llmCategory) {
      return { category: llmCategory, source: 'llm' };
    }
  } catch (err) {
    console.error('LLM category inference failed:', err.message);
  }

  // 5. Default for unknown merchants
  return { category: 'Other', source: 'default' };
}

/**
 * Look up category from merchant_memory
 * We store upi_id = merchant_name when upi_id is null (P2P), so try both
 */
async function getFromMerchantMemory(userId, upiId, merchantName, supabase) {
  const lookupKeys = [upiId, merchantName].filter(Boolean);
  for (const key of lookupKeys) {
    const { data } = await supabase
      .from('merchant_memory')
      .select('category')
      .eq('user_id', userId)
      .eq('upi_id', key)
      .limit(1)
      .maybeSingle();
    if (data?.category) return data.category;
  }
  return null;
}

/**
 * Store user's merchant preference in merchant_memory (for learning)
 * Used when user responds to P2P clarification or manually sets category
 *
 * @param {Object} supabase - Supabase client
 * @param {Object} params - { user_id, upi_id?, merchant_name, category, is_p2p? }
 */
async function saveToMerchantMemory(supabase, params) {
  const { user_id, upi_id, merchant_name, category, is_p2p = false } = params;
  if (!user_id || !merchant_name || !category) {
    throw new Error('user_id, merchant_name, and category are required');
  }

  // Use merchant_name as upi_id when null (for P2P) - required for UNIQUE(user_id, upi_id)
  const lookupKey = upi_id || merchant_name;
  const row = {
    user_id,
    upi_id: lookupKey,
    merchant_name,
    category,
    is_p2p
  };

  const { error } = await supabase
    .from('merchant_memory')
    .upsert(row, {
      onConflict: 'user_id,upi_id'
    });

  if (error) throw error;
}

module.exports = {
  categorizeTransaction,
  getFromMerchantMemory,
  saveToMerchantMemory
};

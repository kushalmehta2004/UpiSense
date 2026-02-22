const { parseTransaction } = require('./regexTemplates');
const { parseWithLLM } = require('./llmParser');

/**
 * Unified parser: tries regex first, falls back to LLM if regex fails
 * @param {string} text - Raw UPI notification text
 * @returns {Promise<Object|null>} - Parsed transaction data or null
 */
async function parseTransactionUnified(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  console.log('\n🔍 Starting unified parsing...');
  console.log(`   Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);

  // Step 1: Try regex parsing first (fast, free, high confidence)
  const regexResult = parseTransaction(text);
  
  if (regexResult) {
    console.log('✅ Regex parsing succeeded - using regex result');
    return regexResult;
  }

  console.log('⚠️  Regex parsing failed, trying LLM fallback...');

  // Step 2: Fallback to LLM parsing (slower, costs money, but handles edge cases)
  const llmResult = await parseWithLLM(text);
  
  if (llmResult) {
    console.log('✅ LLM parsing succeeded - using LLM result');
    return llmResult;
  }

  console.log('❌ Both regex and LLM parsing failed');
  return null;
}

module.exports = { parseTransactionUnified };


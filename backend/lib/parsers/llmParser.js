const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

// Initialize Gemini AI (lazy initialization)
function initializeGemini() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.length > 10) {
      genAI = new GoogleGenerativeAI(key);
      console.log('✅ Gemini AI initialized');
    } else {
      console.warn('⚠️  GEMINI_API_KEY not set or invalid. LLM fallback disabled.');
    }
  }
  return genAI;
}

/**
 * Parse UPI transaction using Gemini LLM as fallback
 * @param {string} text - Raw UPI notification text
 * @returns {Promise<Object|null>} - Parsed transaction data or null if parsing fails
 */
async function parseWithLLM(text) {
  try {
    const ai = initializeGemini();
    if (!ai) {
      console.log('⚠️  Gemini AI not available, skipping LLM parsing');
      return null;
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = ai.getGenerativeModel({ model: modelName });
    
    const prompt = `Extract UPI transaction data from the following text. Return ONLY a valid JSON object with these exact fields:
{
  "amount_inr": <number or null>,
  "merchant_name": <string or null>,
  "upi_id": <string or null>,
  "is_p2p": <boolean>,
  "ref": <string or null>
}

Rules:
- amount_inr: Extract the amount in INR as a number (remove commas, currency symbols)
- merchant_name: Extract the merchant/recipient name (clean, no extra spaces)
- upi_id: Extract UPI ID if present (format: name@bank or phone@bank)
- is_p2p: true if this appears to be a person-to-person payment (not a merchant), false otherwise
- ref: Extract transaction reference/UTR/UPI reference number if present

Text: "${text}"

Return ONLY the JSON object, no explanation, no markdown, no code blocks.`;

    console.log('🤖 Calling Gemini API for LLM parsing...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();
    
    // Clean the response (remove markdown code blocks if present)
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(cleanedText);
    
    // Validate and normalize the response
    const result_obj = {
      source_app: 'llm_parsed',
      parse_method: 'llm',
      confidence: calculateLLMConfidence(parsed),
      amount: parsed.amount_inr ? parseFloat(parsed.amount_inr) : null,
      merchant: parsed.merchant_name || null,
      upi_id: parsed.upi_id || null,
      is_p2p: parsed.is_p2p === true || parsed.is_p2p === 'true',
      ref: parsed.ref || null
    };

    console.log(`✅ LLM parsed: ${JSON.stringify({
      amount: result_obj.amount,
      merchant: result_obj.merchant || result_obj.upi_id,
      is_p2p: result_obj.is_p2p,
      confidence: result_obj.confidence
    })}`);

    return result_obj;
  } catch (error) {
    console.error('❌ LLM parsing error:', error.message);
    if (error.response) console.error('   API response:', error.response);
    if (error.stack) console.error('   Stack:', error.stack);
    return null;
  }
}

/**
 * Calculate confidence score for LLM parsing (Task 6)
 * - Clear fields = 0.80, null/missing critical fields = 0.60
 */
function calculateLLMConfidence(parsed) {
  const hasAmount = !!parsed.amount_inr;
  const hasRecipient = !!(parsed.merchant_name || parsed.upi_id);
  if (!hasAmount || !hasRecipient) {
    return 0.60; // LLM with null fields
  }
  return 0.80; // LLM with clear fields
}

module.exports = { parseWithLLM, initializeGemini };


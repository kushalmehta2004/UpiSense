/**
 * Send WhatsApp text message via Meta Cloud API
 * Task 5: Clarification flow
 */

const axios = require('axios');

const META_API_BASE = 'https://graph.facebook.com/v18.0';

/**
 * Send a text message to a WhatsApp user
 * @param {string} to - Recipient phone number (with country code, no +)
 * @param {string} body - Message text
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
async function sendWhatsAppText(to, body) {
  const phoneId = process.env.META_PHONE_ID;
  const token = process.env.META_ACCESS_TOKEN;
  if (!phoneId || !token) {
    console.warn('⚠️ META_PHONE_ID or META_ACCESS_TOKEN not set. Skipping WhatsApp send.');
    return { success: false, error: 'WhatsApp not configured' };
  }
  try {
    const url = `${META_API_BASE}/${phoneId}/messages`;
    const { data } = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''), // digits only
        type: 'text',
        text: { body }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const messageId = data?.messages?.[0]?.id;
    const errCode = data?.error?.code;
    if (errCode) {
      console.error('❌ WhatsApp API returned error:', data?.error?.message || data?.error);
      return { success: false, error: data?.error?.message || 'Unknown API error' };
    }
    console.log(`📤 WhatsApp sent to ${to}: ${messageId || 'ok'}`);
    return { success: true, messageId };
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    const code = error.response?.data?.error?.code;
    const subcode = error.response?.data?.error?.error_subcode;
    console.error('❌ WhatsApp send failed:', errMsg, code ? `(code: ${code})` : '', subcode ? `subcode: ${subcode}` : '');
    if (error.response?.data) console.error('   Meta response:', JSON.stringify(error.response.data));
    return { success: false, error: errMsg };
  }
}

module.exports = { sendWhatsAppText };

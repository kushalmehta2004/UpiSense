const templates = {
  gpay_you_sent: {
    pattern: /You sent\s+[₹Rs?]*\s*([\d,]+)\s+to\s+(.+?)\.\s+Transaction ID:\s*(\S+)/is,
    fields: ['amount', 'merchant', 'ref'],
    sourceApp: 'google_pay',
    confidence: 0.95
  },
  gpay: {
    pattern: /Rs[\.\s]+([\d,]+(?:\.\d{2})?)\s+paid to\s+([^.]+?)\s+via GPay.*?(?:UPI Ref|Ref):\s*(\S+)/is,
    fields: ['amount', 'merchant', 'ref'],
    sourceApp: 'google_pay',
    confidence: 0.95
  },
  phonepe_standard: {
    pattern: /Payment of Rs\.?([\d,]+(?:\.\d{2})?)\s+to\s+([^.]+?)\s+(?:is|was)?\s*successful.*?(?:Reference|Ref).*?is:\s*(\S+)/is,
    fields: ['amount', 'merchant', 'ref'],
    sourceApp: 'phonepe',
    confidence: 0.95
  },
  paytm: {
    pattern: /You have paid Rs[\.\s]*([\d,]+(?:\.\d{2})?)\s+to\s+([^.]+?)(?:\.|\s|via).*?(?:UPI Ref|Ref):\s*(\S+)/is,
    fields: ['amount', 'merchant', 'ref'],
    sourceApp: 'paytm',
    confidence: 0.95
  },
  sbi: {
    pattern: /A\/C X(\d{4}).*debited by Rs\s*([\d,]+(?:\.\d{2})?)\s+.*?trf to\s+([^\s.]+).*?(?:Ref No|Ref):\s*(\S+)/is,
    fields: ['account_last4', 'amount', 'upi_id', 'ref'],
    sourceApp: 'sbi',
    confidence: 0.95
  },
  sbi_alternate: {
    pattern: /A\/C X(\d{4}).*debited by Rs\s*([\d,]+(?:\.\d{2})?)\s+on.*?trf to\s+([^\s.]+)/is,
    fields: ['account_last4', 'amount', 'upi_id'],
    sourceApp: 'sbi',
    confidence: 0.85
  },
  hdfc_standard: {
    pattern: /HDFC Bank:\s*Rs\s*([\d,]+(?:\.\d{2})?)\s+debited.*?(?:to|Beneficiary):\s*([^\s.]+).*?(?:Ref|Reference):\s*(\S+)/is,
    fields: ['amount', 'upi_id', 'ref'],
    sourceApp: 'hdfc',
    confidence: 0.95
  },
  icici: {
    pattern: /ICICI.*?Rs\s*([\d,]+(?:\.\d{2})?)\s+.*?to\s+([^\s.]+).*?(?:Ref|UTR):\s*(\S+)/is,
    fields: ['amount', 'upi_id', 'ref'],
    sourceApp: 'icici',
    confidence: 0.90
  },
  axis: {
    pattern: /Axis Bank.*?Rs\s*([\d,]+(?:\.\d{2})?)\s+.*?([^\s.]+).*?(?:Ref|UTR):\s*(\S+)/is,
    fields: ['amount', 'upi_id', 'ref'],
    sourceApp: 'axis',
    confidence: 0.90
  },
  generic_paid: {
    pattern: /Rs[\.\s]*([\d,]+(?:\.\d{2})?)\s+paid to\s+([^\s.]+)\s+(?:via UPI)?.*?(?:Ref|Reference):\s*(\S+)/is,
    fields: ['amount', 'merchant', 'ref'],
    sourceApp: 'generic',
    confidence: 0.85
  },
  generic_payment: {
    pattern: /Payment of Rs[\.\s]*([\d,]+(?:\.\d{2})?)\s+to\s+([^\s.]+)\s+(?:is successful)?.*?(?:Ref|Reference):\s*(\S+)/is,
    fields: ['amount', 'merchant', 'ref'],
    sourceApp: 'generic',
    confidence: 0.80
  },
  generic_simple: {
    pattern: /Rs[\.\s]*([\d,]+(?:\.\d{2})?)\s+.*?(?:Ref|Reference|UTR):\s*(\S+)/is,
    fields: ['amount', 'ref'],
    sourceApp: 'generic',
    confidence: 0.70
  },
  // NLP-friendly: "paid 100 to auto", "paid 100 rupees to cab", "I paid 50 to rickshaw"
  user_paid_to: {
    pattern: /(?:i\s+)?paid\s+([\d,]+(?:\s*\.\d{2})?)\s*(?:rupees?|rs\.?|inr)?\s+to\s+(.+?)(?:\.|$|\s+on)/is,
    fields: ['amount', 'merchant'],
    sourceApp: 'user',
    confidence: 0.90
  },
  user_paid_to_simple: {
    pattern: /(?:i\s+)?paid\s+([\d,]+)\s+to\s+(\S+)/i,
    fields: ['amount', 'merchant'],
    sourceApp: 'user',
    confidence: 0.85
  }
};

function normalizeAmount(amountStr) {
  if (!amountStr) return null;
  const cleaned = amountStr.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseTransaction(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  console.log('🔍 Attempting to parse:', text);

  for (const [source, config] of Object.entries(templates)) {
    const match = text.match(config.pattern);
    console.log(`   Trying ${source}: ${match ? '✅ MATCH' : '❌ no match'}`);
    if (match) {
      const result = {
        source_app: config.sourceApp,
        parse_method: 'regex',
        confidence: config.confidence,
        raw_match: match[0]
      };

      config.fields.forEach((field, idx) => {
        const value = match[idx + 1];
        if (value) {
          if (field === 'amount') {
            result[field] = normalizeAmount(value);
          } else {
            result[field] = value.trim();
          }
        }
      });

      // Ensure amount is extracted
      if (!result.amount && result.merchant) {
        result.confidence -= 0.1;
      }

      console.log(`✅ Parsed with ${source}: ${JSON.stringify({
        amount: result.amount,
        merchant: result.merchant || result.upi_id,
        ref: result.ref,
        confidence: result.confidence
      })}`);

      return result;
    }
  }

  return null;
}

module.exports = { parseTransaction, templates };

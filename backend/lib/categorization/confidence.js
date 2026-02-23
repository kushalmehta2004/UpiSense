/**
 * Task 6: Confidence scoring
 * - Regex = 0.95, LLM clear = 0.80, LLM nulls = 0.60
 * - Memory = 0.95, Dictionary = 0.90
 * - If final < 0.75 → ask user to confirm
 */

const CONFIDENCE = {
  REGEX: 0.95,
  LLM_CLEAR: 0.80,
  LLM_WITH_NULLS: 0.60,
  MEMORY: 0.95,
  DICTIONARY: 0.90,
  THRESHOLD_ASK_CONFIRM: 0.75
};

/**
 * Compute final confidence for storage and for "ask confirm" decision.
 * @param {number} parseConfidence - From regex or LLM (0–1)
 * @param {string} categorySource - 'memory' | 'dictionary' | 'pending_clarification' | 'default'
 * @returns {{ confidence: number, shouldAskConfirm: boolean }}
 */
function getFinalConfidence(parseConfidence, categorySource) {
  let confidence = parseConfidence ?? 0.5;

  if (categorySource === 'memory') {
    confidence = CONFIDENCE.MEMORY;
  } else if (categorySource === 'dictionary') {
    confidence = CONFIDENCE.DICTIONARY;
  } else if (categorySource === 'llm') {
    confidence = 0.85; // Gemini-inferred category (e.g. restaurant → Food & Dining)
  }
  // else keep parse confidence (regex already 0.95, LLM 0.60–0.85)

  const shouldAskConfirm =
    confidence < CONFIDENCE.THRESHOLD_ASK_CONFIRM &&
    categorySource !== 'pending_clarification';

  return { confidence, shouldAskConfirm };
}

module.exports = {
  CONFIDENCE,
  getFinalConfidence
};

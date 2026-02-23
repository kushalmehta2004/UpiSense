/**
 * Agent router: which agent should handle this message?
 * - Groups agent: expense/split messages ("expense 500 to 306 where friend owes 200")
 * - Transaction agent: payment recordings ("200 to restaurant", "Paid 200 for dinner at restaurant")
 *
 * Order: try Groups first (they have clear intent), then Transaction (parse amount + recipient).
 */

const { shouldHandle: groupsShouldHandle } = require('./groupsAgent.js');

/**
 * Returns 'groups' if the message looks like a group expense/split, else null.
 * Transaction path is the fallback (no need to "claim" here).
 */
function whichAgent(text) {
  if (groupsShouldHandle(text)) return 'groups';
  return null;
}

/** Log when an agent handles a message (for debugging / "agent lit up" feel) */
function logAgentHandling(agentName, detail) {
  console.log(`[Agent] ${agentName} handling${detail ? `: ${detail}` : ''}`);
}

module.exports = { whichAgent, logAgentHandling };

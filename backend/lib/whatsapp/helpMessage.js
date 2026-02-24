/**
 * Single source of truth for bot description / help / menu
 * Shown on "help", "menu", "commands", "start", "hi", "hello" and when a new user is created.
 * For the WhatsApp Business profile "About" text, set it in Meta Business Suite using getBotDescription().
 */

const TERMS_LINE = '\n\nBy using UpiSense you agree to our Terms of Service and Privacy Policy: https://upisense.app/terms';

function getHelpMessage(includeTermsForNewUser = false) {
  const base =
    `*UpiSense* – What you can do:\n\n` +
    `📥 Forward UPI/bank msgs or send a *receipt photo* → we record it\n` +
    `💰 _budget Food 15000_ – monthly limit + alerts\n` +
    `📊 _report_ or _summary_ – spending by category\n` +
    `📋 _Samkit owes me 500_ / _I owe Raj 300_ – track who owes you & who you owe\n` +
    `📋 _who owes me_ · _who I owe_ – see your IOU lists\n` +
    `💬 _request 500 from 91XXX_ – we remind them\n` +
    `🔄 After a txn we may ask *recurring?* or *split GroupName?*\n\n` +
    `_help_ or _menu_ – show this again`;
  return includeTermsForNewUser ? base + TERMS_LINE : base;
}

/**
 * Short one-line description (for Meta Business "About" / profile – set in Meta Business Suite)
 */
function getBotDescription() {
  return 'Track UPI spending, set budgets, and get spending reports – all on WhatsApp.';
}

module.exports = { getHelpMessage, getBotDescription };

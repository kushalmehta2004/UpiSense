/**
 * Single source of truth for bot description / help / menu
 * Shown on "help", "menu", "commands", "start", "hi", "hello" and when a new user is created.
 * For the WhatsApp Business profile "About" text, set it in Meta Business Suite using getBotDescription().
 */

function getHelpMessage() {
  return (
    `*UpiSense* – Track spending & split bills on WhatsApp.\n\n` +

    `*📥 Track spending*\n` +
    `Forward any UPI/bank transaction message here. We'll categorize and record it. You can also send a *receipt or screenshot* and we'll read the amount.\n\n` +

    `*💰 Budget*\n` +
    `_budget Food 15000_ – Set monthly limit. We'll alert you at 80% and when over.\n\n` +

    `*📊 Reports*\n` +
    `_report_ or _summary_ – This month's spending by category.\n` +
    `_report jan_ – January. _report 2024_ – Full year.\n\n` +

    `*👥 Groups & splits*\n` +
    `_create group Apartment_ – Create a group\n` +
    `_add 919876543210 to Apartment_ – Add member\n` +
    `_groups_ – List your groups\n` +
    `_expense 500 dinner in Apartment_ – Add expense (split equally)\n` +
    `_balance Apartment_ – See who owes whom\n` +
    `_settle 500 with Raj in Apartment_ – Record a payment\n\n` +

    `*🔄 After a transaction*\n` +
    `We may ask: *Mark as recurring?* Reply _yes_ to save.\n` +
    `We'll suggest: _split GroupName_ – Reply e.g. _split Apartment_ to add that transaction to a group.\n\n` +

    `*👨‍👩‍👧 Family view*\n` +
    `_add to family 919876543210_ – Link another UpiSense user\n` +
    `_family summary_ – Combined spending this month\n\n` +

    `*💬 Request money*\n` +
    `_request 500 from 919876543210_ – We'll remind them (or give you a message to forward).\n\n` +

    `*❓ This menu*\n` +
    `_help_ or _menu_ – Show this again.`
  );
}

/**
 * Short one-line description (for Meta Business "About" / profile – set in Meta Business Suite)
 */
function getBotDescription() {
  return 'Track UPI spending, set budgets, split bills with friends, and get spending reports – all on WhatsApp.';
}

module.exports = { getHelpMessage, getBotDescription };

# UpiSense – Feature Ideas for Future Development

Ideas to make UpiSense more useful. Use this as a reference when planning new releases.  
**Features are ordered by tier and priority** — Tier 1 first, then within each tier by impact and usage.

**Spotlight:** UpiSense is **WhatsApp-first** (transaction tracking via WhatsApp). Each feature is marked for WhatsApp feasibility:
- **✅ WhatsApp-native** – Fully implementable via WhatsApp (messages, buttons, lists, media, quick replies).
- **⚠️ WhatsApp + link** – Core in WhatsApp; some steps (e.g. download file, complex view) via web link.
- **❌ Other channel** – Needs a separate app, PWA, or is not applicable to WhatsApp.

---

## Feature feasibility at a glance

| Feasibility | Count | Notes |
|-------------|--------|--------|
| ✅ WhatsApp-native | Most | Alerts, summaries, add/settle expense, receipts, reminders, lists (short), buttons |
| ⚠️ WhatsApp + link | Few | Export CSV/PDF (send file or link), long lists/dashboard (link to web), bank import (send file) |
| ❌ Other channel | Few | Dark mode (app theme), PWA, Telegram, offline add, API (backend) |

**Short answer:** Almost all listed features can be implemented with WhatsApp as the main surface. The only ones that are **not** WhatsApp are: **Dark mode** (app theme), **Mobile PWA** and **Offline mode** (separate web/app), **Telegram bot** (different app), **Offline add** (needs app for true offline), and **API access** (for developers, not end users in chat). Everything else works via messages, buttons, lists, media, or an optional web link for heavy views/downloads.

---

## Tier 1 – Must Have (Core Value, High Usage)

*Highest priority. Build these first for maximum impact and user retention. All are WhatsApp-viable.*

1. **Export to CSV/Excel** – ⚠️ Send file in chat or link to download. WhatsApp supports document send.
2. **Monthly budget per category** – ✅ Set via chat ("Budget Food 15000"); alerts as messages.
3. **Monthly/yearly reports** – ✅ Summary as WhatsApp message (or optional PDF attachment).
4. **Expense groups** – ✅ Create via chat; add members by number or shareable link.
5. **Add expense (equal split)** – ✅ "Add expense 900, 3 people" or reply to transaction with split.
6. **Balance summary** – ✅ Message: "You owe ₹1,200 (Raj ₹800, Priya ₹400). You're owed ₹500."
7. **Settle up** – ✅ "Settle up with Raj 500" or quick-reply buttons.
8. **Receipt/screenshot parsing** – ✅ User sends image; bot parses amount, merchant, date.
9. **Family/shared wallet** – ✅ Combined view as summary message (or link for detailed view).
10. **Request money** – ✅ Bot sends reminder to friend or "Forward this to Rajesh" message.
11. **Recurring detection** – ✅ Backend logic; suggest in next message ("Mark as recurring?").
12. **"Split this transaction"** – ✅ Reply to tracked transaction: "Split 3 ways" / "Split with group X".

---

## Tier 2 – Should Have (Strong Value)

*High value features. Build after Tier 1 is solid.*

### Splitwise Core

- **Spending insights** – ✅ Message: "You spent 23% more on Food this month than last month"
- **Simplify debts** – ✅ Backend algorithm; show simplified balances in message
- **Quick replies** – ✅ WhatsApp list/button replies (reply without opening another app)
- **Activity feed** – ✅ Recent activity as message (last 5–10 items); "More" can link to web if needed
- **Expense list & filters** – ⚠️ Short list in chat ("List expenses Jan"); heavy filters easier via link
- **Invite members** – ✅ "Add 9876543210" or share invite link in chat
- **Edit/delete expenses** – ✅ "Edit expense #5" / "Delete expense #5" or button
- **Expense added notification** – ✅ WhatsApp message when someone adds expense you're in
- **Split types** – ✅ "Add 2000, split: Raj 1000, Priya 500, Me 500" or interactive list
- **Custom shares** – ✅ Same as above via message or buttons
- **Select participants** – ✅ Choose from list (buttons or numbered list)
- **Expense categories** – ✅ Pick from list/buttons when adding expense
- **Receipt attachment** – ✅ Send image in chat with expense
- **Backdate expenses** – ✅ "Add expense 500, date 15 Jan"
- **Comments on expenses** – ✅ Reply to expense message with comment
- **Recurring group expenses** – ✅ "Add recurring rent 15000, monthly" via chat
- **Partial settle-up** – ✅ "Settle 200 of 500 with Raj"
- **Settle-up history** – ✅ Summary message or "Last 5 settle-ups" in chat
- **"All settled up"** – ✅ Message: "You're all settled up in Apartment!"
- **Reminder to pay** – ✅ Bot sends reminder message (configurable)
- **Settle-up reminder** – ✅ "You have 3 groups with unsettled balances"
- **Due date reminders** – ✅ "Rent due in 3 days" message
- **Weekly balance digest** – ✅ Weekly summary message
- **Group statistics** – ✅ Message with totals by person/category
- **Your total contribution** – ✅ "You paid ₹X, you're owed ₹Y" in group summary
- **Dashboard overview** – ⚠️ Summary message for totals; full dashboard via link if needed
- **"You paid for 3 people"** – ✅ Prompt in chat after transaction: "Split ₹900 among 3?"
- **Suggested splits** – ✅ "Split with Apartment group?" with Yes/No
- **Debt simplification toggle** – ✅ "Show simplified" / "Show detailed" in message or button
- **Export group report** – ⚠️ Send CSV/PDF in chat or link to download

### Budgeting & Insights

- **Weekly budget snapshot** – ✅ "You've used 60% of your Food budget this week"
- **Split bills** – ✅ "Paid for 3 people" → track per-person share in chat
- **Shared categories** – ✅ Family members reply to categorize; system learns
- **Trend alerts** – ✅ "Your transport spend has doubled over the last 3 weeks"
- **Category goals** – ✅ Set via chat; progress in message
- **Low-balance reminders** – ✅ Alert message when patterns suggest low funds

---

## Tier 3 – Nice to Have

*Good to have once core experience is strong. Moderate usage or effort.*

### Platform & UX

- **Bank statement import** – ✅ User sends CSV file in WhatsApp; bot processes (or ⚠️ link to upload)
- **Dark mode** – ❌ App theme; N/A for WhatsApp (client controls theme)
- **Voice notes** – ✅ User sends voice note; bot transcribes and parses transaction
- **Mobile PWA** – ❌ Separate channel (web app), not WhatsApp
- **Offline mode** – ❌ WhatsApp requires connection; "offline" would need PWA/app
- **Telegram bot** – ❌ Different platform; same flow but not WhatsApp

### Analytics & Categorization

- **Goal-based savings** – ✅ Progress in message; set via chat
- **Auto-tags** – ✅ Suggest in message; user confirms with reply/button
- **Location-aware** – ✅ Backend uses location if shared; improve category in next message
- **Time-based rules** – ✅ Set via chat ("Weekend Food = Entertainment")
- **Split transactions** – ✅ "Split this payment: Groceries 800, Personal 200"

### Integrations

- **Calendar sync** – ⚠️ Needs calendar integration; could send "Upcoming: Trip next week" based on data
- **Tax helper** – ✅ Tag via chat; report as message or file attachment

### Engagement

- **Streaks** – ✅ "7 days of logging!" message
- **Weekly digest** – ✅ "Your week in numbers" summary message
- **Achievements/badges** – ✅ "You hit: First ₹1L tracked" message
- **Personalized tips** – ✅ "You tend to overspend on weekends" message

### Security & Trust

- **Account backup** – ⚠️ Send export file in chat or link to download
- **Data deletion** – ✅ "Delete my account" → confirm via reply/button
- **Activity log** – ✅ Summary message (last login, recent exports)
- **2FA for sensitive actions** – ✅ OTP or confirm in chat before export/delete

### Currency & Travel

- **Multi-currency support** – ✅ Amounts in message with currency; store in backend
- **Currency conversion** – ✅ Show converted amount in message (rate in backend)
- **Per-group currency** – ✅ Set "Group currency: USD" when creating/editing group

### Group Management

- **Leave/archive group** – ✅ "Leave group Apartment" / "Archive group Trip"

---

## Tier 4 – Later / Niche

*Edge cases, polish, or monetization. Build when scaling or diversifying.*

### Group Edge Cases

- **Member roles** – ✅ "Make Raj admin" / list admins in chat
- **Hidden groups** – ✅ Backend; "Hide Apartment from summary" (show in full list via command)
- **Expense disputes** – ✅ "Flag expense #5" or reply with "Dispute: amount wrong"
- **Default split** – ✅ Backend; no WhatsApp change
- **Offline add** – ❌ Requires connection; only viable with PWA/app for true offline
- **Emoji reactions** – ✅ User reacts to message; bot can treat 👍 as "Confirmed" (optional)

### Monetization-Ready

- **Premium insights** – ✅ Deeper summary messages for paid users
- **Unlimited categories** – ✅ Backend limit; pay via link, then unlock in chat
- **Priority support** – ✅ WhatsApp support channel (native fit)
- **API access** – ❌ Backend/developer-facing; not a WhatsApp user feature

---

## Suggested Build Order (Phases)

**Phase 1 – Core + Splitwise MVP**  
Export to CSV → Budget limits + alerts → Monthly summary → Groups + add expense (equal) → Balance summary → Settle up → "Split this transaction"

**Phase 2 – Polish + Stickiness**  
Request money → Receipt parsing → Family view → Simplify debts → Invite members → Edit/delete → Split types

**Phase 3 – Analytics + Retention**  
Spending insights → Quick replies → Activity feed → Recurring detection → Reminder to pay

**Phase 4 – Scale + Trust**  
Multi-currency, bank import, dark mode, 2FA, backup, monetization features

---

*Last updated: February 2026*

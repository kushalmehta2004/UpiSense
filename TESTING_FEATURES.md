# UpiSense – Steps to Test Each Feature

Use this checklist to verify every WhatsApp feature. Test with the bot’s WhatsApp number (the one connected to your webhook).

---

## Prerequisites

- **Bot number:** Your UpiSense WhatsApp Business number (with webhook configured).
- **Your number:** A phone that will message the bot (you’ll be created as a user on first message).
- **Optional – second number:** For “add member”, “request money”, and “family” (both numbers must message the bot once to be “UpiSense users”).
- **Optional – sample UPI text:** e.g.  
  `You have paid Rs.500.00 to Amazon Pay. UPI Ref: 123456789.`
- **Optional – receipt image:** A clear photo/screenshot of a bill or UPI success screen showing amount (and ideally merchant/date).

---

## 1. Help / menu

**Goal:** User can open the full list of commands anytime.

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Send `help` | Bot replies with full menu (track spending, budget, report, groups, expense, balance, settle, family, request money, recurring/split, and “help again”). |
| 1.2 | Send `menu` | Same menu as above. |
| 1.3 | Send `commands` or `start` or `hi` | Same menu. |

---

## 2. Track spending (forward UPI message)

**Goal:** Forwarded UPI/bank messages are parsed, categorized, and saved.

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Forward a real UPI/bank transaction message to the bot (or paste a sample like “You have paid Rs.500.00 to Amazon Pay…”). | Bot replies: “Recorded: ₹X to **Merchant** (Category)”. |
| 2.2 | If amount/merchant are unclear, send a message that doesn’t look like a transaction. | Bot may say parsing failed or not respond as transaction. |
| 2.3 | (Optional) Forward a P2P payment (e.g. to a person’s UPI ID). | Bot may ask “What was this for?” with options 1–6. Reply with a number (e.g. `1`). | Bot says “Saved as **Category**”. |

---

## 3. Budget (set limit + alert)

**Goal:** Set a monthly budget per category and get an alert when approaching or exceeding it.

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Send `budget Food 15000` (or `set budget Food 15000`). | “Budget set: **Food & Dining** ₹15,000/month. We'll alert you when you approach or exceed it.” |
| 3.2 | Send `budget Groceries 20000`. | Same style of confirmation for Groceries. |
| 3.3 | Add transactions in that category (forward UPI messages or add via receipt) until total for the month is ≥ 80% of the limit. | After one of the transactions, bot sends a budget alert (e.g. “You've used 80% of your **Food** budget…”). |
| 3.4 | Add more so total exceeds the limit. | Bot sends an over-limit alert (e.g. “Your **Food** budget… You've spent ₹X (over limit).”). |

Use `report` or `summary` to confirm category totals if needed.

---

## 4. Reports (monthly / yearly)

**Goal:** Get spending by category for a period.

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Send `report` or `summary`. | Bot sends “Spending report – [Month] [Year]” with category-wise amounts and total. |
| 4.2 | Send `monthly report`. | Same as 4.1 for current month. |
| 4.3 | Send `report jan` (or another month name). | Report for that month in the current year. |
| 4.4 | Send `report 2024` (or another year). | Report for the full year. |
| 4.5 | Send `report` before any transactions. | Report with zero or only “Other” / empty categories. |

---

## 5. Expense groups (create, add, list)

**Goal:** Create groups, add members by number, list groups.

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Send `create group Apartment`. | “Group **Apartment** created. Add members: _add 9876543210 to Apartment_”. |
| 5.2 | Send `create group Trip to Goa` or `new group Office`. | Same style of confirmation. |
| 5.3 | Send `add 919876543210 to Apartment` (use a real number; for full test, that number should message the bot once so they exist as a user). | “Added 919876543210 to **Apartment**.” |
| 5.4 | Send `groups`. | “Your groups” with a list (e.g. “• Apartment”, “• Trip to Goa”) and hint to add expense. |

---

## 6. Add expense, balance, settle up

**Goal:** Add an expense (equal split), see balances, record a settle-up.

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Send `expense 500 dinner in Apartment`. | “Added expense: ₹500 – dinner in **Apartment** (split equally).” |
| 6.2 | Send `expense 900 in Apartment` (no description). | Added with a default description. |
| 6.3 | Send `balance Apartment` or `balance in Apartment`. | “**Apartment** – Your balance” with “You owe” and/or “You’re owed” (or “You’re all settled up!”). |
| 6.4 | Send `settle 500 to 919876543210 in Apartment` (or `settle up 500 with Raj in Apartment` if a member’s name/number matches). | “Recorded: You paid ₹500. Reply _balance Apartment_ to see updated balance.” |
| 6.5 | Send `balance Apartment` again. | Balances updated (less owed / more settled). |

---

## 7. Receipt / screenshot parsing

**Goal:** Send an image of a receipt or UPI screenshot; bot extracts amount (and optionally merchant/date) and records a transaction.

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Send only an image (no text): photo of a bill or UPI success screen showing amount. | Bot replies “Recorded from receipt: ₹X to **Merchant** (Category)”. |
| 7.2 | Send a blurry or non-receipt image. | Bot may say it couldn’t read the amount or to send a clearer receipt. |

Requires `GEMINI_API_KEY` and a vision-capable model (e.g. `gemini-2.0-flash`). If not configured, receipt parsing may fail.

---

## 8. Family / shared wallet

**Goal:** Link another UpiSense user and see combined spending.

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | From another number, send any message to the bot (e.g. `hi`) so they become a user. Note that number. | They get the menu (if new user). |
| 8.2 | From your number, send `add to family 91XXXXXXXXXX` (that other number). | “Added to family. Use _family summary_ to see combined spending.” |
| 8.3 | Send `add 919876543210 to family` (alternative format). | Same as 8.2. |
| 8.4 | Send `family summary`. | “Family shared spending – [Month] [Year]” with category-wise totals and total (your + linked users’ transactions this month). |
| 8.5 | Add a number that has never messaged the bot. | “No UpiSense user with that number. They need to message the bot first.” |

---

## 9. Request money

**Goal:** Send a reminder to someone who owes you (or get a message to forward).

| Step | Action | Expected |
|------|--------|----------|
| 9.1 | Send `request 500 from 919876543210` (use a number that has already messaged the bot). | “Reminder sent to [name/number].” That contact gets: “UpiSense: [You] is reminding you: You owe them ₹500.” |
| 9.2 | Send `remind 919876543210 about 500`. | Same as 9.1. |
| 9.3 | Send `request 500 from 919999999999` (number not on UpiSense). | “They’re not on UpiSense yet. Forward this to them: _You owe me ₹500._” |

---

## 10. Recurring detection

**Goal:** After a similar transaction (same merchant, similar amount) in the last 30 days, bot suggests marking as recurring; user confirms with `yes`.

| Step | Action | Expected |
|------|--------|----------|
| 10.1 | Forward (or receipt) a transaction, e.g. ₹499 to “Netflix”. | Bot records it and may send “Looks like a recurring payment. Reply *yes* to mark as recurring.” |
| 10.2 | Forward another similar message (same merchant, same or similar amount) within 30 days. | Again bot records and may suggest recurring. |
| 10.3 | Reply `yes` (or `y`). | “Marked as recurring. We'll use this for future insights.” |

Suggestion only appears if there’s already a similar transaction in the last 30 days.

---

## 11. Split this transaction

**Goal:** After recording a transaction, add it as an expense to a group by replying `split GroupName`.

| Step | Action | Expected |
|------|--------|----------|
| 11.1 | Create a group and add at least one member (same steps as in section 5). | Group exists. |
| 11.2 | Forward a UPI transaction (e.g. ₹900 paid to a restaurant). | Bot records it and sends “Split this? Reply _split GroupName_ to add to a group (e.g. _split Apartment_).” |
| 11.3 | Reply `split Apartment` (or your group name). | “Split ₹900 in **Apartment** (…).” |
| 11.4 | Send `balance Apartment`. | That ₹900 is reflected in the group balance (split equally among members). |
| 11.5 | Reply `split UnknownGroup`. | “Group ‘UnknownGroup’ not found. Reply _groups_ to see your groups.” |

---

## 12. New user welcome

**Goal:** First-time users get the help menu automatically.

| Step | Action | Expected |
|------|--------|----------|
| 12.1 | Use a number that has never messaged the bot. Send a UPI transaction (forward or paste). | Bot creates the user, sends the full help/menu message, then (after processing) “Recorded: …”. |
| 12.2 | From another new number, send only a receipt image. | Same: user created, help message sent, then “Recorded from receipt: …”. |

---

## Quick reference – all commands

| Feature        | Example command / action |
|----------------|--------------------------|
| Menu           | `help`, `menu`, `commands`, `start`, `hi` |
| Budget         | `budget Food 15000` |
| Report         | `report`, `summary`, `report jan`, `report 2024` |
| Create group   | `create group Apartment` |
| Add member     | `add 919876543210 to Apartment` |
| List groups    | `groups` |
| Add expense    | `expense 500 dinner in Apartment` |
| Balance        | `balance Apartment` |
| Settle up      | `settle 500 with Raj in Apartment` |
| Family         | `add to family 919876543210`, `family summary` |
| Request money  | `request 500 from 919876543210` |
| Recurring      | Reply `yes` when bot suggests it. |
| Split txn      | Reply `split Apartment` after a recorded transaction. |
| Track spending | Forward UPI message or send receipt image. |

---

## Troubleshooting

- **No reply:** Check webhook URL and Vercel logs; ensure env vars (`SUPABASE_*`, `META_*`, `GEMINI_API_KEY` for receipt) are set.
- **“Group not found”:** Use the exact group name (case-insensitive) and ensure you’re a member (`groups`).
- **Balance shows nothing:** Add at least one expense in that group; members must have `user_id` (they must have messaged the bot).
- **Receipt not parsed:** Ensure image is clear and has amount; check `GEMINI_API_KEY` and model supports vision.
- **Budget alert not sent:** Confirm you have a budget set for that category and that transactions are categorized in that category (check with `report`).

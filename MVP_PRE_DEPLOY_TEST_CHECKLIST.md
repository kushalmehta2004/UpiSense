# UpiSense MVP – Pre‑deploy edge case checklist

Use this list to test critical and edge cases before going live. Check off each item; note any failures for fix or known limitation.

---

## 1. Transaction recording (WhatsApp)

### 1.1 Amount only → “Who did you pay?” + reply
- [ ] Send **500** → bot asks “Who did you pay ₹500 to?”
- [ ] Reply **Rachit** → recorded as **₹500 to Rachit** (not ₹null). Category may be asked (P2P) or assigned.
- [ ] Send **1000** → ask; reply **Swiggy** → recorded as **₹1000 to Swiggy** with a sensible category (e.g. Food & Dining if inferred).
- [ ] Amount with commas: **1,500** → ask; reply **Rohan** → **₹1,500 to Rohan**.
- [ ] Decimal: **99.50** → ask; reply **Cafe** → **₹99.50** stored correctly.

### 1.2 Amount + merchant in one message
- [ ] **500 to rachit** → P2P clarification (1–6) or direct category; confirmation shows **label** (e.g. “Saved as *Friend Payment*”), not internal category (“Gifts & Donations”).
- [ ] **100 to matthew** → choose option **1** (Friend Payment) → message says “Saved as *Friend Payment*”.
- [ ] **200 to restaurant** or **200 to cafe** → recorded as Food & Dining, no P2P ask.
- [ ] **300 to uber** / **ola** → Transport.
- [ ] **100 to john** → clarification; choose **6** (Other) → bot asks for note; reply **concert ticket** → saved as Other with note.

### 1.3 Forwarded UPI / bank-style text
- [ ] Forward a typical “Paid ₹X to Y” message → amount and merchant parsed and recorded (or “who did you pay?” if merchant unknown).
- [ ] Message with only amount (no recipient) → “Who did you pay?” and pending amount saved for next reply.

### 1.4 Receipt image
- [ ] Send a **receipt photo** (amount visible) → recorded from image; amount and merchant correct.
- [ ] New user sends receipt → user created, transaction saved, help sent.
- [ ] Unreadable / no amount in image → clear error (“Could not read amount…” or similar), no crash.

### 1.5 Amount edge cases
- [ ] **0** or **00** → no transaction or clear handling (no “₹0 to…”).
- [ ] **999999999** (very large) → stored without overflow/error (DB allows DECIMAL).
- [ ] **1.999** → stored (or rounded per your rules); no crash.
- [ ] Message that looks like amount but is a command (e.g. **report**) → treated as command, not transaction.

---

## 2. Pending “Who did you pay?” edge cases

- [ ] Reply to “Who did you pay?” with **empty message** or only spaces → no transaction with null/empty merchant; pending can stay or be cleared (document behavior).
- [ ] Reply with a **single word that is also a command** (e.g. **help**, **report**) → decide: either create “₹X to help” or skip and run command. Current behavior: creates “₹X to help”. Note or change if desired.
- [ ] Ask “Who did you pay?” then **two quick replies** (e.g. “Rahul” then “Rohan”) → first reply consumes pending and creates one txn; second is a new message (no pending) so may be parsed as new txn or command. No duplicate for same amount.
- [ ] **Very long recipient name** (e.g. 200+ chars) → truncate or reject gracefully (merchant_name VARCHAR 255).
- [ ] **Recipient name with special characters** (quotes, emoji, newline) → stored without breaking DB or reply.

---

## 3. P2P clarification flow

- [ ] Reply **1** → category “Gifts & Donations” stored; user sees “Saved as *Friend Payment*”.
- [ ] Reply **2**–**5** → correct category stored; message shows **label** (e.g. Family Transfer, Home Repair), not internal category only.
- [ ] Reply **6** (Other) → bot asks for note; send note → saved as Other with note; “Future payments… use Other.”
- [ ] Reply **7** or **0** or **abc** → not treated as clarification; no crash; no overwrite of transaction.
- [ ] Reply **1** (or any 1–5) → pending_clarifications cleared; “who owes me” / next transaction doesn’t reuse old pending.

---

## 4. Debt (IOU) commands

- [ ] **Samkit owes me 500** → “Recorded: *Samkit* owes you ₹500”; entry in “who owes me” list.
- [ ] **I owe Raj 300** → “Recorded: You owe *Raj* ₹300”; entry in “who I owe” list.
- [ ] **who owes me** → list of people who owe you (or “No one owes you…”).
- [ ] **who owes me?** (with punctuation) → same as above (parsing strips trailing `?`).
- [ ] **who I owe** → list of people you owe.
- [ ] **who I owe?** → same.
- [ ] Multiple **X owes me 100** for same X → list shows **X: ₹200** (or correct sum).
- [ ] **who owes me** / **who I owe** with no entries → friendly empty message.

---

## 5. Other WhatsApp commands

- [ ] **help**, **menu**, **commands**, **start**, **hi**, **hello** → same help message.
- [ ] **budget Food 15000** → “Budget set: *Food & Dining* ₹15,000/month…”
- [ ] **set budget Transport 5000** → accepted if your parser supports it.
- [ ] **report** or **summary** → spending by category (or “No spending…”).
- [ ] **monthly report** → same or monthly variant.
- [ ] **request 500 from 91XXXXXXXXXX** → reminder sent (or “not on UpiSense” message).  
- [ ] **remind &lt;name&gt; about 500** → reminder flow if implemented.

---

## 6. Recurring and split (when applicable)

- [ ] After a transaction, bot suggests **recurring?** → reply **yes** or **y** → “Marked as recurring…”
- [ ] Reply **no** or other text → no recurring; no crash.
- [ ] **split Apartment** (or **split in Apartment**) with **no** pending split → handled gracefully (e.g. “Transaction not found” or no-op).
- [ ] **split &lt;GroupName&gt;** with pending split and valid group → “Split ₹X in *GroupName*”.

---

## 7. Category correction (pending_category_confirmation)

- [ ] When bot asks “tell us the right category”, reply **yes** / **y** → “Got it! Category confirmed.”
- [ ] Reply with category name (e.g. **Transport**) → “Saved as *Transport*…”
- [ ] Reply with invalid category name → no crash; pending cleared or retry.

---

## 8. Groups and family (when disabled)

- [ ] With **ENABLE_GROUPS=false**: **create group Trip**, **add 91XXX to X**, **groups**, **expense 500 dinner in X**, **balance in X**, **settle 500 to Y** → “Groups are temporarily unavailable…”
- [ ] With **ENABLE_FAMILY=false**: **add 91XXX to family**, **family summary** → “Family feature is temporarily unavailable…”

---

## 9. New user and first message

- [ ] **New number** sends **500** → user created; “Who did you pay ₹500 to?” (and pending_recipient_ask saved).
- [ ] New user sends **help** → user created; help message received.
- [ ] New user sends **receipt image** → user created; transaction from receipt + help.

---

## 10. Web / API (if part of MVP)

- [ ] **Login** (OTP or phone) → success; session or token stored.
- [ ] **Transactions list** → pagination, filters (category, date range, search) work.
- [ ] **Dashboard** → totals/charts load; no console errors.
- [ ] **Debts page** → “Owed to me” and “I owe” match WhatsApp debt commands.
- [ ] **Settings** → optional; no broken links or 500s.
- [ ] **Logout** → redirects to login; protected routes require auth.

---

## 11. Error and failure handling

- [ ] **Receipt image** that is not a receipt (e.g. random photo) → “Could not read amount…” or similar; no 500.
- [ ] **LLM/agent timeout or down** → fallback to regex/legacy parse or clear “Try again” message; no uncaught exception.
- [ ] **Supabase down or 5xx** → error logged; user sees generic “Could not save” or “Something went wrong” where appropriate.
- [ ] **WhatsApp API send failure** → logged; no silent drop of critical reply (e.g. “Who did you pay?” still sent if possible, or retry/backoff if you have it).

---

## 12. Data and configuration

- [ ] All **migrations** applied in order: `pending_recipient_ask`, `debt_entries`, `pending_clarifications`, `pending_category_confirmation`, notes, recurring, split, etc.
- [ ] **Categories** seeded (Food & Dining, Transport, …); P2P options match `P2P_CLARIFICATION_OPTIONS`.
- [ ] **Env**: `SUPABASE_URL`, `SUPABASE_KEY`, `META_VERIFY_TOKEN`, `GEMINI_API_KEY` (if using agent), WhatsApp token/phone ID set for production.
- [ ] **parse_method** values ≤ 20 chars (e.g. `pending_recipient` not `pending_recipient_reply`) to avoid “value too long for type character varying(20)”.

---

## 13. Security and sanity

- [ ] **Very long message** (e.g. 10,000 chars) → truncated or rejected without crashing or storing oversized values in VARCHAR fields.
- [ ] **SQL injection**: all user input via parameterized Supabase client (no raw concatenation). Quick audit of `supabase.from(...).insert/update` with user text.
- [ ] **Rate limiting**: if you have any (per user / per phone), verify it doesn’t block normal use; document limits.

---

## 14. Regression (recent fixes)

- [ ] **Amount preserved** when replying to “Who did you pay?” (no ₹null).
- [ ] **P2P option 1** shows “Friend Payment” in message, not “Gifts & Donations”.
- [ ] **parse_method** length fits VARCHAR(20) for all code paths (e.g. pending_recipient).

---

## Quick smoke (minimum before deploy)

1. **500** → “Who did you pay?” → **Rahul** → “✔ Recorded: ₹500 to Rahul (…)”.
2. **100 to matthew** → choose **1** → “Saved as *Friend Payment*”.
3. **who owes me** and **who I owe** → lists or empty message.
4. **help** → help text.
5. **report** → summary or “No spending…”.
6. Login on web → dashboard and debts load.

---

*Generated for UpiSense MVP. Adjust checkboxes and add rows as you add features or find new edge cases.*

# Meta WhatsApp Cloud API — Go-Live Guide (UpiSense)

This document walks you from **test number + Development mode** (only allowed testers) to **onboarding real users** on **upisense.app**. Screens and exact labels in Meta’s UI change; use this as a checklist and always confirm against [Meta for Developers — WhatsApp](https://developers.facebook.com/docs/whatsapp).

**Last updated:** April 2026 (review Meta docs periodically).

---

## Part A — Why you are stuck today

| Situation | Effect |
|-----------|--------|
| **Test phone number** (e.g. `+1 555…`) | Fine for API learning; not your long-term **customer-facing** business line. Meta may show **90-day** style test messaging allowances. |
| **App in Development mode** | Only **roles** on the app (admin/developer/tester) and/or **allowed test phone numbers** can fully use some flows. **Random users cannot** use the product like production customers. |
| **Webhook / env mismatch** | Your backend must use the correct **Phone number ID**, **token**, and **HTTPS webhook** for the number users actually message. |

**To onboard anyone:** you need the app **Live** (where required), a **real registered WhatsApp Business number** on your WABA, and production **tokens + webhook** pointing at your deployed backend.

---

## Part B — What you should have already

- [ ] **Website** on `https://upisense.app` (or `www` — pick one canonical URL).
- [ ] **Backend** deployed (e.g. Vercel) with HTTPS URL, e.g. `https://api.upisense.app` or `https://<project>.vercel.app`.
- [ ] **Webhook** path working: `GET` and `POST` `https://<backend>/webhook/whatsapp`.
- [ ] **Meta Business Account** and a **WhatsApp Business Account (WABA)** created and linked to your developer app.
- [ ] **Privacy Policy** and **Terms** URLs live (Meta may ask during review).

---

## Part C — Big picture: order of operations

1. **Business identity** — Meta Business Manager, business details (and **business verification** if Meta asks).
2. **Phone number** — Add a **real** number to the WABA (not only the Meta test line) and verify it with OTP/voice.
3. **Developer app** — Switch to **Live** when Meta allows; complete **App Review** for any permissions that require it.
4. **Credentials** — Long-lived **System User** access token (or Meta’s documented production token flow) with WhatsApp permissions.
5. **Webhook** — Callback URL + verify token; subscribe to **messages**.
6. **Your deployment** — Set `META_PHONE_ID`, `META_ACCESS_TOKEN`, `META_VERIFY_TOKEN`, `META_BUSINESS_ACCOUNT_ID`, `CORS_ORIGIN=https://upisense.app` on Vercel; redeploy.
7. **Product** — Point “Message UpiSense on WhatsApp” to the **E.164** business number (digits only in `wa.me` links).
8. **Test** — Real device → message business number → webhook logs → reply.

---

## Part D — Step-by-step: Meta Business & WABA

### D1. Meta Business Manager

1. Go to [business.facebook.com](https://business.facebook.com).
2. Use or create a **Business Portfolio** / **Business** for UpiSense.
3. Add yourself as **Admin** so you can manage WhatsApp assets.

### D2. WhatsApp Business Account (WABA)

1. In **Meta Business Suite** or **Business Settings**, find **WhatsApp Accounts** (or add **WhatsApp** product).
2. Ensure your **WABA** is linked to the **same** Meta app you use in [developers.facebook.com](https://developers.facebook.com) under **WhatsApp → API Setup** (you already have a **WhatsApp Business Account ID** there).

### D3. Business verification (often required for scaling / Live)

Meta may require **business verification** before full production use or certain features.

1. **Business Settings** → **Security Center** or **Business verification** (wording varies).
2. Submit **legal business name**, **address**, **phone**, and **documents** (e.g. registration, GST, utility bill — whatever Meta requests for your region).
3. Wait for approval (can take **days**).

If verification fails, read Meta’s feedback and resubmit. You cannot skip this if the platform blocks Live until verified.

---

## Part E — Getting a real phone number (not the test line)

### E1. What kind of number

- Use a **phone number that can receive SMS or voice OTP** for verification.
- **Cannot** be the same as a number already on **regular WhatsApp** consumer app for that account — Meta usually requires a **fresh** line or migrating per their rules.
- For India: a **new SIM** or an unused number is typical.

### E2. Where to add it in Meta

1. [developers.facebook.com](https://developers.facebook.com) → **Your app** → **WhatsApp** → **API Setup** (or **Getting started**).
2. Find **Phone numbers** → **Add phone number** / **Manage phone numbers**.
3. Enter the number, complete **OTP** or **voice** verification.
4. After success, open the number’s details and copy:
   - **Phone number ID** (this is what you put in `META_PHONE_ID` for **this** number).
   - Confirm **WhatsApp Business Account ID** (often unchanged if same WABA).

### E3. Test number vs production number

| Item | Test number (`+1 555…`) | Your own registered number |
|------|-------------------------|----------------------------|
| Purpose | Learning, free test tier | **Customer-facing** bot |
| Long-term | Not a substitute for a real brand line | **Use for `wa.me` and marketing** |
| Phone number ID | Old ID | **New ID** — update Vercel env |

---

## Part F — Developer app: Development → Live & App Review

### F1. Development mode limits

In **Development**, Meta restricts who can use the integration (e.g. developers/testers and sometimes a **recipient list**). **Strangers cannot onboard** as if it were production.

### F2. Switch app to Live

1. [developers.facebook.com](https://developers.facebook.com) → **Your app** → **App mode** (top bar): switch to **Live** when available.
2. Complete any **required** steps Meta shows (privacy policy URL, business verification, etc.).

### F3. App Review

1. **App Review** → **Permissions and Features** (or **WhatsApp** product requirements).
2. Request only what you need (e.g. WhatsApp messaging).
3. Provide:
   - **Privacy Policy URL** (`https://upisense.app/privacy` or your canonical URL).
   - **Screencast**: sign up → dashboard → send message to bot → transaction appears.
   - Accurate **data use** description (messages processed, Supabase, Gemini, etc. — match your Privacy Policy).

Approval time varies (**days to weeks**).

---

## Part G — Access tokens (testing vs production)

### G1. Temporary token (testing only)

- **WhatsApp → API Setup** often shows a **Temporary access token** for quick API tests.
- **Expires quickly** — do **not** rely on it for production Vercel env.

### G2. Production token (what Vercel should use)

Meta’s recommended approach for servers is a **System User** in Business Manager with a **long-lived** token and the right **WhatsApp** permissions. Exact clicks change; follow:

- [WhatsApp Cloud API — Get started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Access tokens — System users](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#system-user-access-tokens) (or current equivalent in Meta docs)

**Store in Vercel (backend):** `META_ACCESS_TOKEN`  
**Rules:** Never commit to Git; never expose in frontend; rotate if leaked.

### G3. Token permissions

Ensure the token can:

- Send messages (WhatsApp **sending** scope as per current Meta docs).
- Read webhook payloads (no special “read” token for incoming — webhook is POST from Meta to you).

---

## Part H — Webhook (incoming messages)

### H1. URL

`https://<YOUR_BACKEND_HOST>/webhook/whatsapp`

Examples:

- `https://upisense-backend.vercel.app/webhook/whatsapp`
- `https://api.upisense.app/webhook/whatsapp`

**Requirements:** HTTPS, publicly reachable, returns `hub.challenge` on **GET** verify.

### H2. Verify token

1. Invent a long random secret (e.g. 32+ chars).
2. Same value in:
   - Meta → **WhatsApp** → **Configuration** → **Webhook** → **Verify token**
   - Vercel → `META_VERIFY_TOKEN`

### H3. Subscription

Under webhook settings, subscribe to **messages** (and only other fields you truly use).

### H4. After domain / backend URL changes

Update **Callback URL** in Meta to match production; click **Verify and save** again if needed.

---

## Part I — UpiSense: Vercel environment variables (backend)

Set these for **Production** (and Preview if you test there):

| Variable | What it is | Where to get it |
|----------|------------|-----------------|
| `META_PHONE_ID` | **Phone number ID** of the **production** business number | WhatsApp → API Setup → phone number details |
| `META_BUSINESS_ACCOUNT_ID` | WABA ID | Same screen / WhatsApp settings |
| `META_ACCESS_TOKEN` | Long-lived System User token (or Meta-approved server token) | Business Manager / token tool per Meta docs |
| `META_VERIFY_TOKEN` | Your webhook secret | You create it |
| `CORS_ORIGIN` | `https://upisense.app` (exact origin users use; no trailing slash) | Your domain |
| Plus | `SUPABASE_*`, `JWT_SECRET`, `GEMINI_*`, `SUPABASE_SERVICE_ROLE_KEY`, etc. | Existing deployment docs |

**After any change:** **Redeploy** the backend.

---

## Part J — Frontend (upisense.app)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Full backend base URL **without** trailing slash, e.g. `https://api.upisense.app` |

**Redeploy** frontend after changing.

**WhatsApp deep link:** Use your **production business number** in international format **without +** for `https://wa.me/<countrycode><number>`.

---

## Part K — Testing APIs (Meta / Graph)

### K1. Graph API Explorer (browser)

1. [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
2. Select your **app** and a **User Token** or **Page/System** token as Meta allows.
3. For WhatsApp send tests, use the **HTTP API** documented at [Cloud API reference](https://developers.facebook.com/docs/whatsapp/cloud-api) — endpoint shape:

   `POST /v21.0/{PHONE_NUMBER_ID}/messages`  
   (version `v21.0` may change — use the version Meta shows in docs.)

**Note:** Prefer testing **from a real phone** to the **business number** once webhook is live; that validates the full path.

### K2. What to verify

| Check | Success signal |
|-------|----------------|
| Webhook verify | Meta shows webhook **verified** (green) |
| Inbound message | Vercel function logs show incoming POST |
| Outbound reply | Logs show send success; WhatsApp delivers message |
| Wrong `META_PHONE_ID` | Sends fail with Meta error in response body |

### K3. Common errors (conceptual)

- **401 / OAuth:** Token wrong or expired — regenerate token.
- **131030 / phone not in allowed list:** Often **Development** mode or missing recipient permission — fix **Live** + real number setup.
- **100 / invalid parameter:** `META_PHONE_ID` doesn’t match token’s WABA.

---

## Part L — Pricing & cost (read official sources)

WhatsApp Business Platform pricing is **country-specific** and **changes**. Meta publishes authoritative tables here:

- **[WhatsApp Business Platform pricing](https://developers.facebook.com/docs/whatsapp/pricing)**

Concepts you should understand:

- **Conversation-based or per-message models** — Meta has updated models over time; read the **current** doc.
- **User-initiated “service”** vs **business-initiated** (often template-based) — pricing differs; **session windows** (e.g. 24-hour customer care window) affect what you can send for free vs paid.
- **India** — Rates are listed **per country** in Meta’s pricing materials.
- **Free tier / test lines** — Test numbers may include **limited free test sends**; production traffic uses **production pricing**.

**Budgeting for UpiSense:** Estimate **messages per user per month** (incoming + your replies + optional template broadcasts) and multiply by **current** Meta rates for **India** from the link above. Add **Vercel**, **Supabase**, **Gemini** API costs separately.

---

## Part M — Checklist: first real user onboarding

- [ ] Business verified (if Meta required it).
- [ ] Real phone number **registered** on WABA; **Phone number ID** copied.
- [ ] App **Live**; **App Review** completed for required scopes.
- [ ] Long-lived **`META_ACCESS_TOKEN`** on Vercel.
- [ ] **`META_PHONE_ID`** matches **production** number.
- [ ] Webhook **verified**; **messages** subscribed.
- [ ] **`CORS_ORIGIN`** = `https://upisense.app`
- [ ] **`VITE_API_URL`** points to production backend.
- [ ] Dashboard / marketing use **`wa.me`** with **production** number.
- [ ] Test from a **friend’s phone** not in old “test list” (confirms public onboarding).

---

## Part N — Support links (bookmark)

| Topic | URL |
|-------|-----|
| WhatsApp Cloud API overview | https://developers.facebook.com/docs/whatsapp/cloud-api |
| Get started | https://developers.facebook.com/docs/whatsapp/cloud-api/get-started |
| Pricing | https://developers.facebook.com/docs/whatsapp/pricing |
| Webhooks | https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks |
| Phone numbers | https://developers.facebook.com/docs/whatsapp/cloud-api/phone-numbers |
| App Review | https://developers.facebook.com/docs/app-review |

---

## Part O — UpiSense repo docs (internal)

- `DEPLOYMENT.md` — Vercel env, CORS, domains.
- `backend/META_WEBHOOK_SETUP.md` — Webhook path and verify flow.

---

*This guide is operational documentation, not legal advice. For DPDP, terms, and policies, align with your published Privacy Policy and consult a lawyer if needed.*

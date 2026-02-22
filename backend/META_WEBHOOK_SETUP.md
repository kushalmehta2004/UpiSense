# Meta WhatsApp Webhook – Live Verification & Production Setup

Use this once. No mocks; production-only.

## 1. Deploy backend to Vercel

From the `backend` folder:

```bash
cd backend
vercel
```

Or connect the repo in [Vercel Dashboard](https://vercel.com) and set the **Root Directory** to `backend`.

After deploy, note the URL, e.g. `https://your-project-xxx.vercel.app`.

---

## 2. Set environment variables in Vercel

In **Vercel** → your project → **Settings** → **Environment Variables**, add (for Production and Preview):

| Name | Value | Notes |
|------|--------|--------|
| `SUPABASE_URL` | Your Supabase project URL | |
| `SUPABASE_KEY` | Your Supabase anon key | |
| `JWT_SECRET` | Strong random string | e.g. `openssl rand -hex 32` |
| `META_VERIFY_TOKEN` | A secret you choose | Same value as in Meta (step 3) |
| `META_ACCESS_TOKEN` | WhatsApp API token | From Meta App → WhatsApp → API Setup |
| `META_PHONE_ID` | Phone number ID | From Meta App → WhatsApp → API Setup (often shown as “Phone number ID”) |
| `GEMINI_API_KEY` | Google AI API key | For LLM parsing |
| `GEMINI_MODEL` | (optional) | e.g. `gemini-2.5-flash` |

Redeploy after changing env vars.

---

## 3. Configure webhook in Meta

1. Open [Meta for Developers](https://developers.facebook.com) → your app → **WhatsApp** → **Configuration** (or **API Setup**).
2. Under **Webhook**:
   - Click **Edit** (or **Configure**).
   - **Callback URL**: `https://your-project-xxx.vercel.app/webhook/whatsapp`  
     (replace with your real Vercel URL, no trailing slash).
   - **Verify token**: Create a random string (e.g. `openssl rand -hex 16`) and set the **same** value in:
     - This “Verify token” field in Meta
     - Vercel env var `META_VERIFY_TOKEN`
3. Click **Verify and save**.  
   Meta sends:  
   `GET https://your-project-xxx.vercel.app/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE`  
   Your backend must return the `hub.challenge` value with status 200. If verification succeeds, the button turns green.
4. Subscribe to **messages** (and any other fields you need) and save.

---

## 4. Confirm webhook URL and token

- **Webhook URL** must be exactly:  
  `https://<your-vercel-domain>/webhook/whatsapp`
- **Verify token** in Meta must match **exactly** the value of `META_VERIFY_TOKEN` in Vercel (case-sensitive, no extra spaces).

---

## 5. Add your number as a test recipient (Development mode)

In Meta → your app → **WhatsApp** → **API Setup**, find **"Manage phone number list"** (or **"To"**) and **add the WhatsApp number** you use to message the business (with country code, e.g. `91xxxxxxxxxx`). Only numbers in this list can receive replies in Development mode. If you skip this, the API may succeed but no message is delivered.

## 6. Test live flow

1. Send a message to your WhatsApp Business number (the one linked in the app).
2. In Vercel → **Deployments** → latest deployment → **Functions** → open the log for the webhook.
3. You should see the incoming POST and your app logic running.
4. If the bot is supposed to reply, ensure `META_ACCESS_TOKEN` and `META_PHONE_ID` are set in Vercel (and that the token has “Send messages” permission).

---

## Troubleshooting

- **Verification fails**: Check that callback URL is HTTPS, path is `/webhook/whatsapp`, and `META_VERIFY_TOKEN` matches Meta’s “Verify token”.
- **No incoming messages in logs**: Check that “messages” is subscribed in the webhook and that the app is in “Live” mode if required.
- **No reply from bot**: (1) Add your phone number as a test recipient in Meta (WhatsApp → API Setup → manage phone number list). (2) Check `META_ACCESS_TOKEN`, `META_PHONE_ID`, and WhatsApp API permissions. (3) In Vercel function logs, look for `📤 WhatsApp sent` (success) or `❌ WhatsApp send failed` plus the Meta error message.

# Webhook Not Working – Fix Checklist

After deleting the old backend, Meta is still sending webhooks to the **old URL** (which no longer exists). Follow these steps:

---

## 1. Get Your Current Backend URL

- Go to [Vercel Dashboard](https://vercel.com) → **upisense-backend** (or your backend project)
- Copy the **Production URL** (e.g. `https://upisense-backend.vercel.app`)

If you don’t see a backend project, you need to deploy again (see step 5).

---

## 2. Update Meta Webhook to New Backend

1. Open [developers.facebook.com](https://developers.facebook.com) → your app → **WhatsApp** → **Configuration**
2. Find **Webhook** → **Edit**
3. Set **Callback URL** to:  
   `https://YOUR-NEW-BACKEND-URL/webhook/whatsapp`  
   Example: `https://upisense-backend.vercel.app/webhook/whatsapp`
4. **Verify token** must match the value of `META_VERIFY_TOKEN` in Vercel
5. Click **Verify and Save**
6. Ensure **messages** is subscribed

---

## 3. Confirm Environment Variables on New Backend

In Vercel → your backend project → **Settings** → **Environment Variables**, verify:

| Variable | Required |
|----------|----------|
| `SUPABASE_URL` | ✓ |
| `SUPABASE_KEY` | ✓ |
| `JWT_SECRET` | ✓ |
| `META_VERIFY_TOKEN` | ✓ |
| `META_ACCESS_TOKEN` | ✓ |
| `META_PHONE_ID` | ✓ |
| `META_BUSINESS_ACCOUNT_ID` | ✓ |
| `GEMINI_API_KEY` | ✓ |

Redeploy after adding or changing env vars.

---

## 4. Test the Backend Directly

In a browser or via `curl`:

```
https://YOUR-BACKEND-URL/health
```

Expected response: `{"status":"ok","timestamp":"..."}`

If this fails, the backend is not running or not reachable.

---

## 5. If No Backend Project Exists – Redeploy

```powershell
cd c:\Users\kusha\Desktop\Projects\UpiSense\backend
vercel link
vercel --prod
```

During `vercel link`, choose **Link to existing project** (if you have one) or create a new project.

After deploy, add env vars in Vercel, then update the Meta webhook (step 2).

---

## 6. Check Vercel Deployment Logs

Vercel → your backend project → **Deployments** → latest → **Functions** (or **Logs**).

Send a test WhatsApp message and see if the webhook is hit and if errors appear.

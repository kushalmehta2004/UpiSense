# UpiSense Deployment Guide

Deploy backend + frontend so friends can test the app.

---

## 1. Backend (Vercel)

Your backend is already set up for Vercel. Ensure it's deployed with all env vars:

### Environment Variables (Vercel Dashboard → Project → Settings → Environment Variables)

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | Yes | From Supabase project settings |
| `SUPABASE_KEY` | Yes | Supabase anon/service key |
| `JWT_SECRET` | Yes | **Change from dev** – use a long random string (e.g. `openssl rand -hex 32`) |
| `META_VERIFY_TOKEN` | Yes | Your webhook verify token |
| `META_ACCESS_TOKEN` | Yes | WhatsApp System User token |
| `META_PHONE_ID` | Yes | WhatsApp phone number ID |
| `META_BUSINESS_ACCOUNT_ID` | Yes | Meta Business Account ID |
| `GEMINI_API_KEY` | Yes | Google AI Studio key |

### Deploy backend

```bash
cd backend
vercel --prod
```

Note the deployment URL (e.g. `https://upisense-backend-xxx.vercel.app`).

---

## 2. Frontend (Vercel)

### Step 1: Create Vercel project for frontend

Option A – **Vercel Dashboard** (recommended):
1. Go to [vercel.com](https://vercel.com) → Add New → Project
2. Import your repo (or upload)
3. Set **Root Directory** to `frontend`
4. Framework preset: **Vite** (auto-detected)

Option B – **CLI**:
```bash
cd frontend
vercel
# Follow prompts, set root to . when in frontend/
```

### Step 2: Environment variables

In Vercel → frontend project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your backend URL, e.g. `https://upisense-backend-xxx.vercel.app` |
| `VITE_SUPABASE_URL` | (Optional) For real-time; from Supabase |
| `VITE_SUPABASE_ANON_KEY` | (Optional) For real-time; from Supabase |

**Important:** `VITE_API_URL` must end without a slash (e.g. `https://upisense-backend.vercel.app`).

### Step 3: Deploy

```bash
cd frontend
npm run build   # Test build locally
vercel --prod   # Deploy
```

Or push to GitHub and let Vercel auto-deploy.

---

## 3. CORS

The backend uses `cors()` with default settings (allows all origins). If you add a custom domain later, no changes are needed for CORS.

---

## 4. Pre-launch checklist

- [ ] Backend env vars set in Vercel
- [ ] `JWT_SECRET` changed from dev value
- [ ] Frontend `VITE_API_URL` points to live backend
- [ ] Meta webhook URL updated if backend URL changed
- [ ] Add your number (and test numbers) as WhatsApp test recipients in Meta
- [ ] Test: login, send WhatsApp message, see transaction on dashboard

---

## 5. Share with friends

1. Share the frontend URL (e.g. `https://upisense.vercel.app`)
2. Add their WhatsApp numbers as **test recipients** in Meta (App → WhatsApp → API Setup)
3. They sign up with phone, use OTP `123456` (dev), and forward UPI messages to your business number

**Note:** In Meta Development mode, only test recipients can message the bot. For more users, you’ll need to submit for App Review and go Live.

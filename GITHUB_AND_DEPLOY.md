# GitHub Setup + Deployment Guide

Complete steps to create a GitHub repo, push your code, and deploy to Vercel.

---

## Part 1: Create GitHub Repository

### Step 1: Create repo on GitHub

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** icon (top right) → **New repository**
3. Fill in:
   - **Repository name:** `UpiSense` (or `upisense`)
   - **Description:** Optional, e.g. "UPI transaction tracker via WhatsApp"
   - **Visibility:** Private (recommended for now) or Public
   - **Do NOT** check "Add a README" or "Add .gitignore" — your project already has these
4. Click **Create repository**
5. Copy the repo URL (e.g. `https://github.com/yourusername/UpiSense.git`)

---

## Part 2: Push Project to GitHub

### Step 2: Initialize git and push (run in terminal)

Open terminal in your project folder (`c:\Users\kusha\Desktop\Projects\UpiSense`):

```powershell
# 1. Initialize git (if not already)
git init

# 2. Add all files
git add .

# 3. Check what will be committed (make sure .env is NOT listed)
git status

# 4. First commit
git commit -m "Initial commit: UpiSense MVP (Weeks 1-3 complete)"

# 5. Add GitHub as remote (replace with YOUR repo URL)
git remote add origin https://github.com/YOUR_USERNAME/UpiSense.git

# 6. Push to GitHub (main branch)
git branch -M main
git push -u origin main
```

**Important:** If `git status` shows `.env` or `backend/.env`, **do not commit them**. They contain secrets. Your `.gitignore` should exclude them — if not, run `git rm --cached backend/.env` before committing.

---

## Part 3: Deploy Backend to Vercel

### Step 3: Connect backend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub)
2. Click **Add New** → **Project**
3. Import your `UpiSense` repo
4. Configure:
   - **Root Directory:** Click **Edit** → select `backend`
   - **Framework Preset:** Other (or Node.js)
   - **Build Command:** leave empty or `npm run build` (if you add one)
   - **Output Directory:** leave default
   - **Install Command:** `npm install`

5. **Environment Variables** — click **Expand** and add:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | From your backend `.env` |
| `SUPABASE_KEY` | From your backend `.env` |
| `JWT_SECRET` | Your production secret (e.g. `f9b1768101272052da73dda90980c860459bdcac987908e537fef4c32dbb9d47`) |
| `META_VERIFY_TOKEN` | From your `.env` |
| `META_ACCESS_TOKEN` | From your `.env` |
| `META_PHONE_ID` | From your `.env` |
| `META_BUSINESS_ACCOUNT_ID` | From your `.env` |
| `GEMINI_API_KEY` | From your `.env` |

6. Click **Deploy**
7. Wait for deployment, then copy the **Production URL** (e.g. `https://upisense-backend-xyz.vercel.app`)
8. **Update Meta webhook** (if URL changed):  
   [developers.facebook.com](https://developers.facebook.com) → Your App → WhatsApp → Configuration → Webhook → Edit and paste new callback URL

---

## Part 4: Deploy Frontend to Vercel

### Step 4: Deploy frontend

1. In Vercel, click **Add New** → **Project**
2. Import the same `UpiSense` repo again (you'll have 2 projects: backend + frontend)
3. Configure:
   - **Root Directory:** Click **Edit** → select `frontend`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. **Environment Variables** — add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | Your backend URL from Step 3 (e.g. `https://upisense-backend-xyz.vercel.app`) |

5. Click **Deploy**
6. Copy the **Production URL** (e.g. `https://upisense-abc.vercel.app`)

---

## Part 5: Pre-Launch Checklist

- [ ] Backend deployed and health check works: `https://YOUR-BACKEND.vercel.app/health`
- [ ] Frontend loads and you can reach login page
- [ ] Meta webhook URL points to backend (with `/webhook/whatsapp`)
- [ ] Your WhatsApp number (and testers) added as test recipients in Meta
- [ ] Test: Sign up → Verify OTP (123456) → Send WhatsApp message → See transaction on dashboard

---

## Part 6: Share with Testers

1. **Share frontend URL** with friends (e.g. `https://upisense-abc.vercel.app`)
2. **Add their WhatsApp numbers** in Meta:  
   App → WhatsApp → API Setup → "To" → Add phone number
3. They sign up with their phone, use OTP `123456`, then forward UPI messages to your business WhatsApp number

---

## Optional: Custom Domains

Later you can add custom domains in Vercel (e.g. `app.upisense.in`, `api.upisense.in`) under Project → Settings → Domains.

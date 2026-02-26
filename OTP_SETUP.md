# Real OTP via Firebase (Free)

UpiSense supports **real SMS OTP** using **Firebase Phone Authentication**, which is **free** for the first **10,000 verifications per month**. No payment required.

## How it works

- **Frontend**: User enters phone → Firebase sends SMS with a 6-digit code → User enters code → Frontend gets a Firebase ID token and sends it to your backend.
- **Backend**: Verifies the Firebase ID token and creates/logs in the user as before.

If Firebase is **not** configured, the app falls back to **dev OTP** (e.g. `123456`) so existing local testing keeps working.

---

## 1. Create a Firebase project (free)

1. Go to [Firebase Console](https://console.firebase.google.com/) and sign in.
2. **Add project** (or use an existing one). You can use the free Spark plan.
3. In the project, go to **Build → Authentication**.
4. Click **Get started** and enable **Phone** as a sign-in provider.
5. In **Authentication → Settings → Authorized domains**, add your app domain (e.g. `localhost` for dev, `upi-sense.vercel.app` for production).

---

## 2. Backend: Service account (for verifying tokens)

1. In Firebase Console go to **Project settings** (gear) → **Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Open the JSON file and copy its **entire contents** (one line or minified is fine).
4. In your backend `.env`, add:
   ```env
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id",...}
   ```
   Paste the full JSON as a **single line**. On Vercel, add the same as an environment variable (you can paste the JSON string).

---

## 3. Frontend: Firebase config (public)

1. In Firebase Console go to **Project settings** → **General** → **Your apps**.
2. Add a **Web app** if you haven’t. Copy the config object (apiKey, authDomain, projectId, appId).
3. In your frontend `.env` (or Vite env), add:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```
4. Rebuild/redeploy the frontend so these env vars are available.

---

## 4. Deploy and test

- **Backend**: Redeploy with `FIREBASE_SERVICE_ACCOUNT_JSON` set.
- **Frontend**: Redeploy with `VITE_FIREBASE_*` set.
- Open Login → enter phone + name → **Send OTP**. You should receive an SMS. Enter the code and verify.

---

## Optional: Test numbers (no SMS)

In Firebase Console → **Authentication** → **Sign-in method** → **Phone** → **Phone numbers for testing**, you can add a test number and a fixed 6-digit code. No real SMS is sent for that number; useful for development.

---

## Summary

| Item | Where |
|------|--------|
| Backend token verification | `FIREBASE_SERVICE_ACCOUNT_JSON` in backend `.env` |
| Frontend send OTP / get token | `VITE_FIREBASE_*` in frontend env |
| Free tier | 10,000 phone verifications per month |

Without these env vars, the app continues to use the dev OTP flow (e.g. `123456`) so your existing setup is unchanged.

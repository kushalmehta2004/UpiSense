# Firebase Web App Config – Step by Step

Your Firebase project is **upisense-f94c6**. Follow these steps to get the 4 values for the frontend.

---

## 1. Get the config from Firebase Console

1. Open **[Firebase Console](https://console.firebase.google.com/)** and select project **upisense-f94c6** (or the one you use for UpiSense).

2. Click the **gear icon** next to "Project Overview" → **Project settings**.

3. Scroll to **"Your apps"**.  
   - If you see a **Web** app (</> icon) already, click it and go to step 4.  
   - If not, click **"Add app"** → choose **Web** (</>).  
     - Enter a nickname (e.g. "UpiSense Web") → **Register app**.  
     - You can skip "Firebase Hosting" for now → **Continue** (or **Next** until you see the config).

4. You’ll see a code block like:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "upisense-f94c6.firebaseapp.com",
     projectId: "upisense-f94c6",
     appId: "1:123456789:web:abc..."
   };
   ```
   Copy these four values (you don’t need the rest of the code).

---

## 2. Create/update frontend `.env` (local dev)

1. In the **frontend** folder of UpiSense, create a file named **`.env`** (if it doesn’t exist).

2. Add these lines (use your actual values from step 1):

   ```env
   VITE_FIREBASE_API_KEY=AIza...your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=upisense-f94c6.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=upisense-f94c6
   VITE_FIREBASE_APP_ID=1:123456789:web:abc...
   ```

3. Save the file.  
   - **Important:** Restart the dev server after changing `.env` (stop `npm run dev` and run it again).

---

## 3. Add env vars on Vercel (production)

1. Go to **[vercel.com](https://vercel.com)** → your project (UpiSense **frontend** app).

2. Open **Settings** → **Environment Variables**.

3. Add each variable (one by one or paste):

   | Name | Value |
   |------|--------|
   | `VITE_FIREBASE_API_KEY` | (paste your API key) |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `upisense-f94c6.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `upisense-f94c6` |
   | `VITE_FIREBASE_APP_ID` | (paste your App ID) |

   Apply to **Production** (and Preview if you want).

4. **Redeploy** so the new env vars are used:  
   **Deployments** → click **⋯** on the latest deployment → **Redeploy** (or push a new commit to trigger a deploy).

---

## 4. Allow your domain in Firebase

1. In Firebase Console → **Build** → **Authentication** → **Settings** (or **Sign-in method** tab) → **Authorized domains**.

2. Ensure your frontend URL is listed, e.g.:
   - `localhost` (for local testing)
   - `upi-sense.vercel.app` (or whatever your Vercel frontend domain is)

3. If it’s not there, click **Add domain** and add it.

---

## Quick check

- **Local:** After setting `.env` and restarting `npm run dev`, open the login page, enter phone + name, click **Send OTP**. You should get an SMS (or use a test number in Firebase if you added one).
- **Production:** After adding Vercel env vars and redeploying, do the same on your live site.

If OTP doesn’t send, check the browser console for errors and that all four `VITE_FIREBASE_*` values are set and match the Firebase Web app config.

# Email OTP – Gmail SMTP (no domain needed)

Signup sends a 6-digit OTP to the user’s **email** via Gmail. No domain or third-party email service required.

---

## Setup

### 1. Enable 2-Step Verification and create an App Password

1. Go to [Google Account → Security](https://myaccount.google.com/security).
2. Turn on **2-Step Verification** if it’s not already on.
3. Under “2-Step Verification”, open **App passwords** (or go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. Create a new App Password (choose “Mail” and “Other”, name it e.g. “UpiSense”). Copy the **16-character password**.

### 2. Add to backend `.env`

```env
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

Use your Gmail address and the 16-character App Password (spaces optional). On Vercel, add the same two variables in the backend project’s Environment Variables.

Optional: `OTP_EMAIL_FROM` to customize the “From” display (e.g. `"UpiSense" <your@gmail.com>`). Optional: `APP_NAME` (default `UpiSense`) for the email subject.

### 3. Restart and test

Restart the backend (or redeploy on Vercel). Try sign-in with any email; the OTP will be sent from your Gmail.

---

## Migration (once)

If your `users` table doesn’t have an `email` column yet, run:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
```

(e.g. in Supabase SQL editor or run `backend/migrations/add_users_email.sql`.)

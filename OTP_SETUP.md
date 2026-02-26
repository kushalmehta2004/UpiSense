# OTP for Production

**Primary auth:** Email OTP via Gmail. See [EMAIL_OTP_SETUP.md](EMAIL_OTP_SETUP.md) for setup (no domain needed).

**Optional:** SMS OTP via Fast2SMS (e.g. if you want phone verification in addition to email).

---

## Optional: Fast2SMS (SMS OTP)

- **₹50 free credit** on signup – no card needed.
- After that, pay as you go: add small amounts in the [Fast2SMS](https://www.fast2sms.com/) dashboard when needed.

### Setup

1. Sign up at [Fast2SMS](https://www.fast2sms.com/) and get your **API key** from the dashboard.
2. Backend `.env`:
   ```env
   FAST2SMS_API_KEY=your_api_key
   ```
3. When both email OTP (Gmail) and Fast2SMS are configured, the app uses **email OTP** for signup/verify. SMS is available for future use or alternate flows if you add them.

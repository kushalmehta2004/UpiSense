# UpiSense MVP - Beta Testing Guide

**Version**: Week 1 MVP  
**Status**: Ready for Beta Testing  
**Date**: February 2026

---

## Welcome Beta Testers! 🎉

You're among the first to try **UpiSense** - an AI-powered expense tracker that works via WhatsApp. Thank you for your help!

---

## What is UpiSense?

UpiSense automatically tracks your UPI transactions by analyzing the payment notifications you forward via WhatsApp. **Zero app install. Zero friction.**

### Key Features:
- ✅ Forward UPI notifications → we parse and categorize them
- ✅ View transactions dashboard (coming Week 3)
- ✅ AI-powered merchant recognition
- ✅ Smart categorization

---

## Getting Started

### Step 1: Create Your Account

1. **Sign up** with your phone number:
   ```
   POST https://upisense-backend-cjnr8ftph-kushalmehta2004s-projects.vercel.app/auth/signup
   {
     "phone": "919876543210",
     "name": "Your Name"
   }
   ```

2. You'll receive an **OTP** (One-Time Password)

3. **Verify OTP**:
   ```
   POST https://upisense-backend-cjnr8ftph-kushalmehta2004s-projects.vercel.app/auth/verify
   {
     "phone": "919876543210",
     "otp": "123456"
   }
   ```

4. **Get your JWT token** from the response
   - Save this securely (it's your login credential)

### Step 2: Start Forwarding Transactions

1. **Any time you get a UPI payment notification**, forward it to:
   ```
   WhatsApp Bot: https://upisense-backend-cjnr8ftph-kushalmehta2004s-projects.vercel.app/webhook/whatsapp
   ```

   Example notifications to forward:
   - "Rs. 500 paid to Zomato via GPay on 21-Feb-2026..."
   - "Payment of Rs.1,250 to Swiggy is successful..."
   - Any bank SMS confirming payment

2. **Our system will**:
   - Parse the transaction (extract amount, merchant, reference)
   - Categorize it automatically
   - Store it in your dashboard

3. **You'll get confirmation** when processed

### Step 3: Provide Feedback

#### What to Test:
- [ ] Signup works (receive OTP)
- [ ] OTP verification successful
- [ ] Forward 5-10 transactions
- [ ] Check if amounts are extracted correctly
- [ ] Check if merchants are recognized
- [ ] Try different apps (Google Pay, PhonePe, Paytm, bank SMSes)

#### Submit Feedback:
1. **Email**: Send test results to [your-email]
2. **Format**:
   ```
   Subject: UpiSense Beta Feedback - [Your Name]
   
   Total Transactions Forwarded: X
   Successfully Parsed: Y
   Failed/Unclear: Z
   
   Failed Examples:
   - [Full transaction text that failed to parse]
   
   Other Issues:
   - [Any bugs, slowness, or feature requests]
   ```

---

## Known Limitations (Week 1)

❌ **Not yet implemented**:
- Dashboard to view transactions
- Monthly reports
- Budget tracking
- Custom categories
- Mobile app
- Real OTP (using test OTP "123456" for beta)
- Error messages in WhatsApp (silent processing)

⚠️ **Limitations**:
- Regex parser handles ~80% of transaction formats
- P2P transactions (person-to-person) may be categorized as "unknown"
- Processing is synchronous (may take 5-10 seconds)
- No duplicate detection yet

---

## FAQ

**Q: Do you store my personal data?**  
A: We store only phone number, name, and transaction metadata (amount, merchant, timestamp). No payment methods or sensitive bank data. See [Privacy Policy](./PRIVACY.md).

**Q: Is my transaction data secure?**  
A: Yes. All data is encrypted in transit (HTTPS) and at rest (PostgreSQL). Row-level security controls ensure only you can see your data.

**Q: What if a transaction is misparsed?**  
A: We're collecting error samples during beta to improve our parsing. Please send us the original notification text.

**Q: When will the dashboard be ready?**  
A: Week 3. You'll be able to see all your transactions with charts and insights.

**Q: Can I delete my account and data?**  
A: Yes! Email us and we'll delete everything within 24 hours.

---

## Support

Having issues? Reach out:
- **Email**: [your-email]
- **WhatsApp**: Reply to any message from our bot
- **Issues/Bugs**: Share the transaction text that failed

---

## Timeline

- **Week 1** (Feb 21): Authentication + Parser (beta testing starts)
- **Week 2** (Feb 28): LLM fallback + Merchant learning
- **Week 3** (Mar 7): Dashboard + Charts
- **Week 4** (Mar 14): Monetization + Weekly reports
- **Weeks 5-6** (Mar 21): Polish + Public Launch

---

## Thank You!

Your feedback is invaluable in making UpiSense the best expense tracker for India. Let's build something amazing together! 🚀

---

**Questions?** Just reply to this email or message us via WhatsApp!

Last Updated: February 21, 2026

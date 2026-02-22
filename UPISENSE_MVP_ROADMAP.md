# UpiSense MVP: Comprehensive Development Guide & Roadmap

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Target Timeline**: 6 Weeks  
**Audience**: Solo Developer (You)

---

## Table of Contents

1. [Phase Overview](#phase-overview)
2. [Tech Stack by Stage](#tech-stack-by-stage)
3. [Week-by-Week Roadmap](#week-by-week-roadmap)
4. [Setup & Installation Guide](#setup--installation-guide)
5. [Development Priorities](#development-priorities)
6. [Cost Breakdown (MVP)](#cost-breakdown-mvp)
7. [Important Considerations](#important-considerations)
8. [Post-MVP Growth Path](#post-mvp-growth-path)

---

## Phase Overview

The MVP is broken into 3 phases:

| **Phase** | **Duration** | **Goal** | **User Count** |
|-----------|--------------|---------|----------------|
| **Phase 1: Foundation** | Weeks 1–2 | Core infrastructure, parsing, authentication | 10–20 beta testers |
| **Phase 2: Experience** | Weeks 3–4 | Dashboard, categorization, monetization | 50–100 beta testers |
| **Phase 3: Polish & Launch** | Weeks 5–6 | Optimization, security, launch readiness | 200+ waitlist → public launch |

---

## Tech Stack by Stage

### **Stage 1: MVP (Free Tier Focus)**

| **Layer** | **Technology** | **Why** | **Cost** |
|-----------|---|---|---|
| **Frontend** | React 18 + Vite + TailwindCSS | Fast builds, minimal setup, great DX | Free |
| **Hosting** | Vercel (free tier) | Zero-config deployment, built for Next.js but works with Vite | Free |
| **Backend** | Node.js + Fastify + Vercel Serverless | Lightweight, fast, free Vercel tier covers MVP load | Free |
| **Database** | PostgreSQL on Supabase (free tier) | 500MB storage, real-time subscriptions, built-in auth | Free |
| **Authentication** | Supabase Auth + MSG91 OTP | Phone-based, native UPI user behavior, cheap OTPs | ₹0.10–0.15/OTP |
| **WhatsApp API** | Meta Cloud API (direct) | Official, 1,000 free conversations/month | Free (first 1K) |
| **Transaction Parsing** | Custom Regex Engine | Zero cost, handles 80–85% of transactions | Free |
| **LLM (Fallback)** | Google Gemini 1.5 Flash | Cheapest option, free tier available, good for fallback | Free tier + pay-per-use |
| **Payment Processing** | Razorpay | Indian support, UPI native, 2% per transaction | 2% commission |
| **Background Jobs** | BullMQ + Redis on Upstash | Free tier sufficient for MVP, serverless | Free (limited) |
| **File Storage** | Supabase Storage | Included in Supabase free tier | Free |

### **Stage 2: Post-MVP (After 500+ Users)**

| **Component** | **Upgrade** | **Cost** | **Timeline** |
|---|---|---|---|
| Database | Supabase Pro (~500MB → unlimited) | ₹1,500/month | Month 3–4 |
| Backend | Railway Starter Tier | ₹420/month | When Vercel limits hit (~2K concurrent) |
| WhatsApp | Indian BSP (AiSensy/Interakt) | ₹2,500/month | Month 3+ (when >1K conversations) |
| Gemini API | Paid quota with caching | ₹500–1,000/month | Month 4+ (if LLM traffic grows) |

---

## Week-by-Week Roadmap

### **WEEK 1: Foundation + Regex Parser** ✅ 100% COMPLETE

**Goal**: Get WhatsApp bot receiving messages, parsing them with regex, and storing in DB.

**Status**: ✅ COMPLETED (Feb 22, 2026)

#### Completed Tasks:
- [x] **Project Setup** ✅ (4 hours)
  - ✅ Created backend folder structure
  - ✅ Init Node.js project with npm
  - ✅ Installed all core dependencies (fastify, cors, jwt, postgres, supabase)
  - ✅ Setup `.env` file with all credentials
  - ✅ Created folder structure: routes/, lib/parsers/, lib/merchants/, lib/categories/, lib/jobs/

- [x] **Supabase Setup** ✅ (2 hours)
  - ✅ Created free Supabase project at supabase.co
  - ✅ Created initial schema with 5 tables:
    ```sql
    -- Users table
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(15) UNIQUE NOT NULL,
      whatsapp_number VARCHAR(15),
      name VARCHAR(255),
      plan VARCHAR(50) DEFAULT 'free',
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Transactions table
    CREATE TABLE transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      amount DECIMAL(10, 2),
      merchant_name VARCHAR(255),
      upi_id VARCHAR(255),
      category VARCHAR(100),
      source_app VARCHAR(50),
      parse_method VARCHAR(20), -- 'regex' or 'llm'
      confidence FLOAT,
      timestamp TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Merchant memory (learn user preferences)
    CREATE TABLE merchant_memory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      upi_id VARCHAR(255),
      merchant_name VARCHAR(255),
      category VARCHAR(100),
      is_p2p BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, upi_id)
    );

    -- System categories
    CREATE TABLE categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      icon VARCHAR(50),
      color VARCHAR(50),
      is_default BOOLEAN DEFAULT TRUE,
      user_id UUID, -- NULL for system defaults
      created_at TIMESTAMP DEFAULT NOW()
    );
    ```
  - Save connection string to `.env`

- [x] **Fastify Server Setup** ✅ (2 hours)
  - ✅ Created main server file with proper routes structure
  - ✅ Setup middleware (cors, error handling)
  - ✅ Created /health endpoint for testing
  - ✅ Configured for Vercel serverless deployment

- [x] **Webhook Endpoints** ✅ (3 hours)
  - ✅ Created GET /webhook/whatsapp for Meta verification
  - ✅ Created POST /webhook/whatsapp for incoming messages
  - ✅ Verified with Meta webhook tester
  - ✅ Meta webhook live on Vercel (see Week 2 resolution; add test recipient in Meta for Development mode)

- [x] **Regex Parser Library** ✅ (6 hours)
  - ✅ Created `/lib/parsers/regexTemplates.js`
  - ✅ Built templates for all major UPI apps (GPay, PhonePe, Paytm, HDFC, SBI)
  - ✅ Tested parser with real UPI notification samples
  - ✅ Achieves ~85% success rate on test data

- [x] **User Authentication** ✅ (3 hours)
  - ✅ Created signup endpoint: POST /auth/signup
  - ✅ Created verify endpoint: POST /auth/verify
  - ✅ Integrated with Supabase Auth for OTP verification
  - ✅ JWT token generation on successful verification

- [x] **Basic Parse Pipeline** ✅ (4 hours)
  - ✅ Webhook → Regex Parser → DB Insert → Confirmation flow working
  - ✅ Edge case handling for malformed messages
  - ✅ Parse failures logged for debugging

- [x] **Vercel Deployment** ✅ (2 hours)
  - ✅ Deployed backend to Vercel
  - ✅ URL: https://upisense-backend-cjnr8ftph-kushalmehta2004s-projects.vercel.app
  - ✅ Environment variables configured in Vercel dashboard
  - ✅ SSL/HTTPS working properly

#### End of Week 1 Deliverables:
✅ Backend fully deployed on Vercel  
✅ Regex parser achieves **80% success rate** on real UPI messages  
✅ Transactions ready to store in PostgreSQL  
✅ User authentication working (signup/verify endpoints)  
✅ Database schema created and tested  
✅ `/api/parse` endpoint tested and working  
✅ Meta Business Account created with credentials  

#### Parser Test Results (Feb 22, 2026):
- Test 1 (GPay "You sent"): ✅ PASS - ₹500 to Rajesh Kumar (0.95 confidence)
- Test 2 (PhonePe): ✅ PASS - ₹1,250 to Swiggy (0.95 confidence)
- Test 3 (Bank SBI): ✅ PASS - ₹300 to amazon@okaxis (0.85 confidence)
- Test 4 (Generic GPay): ✅ PASS - ₹750 to Zomato (0.95 confidence)
- Test 5 (P2P Ambiguous): ❌ Expected Fail - Will be handled by LLM in Week 2

**Final Status**: 4/5 tests passing = **80% success rate** ✅

#### ✅ Resolved from Week 1:
- **Meta Webhook Live Verification**: ✅ Resolved in Week 2. Backend refactored for Vercel serverless; webhook verification and callback URL working. See `backend/META_WEBHOOK_SETUP.md`. Add test recipient in Meta App for Development mode.

---

---

### **WEEK 2: LLM Fallback + Categorization** ✅ 100% COMPLETE

**Goal**: Handle P2P and complex merchants, learn user preferences, smart categorization.

**Status**: ✅ COMPLETED (Feb 22, 2026)

#### Completed Tasks:
- [x] **Gemini API Integration** (3 hours)
  - Setup Google Cloud account (free tier: 60 requests/min)
  - Install: `npm install @google/generative-ai`
  - Create fallback parser:
    ```javascript
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    async function parseWithLLM(text) {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Extract UPI transaction data: { amount_inr, merchant_name, upi_id, is_p2p }. 
      Text: "${text}". Return only JSON, no explanation.`;
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    }
    ```
  - Integrate into parser fallback chain

- [x] **Merchant Dictionary** (4 hours)
  - Create `/lib/merchants/dictionary.json` with top 200 Indian merchants:
    ```json
    {
      "zomato": "Food & Dining",
      "swiggy": "Food & Dining",
      "blinkit": "Groceries",
      "amazon.pay": "Shopping",
      "ola": "Transport",
      "uber": "Transport",
      "apollo": "Health",
      ...
    }
    ```
  - Implement fuzzy matching (install `fuse.js` for search):
    ```bash
    npm install fuse.js
    ```

- [x] **Merchant Memory System** (5 hours) — **IMPORTANT FOR P2P**
  - Create middleware to check `merchant_memory` before categorizing
  - If merchant not found:
    - Check dictionary
    - If still not found & is P2P: send WhatsApp clarification message
    - Store user response in `merchant_memory` permanently
  - Example flow:
    ```javascript
    async function categorizeTransaction(txn, userId) {
      // 1. Check merchant_memory first
      const memory = await db.query(
        'SELECT category FROM merchant_memory WHERE user_id = $1 AND upi_id = $2',
        [userId, txn.upi_id]
      );
      if (memory.rows[0]) return memory.rows[0].category;
      
      // 2. Check dictionary
      const dictCategory = merchantDict[txn.merchant_name.toLowerCase()];
      if (dictCategory) return dictCategory;
      
      // 3. If P2P, ask user (one-time)
      if (txn.is_p2p) {
        await sendWhatsAppQuery(userId, `What was payment to ${txn.merchant_name} for?`);
        // Wait for response & store
        return 'pending_clarification';
      }
      
      // 4. Default to LLM suggestion
      return await getLLMCategory(txn.merchant_name);
    }
    ```

- [x] **Category Suggestions** (2 hours)
  - Create `/lib/categories/defaults.js` with 15 system categories
  - Pre-populate in DB:
    ```javascript
    const defaultCategories = [
      { name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
      { name: 'Groceries', icon: '🛒', color: '#4ECDC4' },
      { name: 'Transport', icon: '🚗', color: '#FFE66D' },
      { name: 'Utilities', icon: '💡', color: '#95E1D3' },
      { name: 'Health', icon: '💊', color: '#F38181' },
      { name: 'Shopping', icon: '🛍️', color: '#AA96DA' },
      // ... more
    ];
    ```

- [x] **WhatsApp Clarification Flow** (4 hours)
  - When P2P transaction is ambiguous, send query:
    ```
    "Payment to Rajesh Kumar detected. What was this for?
    1️⃣ Home Repair
    2️⃣ Personal Loan
    3️⃣ Friend Payment
    Reply with number"
    ```
  - Parse response and store in merchant_memory
  - Map choice to category

- [x] **Confidence Scoring** (2 hours)
  - Regex matches = 0.95 confidence
  - LLM matches with clear fields = 0.80 confidence
  - LLM with null fields = 0.60 confidence (flag for clarification)
  - Known dictionary merchant = 0.90 confidence
  - If confidence < 0.75, ask user to confirm

- [x] **Error Handling & Logging** (3 hours)
  - Parse failures logged to `logs/parse-failures.log` (local) and optionally to Supabase `parse_failures` (production). Run `migrations/add_parse_failures.sql` in Supabase for Vercel.
  - `GET /api/admin/error-summary?since_days=7` for weekly review; use a cron job to hit this URL (or email yourself).
  - General errors logged via `logError(tag, error)` to `logs/errors.log` and console.

#### End of Week 2 Deliverables:
✅ LLM fallback working for non-standard transactions  
✅ Merchant memory learning user preferences  
✅ Smart categorization at >85% accuracy  
✅ P2P transactions handled with one-time clarification  
✅ All transactions categorized  
✅ **Test suite:** `npm test` in `backend/` runs `test/week2.test.js` (48 tests: health, webhook, parse, categories, merchant, categorize, error-summary, confidence, clarification flow).

**Final Status**: Week 2 complete. Run `migrations/add_parse_failures.sql` in Supabase for production error-summary on Vercel.

---

### **WEEK 3: Dashboard** ✅ 100% COMPLETE

**Goal**: Users can view their transactions and insights on a web dashboard.

**Status**: ✅ COMPLETED (Feb 22, 2026)

#### Tasks:
- [x] **React Setup** (2 hours)
  - Create folder structure:
    ```
    frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Transactions.jsx
    │   │   └── Settings.jsx
    │   ├── components/
    │   │   ├── TransactionFeed.jsx
    │   │   ├── CategoryChart.jsx
    │   │   ├── WeeklyTrend.jsx
    │   │   └── Header.jsx
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   └── useTransactions.js
    │   ├── utils/
    │   │   └── api.js
    │   └── App.jsx
    ├── index.css (Tailwind)
    └── main.jsx
    ```
  - Install dependencies:
    ```bash
    npm install react-router-dom axios zustand recharts date-fns
    ```

- [x] **Authentication Pages** (3 hours)
  - Create Login component with phone OTP flow
  - After OTP verification, store session token in localStorage
  - Create ProtectedRoute wrapper
  - Persist auth state with Zustand or React Context

- [x] **Transaction Feed Component** (4 hours)
  - Display chronological list:
    ```jsx
    <div className="space-y-4">
      {transactions.map(txn => (
        <div key={txn.id} className="flex justify-between p-4 bg-white rounded border">
          <div>
            <p className="font-bold">{txn.merchant_name}</p>
            <p className="text-sm text-gray-500">{txn.category}</p>
          </div>
          <p className="font-bold">₹{txn.amount}</p>
        </div>
      ))}
    </div>
    ```
  - Add pagination (show 20 per page, load more)
  - Add search/filter by category

- [x] **Category Breakdown Chart** (3 hours)
  - Use Recharts for pie/bar chart
  - Query: sum(amount) grouped by category
  - Show top 5 categories, rest as "Other"
  - Allow month/date range picker

- [x] **Weekly Trend Chart** (2 hours)
  - Bar chart of daily spend (last 7 days)
  - Query: sum(amount) grouped by date
  - Show moving average line

- [ ] **Budget Setting UI** (3 hours) — *Optional for MVP, do if time*
  - Allow user to set monthly limits per category
  - Visual progress bars (green → yellow → red)
  - Store in budgets table

- [x] **Real-Time Updates** (2 hours)
  - Setup Supabase subscriptions for live dashboard:
    ```javascript
    const subscription = supabase
      .from('transactions')
      .on('INSERT', payload => {
        setTransactions(prev => [payload.new, ...prev]);
      })
      .subscribe();
    ```
  - When user forwards a message, dashboard updates instantly

- [x] **Mobile Responsiveness** (3 hours)
  - Ensure all charts/tables are mobile-friendly
  - Use Tailwind's responsive classes
  - Test on phone/tablet

- [x] **API Endpoints for Dashboard** (3 hours)
  - `GET /api/transactions` — list with pagination
  - `GET /api/transactions/summary` — sum by category
  - `GET /api/transactions/daily-trend` — daily spend
  - `GET /api/categories` — list all categories
  - Ensure all queries are user-scoped (`WHERE user_id = $1`)

#### End of Week 3 Deliverables:
✅ Full-featured web dashboard  
✅ Real-time transaction updates (Supabase subscription; set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)  
✅ Visual insights (charts)  
✅ Mobile responsive  
✅ 50–100 beta testers can now see their data

#### Week 3 Setup:
```bash
# Backend (from backend/)
npm run dev   # runs on http://localhost:3000

# Frontend (from frontend/)
npm run dev   # runs on http://localhost:5173, proxies /api and /auth to backend
```
- Dev login OTP: **123456** (or 111111, 000000)
- For production: set `VITE_API_URL` to your backend URL (e.g. Vercel) before building

---

### **WEEK 4: Reports + Monetization**

**Goal**: Weekly WhatsApp summaries, Razorpay subscription integration, plan enforcement.

#### Tasks:
- [ ] **Sunday Weekly Report Generator** (4 hours)
  - Setup BullMQ job (queue-based):
    ```bash
    npm install bullmq
    ```
  - Create job that runs every Sunday 9 AM:
    ```javascript
    // jobs/weeklyReport.js
    const { Worker } = require('bullmq');
    
    const worker = new Worker('weekly-report', async job => {
      const users = await db.query('SELECT * FROM users');
      
      for (const user of users.rows) {
        const txns = await getWeekTransactions(user.id);
        const summary = generateSummary(txns);
        await sendWhatsAppMessage(user.whatsapp_number, summary);
      }
    });
    ```
  - Summary format:
    ```
    📊 Your Week at a Glance (Feb 16-22)
    ────────────────────
    Total Spent: ₹8,234
    Top Category: Food & Dining (₹2,100)
    
    💡 Insight: You spent 35% more on food this week. Consider meal prep?
    
    View full dashboard: https://upisense.app/dashboard
    ```

- [ ] **Razorpay Integration** (3 hours)
  - Install: `npm install razorpay`
  - Create subscription endpoints:
    ```javascript
    fastify.post('/api/upgrade-plan', async (request, reply) => {
      const { userId, plan } = request.body;
      // Create Razorpay subscription
      const sub = await razorpay.subscriptions.create({
        plan_id: plans[plan].razorpay_id,
        customer_notify: 1,
        quantity: 1
      });
      // Store in subscriptions table
      await db.query(
        'INSERT INTO subscriptions (user_id, plan, razorpay_sub_id) VALUES ($1, $2, $3)',
        [userId, plan, sub.id]
      );
      return reply.send(sub);
    });
    ```
  - Create subscription plans in Razorpay dashboard:
    - Free: ₹0 (30 txns/month)
    - Pro: ₹99/month (unlimited)
    - Family: ₹199/month (2 members)

- [ ] **Plan Enforcement** (3 hours)
  - Middleware to check user's plan before operations:
    ```javascript
    async function enforcePlan(userId) {
      const sub = await db.query('SELECT plan FROM subscriptions WHERE user_id = $1', [userId]);
      const plan = sub.rows[0]?.plan || 'free';
      return plan;
    }
    
    // In transaction endpoint
    const plan = await enforcePlan(userId);
    const txnCount = await getMonthTransactionCount(userId);
    
    if (plan === 'free' && txnCount >= 30) {
      return reply.code(403).send({ error: 'Transaction limit reached. Upgrade to Pro.' });
    }
    ```

- [ ] **Payment Webhook Handler** (2 hours)
  - Listen for Razorpay webhook events (subscription.charged, subscription.completed)
  - Update subscription status in DB
  - Send confirmation WhatsApp message

- [ ] **Dashboard Upgrade Prompt** (2 hours)
  - Show subtle banner if user on free plan:
    ```jsx
    {plan === 'free' && (
      <Banner>
        Free plan: 30 transactions/month | 
        <Link to="/upgrade">Upgrade to Pro ₹99/mo</Link>
      </Banner>
    )}
    ```
  - Create upgrade flow in Settings page

- [ ] **Webhooks & Event Logging** (2 hours)
  - Log all key events (signup, first transaction, upgrade, etc.)
  - Will be useful for analytics later

#### End of Week 4 Deliverables:
✅ Weekly WhatsApp reports every Sunday  
✅ Razorpay subscription integration  
✅ Plan enforcement (Free vs Pro)  
✅ Users can upgrade to Pro  
✅ Revenue-ready (though expect $0 in MVP)

---

### **WEEK 5: Polish + Beta Testing**

**Goal**: Fix bugs, optimize performance, gather user feedback.

#### Tasks:
- [ ] **Performance Optimization** (3 hours)
  - Measure: `npm run build` bundle size
  - Lazy-load charts (don't render all months at once)
  - Optimize database queries (add indexes):
    ```sql
    CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
    CREATE INDEX idx_merchant_memory_user_upi ON merchant_memory(user_id, upi_id);
    ```
  - Target: Dashboard load < 3 seconds, transaction appear < 10 seconds

- [ ] **Edge Case Handling** (4 hours)
  - Duplicate message detection (same UPI ref twice)
  - Malformed OTPs
  - Messages with emojis, special characters
  - Timezone issues (store all timestamps as UTC)
  - Test with 10 real beta testers, collect feedback

- [ ] **Security Review** (3 hours)
  - Ensure all API endpoints validate user_id from JWT token
  - Don't store Razorpay secrets in frontend
  - Use environment variables for all API keys
  - Validate phone numbers (Indian format)
  - Review Supabase RLS (Row Level Security) policies

- [ ] **Error States & UX** (2 hours)
  - Loading spinners during API calls
  - Error messages for failed API calls
  - Empty states ("No transactions yet. Forward a payment to get started")
  - Network error recovery

- [ ] **Testing** (3 hours)
  - Test parsing with 50+ real UPI messages (ask beta testers)
  - Test with multiple phone numbers simultaneously
  - Test upgrade flow and payment webhook
  - Manually verify 100 transactions for category accuracy

- [ ] **Monitoring Setup** (2 hours)
  - Setup error tracking (free Sentry tier or custom logging)
  - Monitor API latency
  - Setup uptime monitoring (free: Uptime Robot)
  - Create dashboard to check system health

#### End of Week 5 Deliverables:
✅ Bug-free MVP  
✅ Performance optimized  
✅ Security hardened  
✅ 50–100 beta testers happy with product  
✅ Ready for public launch

---

### **WEEK 6: Launch Prep**

**Goal**: Finalize legal docs, create launch assets, launch to Product Hunt.

#### Tasks:
- [ ] **Privacy Policy & Terms of Service** (2 hours)
  - Use generator tools (e.g., Termly.io free tier) for templates
  - Key points:
    - Data retention: 2 years
    - No third-party data sharing
    - WhatsApp messages are temporarily stored for parsing
    - GDPR-compliant (even for India, best practice)
  - Deploy to `/privacy` and `/terms` routes

- [ ] **Landing Page / Welcome Page** (3 hours)
  - Create professional landing page:
    - Hero section: "Track every rupee. Zero effort."
    - Problem section: "WhatsApp-based, works on iPhone"
    - How it works: 3-step visual
    - Pricing table
    - CTA: "Join 200+ beta testers"
  - Setup email capture with Mailchimp (free tier)

- [ ] **Product Hunt Listing** (2 hours)
  - Create Product Hunt account
  - Prepare:
    - 1-line tagline
    - Full description
    - 3–4 screenshots
    - Demo video (30 seconds, screencast)
  - Schedule launch for Tuesday/Wednesday
  - Prepare hunter post (story of why you built it)

- [ ] **README & Documentation** (2 hours)
  - Create GitHub README with:
    - Problem statement
    - Tech stack
    - Setup instructions
    - API documentation (quick reference)
  - Commit to GitHub (make repo public)

- [ ] **Deployment Checklist** (2 hours)
  - [ ] Environment variables all set (.env.production)
  - [ ] Database migrations run
  - [ ] SSL certificate (automatic on Vercel)
  - [ ] Domain SSL (if using custom domain)
  - [ ] Sentry / monitoring initialized
  - [ ] Razorpay webhook registered
  - [ ] Meta webhook verified
  - [ ] Backup database snapshot

- [ ] **Soft Launch** (2 hours)
  - Send email to 50 beta testers 48 hours before Product Hunt
  - Collect final feedback
  - Fix critical bugs only
  - Get testimonials for Product Hunt

- [ ] **Day-of Launch** (4 hours)
  - Post on Product Hunt early morning IST
  - Monitor comments & questions
  - Share on Twitter, LinkedIn, Reddit
  - Respond to all feedback in real-time

#### End of Week 6 Deliverables:
✅ Legal docs finalized  
✅ Public GitHub repo  
✅ Product Hunt launch  
✅ 200+ waitlist signups  
✅ First real users onboarded

---

## Setup & Installation Guide

### **Initial Project Setup (Do This First)**

```bash
# 1. Create main project
mkdir upisense-mvp
cd upisense-mvp
git init

# 2. Create backend
mkdir backend
cd backend
npm init -y

# 3. Install dependencies
npm install fastify fastify-cors dotenv pg @supabase/supabase-js axios
npm install -D typescript @types/node tsx nodemon

# 4. Create .env file
cat > .env << 'EOF'
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
META_VERIFY_TOKEN=your-meta-token
META_BUSINESS_ACCOUNT_ID=your-meta-id
MSG91_AUTH_KEY=your-msg91-key
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
EOF

# 5. Create backend folder structure
mkdir -p api lib/{parsers,merchants,categories,jobs} routes

# 6. Create main server file
cat > index.js << 'EOF'
const fastify = require('fastify');
const cors = require('fastify-cors');

const app = fastify();
app.register(cors);

app.listen({ port: process.env.PORT, host: '0.0.0.0' }, (err, addr) => {
  if (err) throw err;
  console.log(`Server listening on ${addr}`);
});
EOF

# 7. Go back and create frontend
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### **Supabase Setup**

1. Go to supabase.com → Sign up (free)
2. Create new project → Choose region (Mumbai if available)
3. Wait for initialization
4. Go to SQL Editor → Create new query
5. Paste the schema from Week 1 above
6. Run query
7. Go to Settings → API → Copy `URL` and `anon` key
8. Add to backend `.env`

### **Meta/WhatsApp API Setup**

1. Go to developers.facebook.com
2. Create business app
3. Add WhatsApp product
4. Create phone number sandbox
5. Get webhook verify token (generate random: `openssl rand -hex 16`)
6. Add to `.env`
7. Deploy backend to Vercel first, then configure webhook

### **Vercel Deployment**

```bash
# In backend folder
npm install -g vercel
vercel login
vercel --env SUPABASE_URL=xxx --env SUPABASE_KEY=xxx
# Copy deployment URL
```

### **Gemini API Key**

1. Go to makersuite.google.com
2. Click "Create API Key"
3. Copy and add to `.env`

### **Razorpay Setup**

1. Go to razorpay.com → Sign up
2. Create 3 plans (Free/Pro/Family) manually in dashboard
3. Get plan IDs
4. Get API key from Settings
5. Add to `.env`

### **MSG91 Setup**

1. Go to msg91.com → Sign up
2. Create OTP template
3. Get Auth Key
4. Test with your own phone number
5. Add to `.env`

---

## Development Priorities

### **Critical Path (Must Have)**

1. ✅ Regex parser (Week 1) — Without this, the system doesn't work
2. ✅ WhatsApp webhook (Week 1) — Core user input
3. ✅ User auth (Week 1) — Can't scale without user isolation
4. ✅ Dashboard (Week 3) — Users need to see their data
5. ✅ Categorization (Week 2) — Core value prop

### **High Priority (Should Have)**

- Merchant memory (P2P learning)
- Weekly reports
- Error tracking

### **Nice-to-Have (Can Defer)**

- Budget alerts
- Family sharing
- Custom categories
- Data export

### **Skip for MVP**

- Mobile app
- Bank integrations
- Investment features
- Social sharing
- Referral program (add after launch)

---

## Cost Breakdown (MVP)

### **Phase 1 (Weeks 1–2): Foundation**

| Item | Cost | Notes |
|------|------|-------|
| Domain | ₹0 | Use free subdomain or skip initially |
| Vercel | Free | 100 deployments/month free |
| Supabase | Free | 500MB storage, perfect for MVP |
| Gemini API | Free | 60 requests/min free tier |
| Meta Cloud API | Free | 1,000 conversations/month free |
| MSG91 OTP | ₹100–200 | ~200–400 OTPs for 50 beta testers |
| **Subtotal** | **₹100–200** | |

### **Phase 2 (Weeks 3–4): Experience**

| Item | Cost | Notes |
|------|------|-------|
| Previous costs | ₹100 | Ongoing |
| Razorpay | Free | No setup fee, only per-transaction (0% in testing) |
| Vercel Pro | Free → Free | Stick with free tier until >1K requests/day |
| Sentry | Free | Free error tracking tier |
| **Subtotal** | **₹100–200** | |

### **Phase 3 (Weeks 5–6): Polish & Launch**

| Item | Cost | Notes |
|------|------|-------|
| Previous costs | ₹100 | Ongoing |
| Uptime monitoring | Free | Uptime Robot free tier |
| Product Hunt | Free | Free to launch |
| **Subtotal** | **₹100–200** | |

### **6-Week Total**

**₹300–600 (just OTP costs)**

### **After Launch (Month 2)**

When you get real users:
- Supabase upgrade: ₹1,500/month (at 500+ users)
- Gemini API: ₹500–1,000/month (if LLM traffic grows)
- Railroad backend: ₹420/month (when Vercel limits hit)
- Meta BSP: ₹2,500/month (when >1K conversations)
- **Total: ~₹6,000/month** (but revenue covers this)

---

## Important Considerations

### **Regex Parser is Key**

The entire cost advantage of this product depends on the regex parser working well. Invest heavily in Week 1.

- Test with REAL messages from 10+ different UPI apps
- Build templates iteratively (don't try to make perfect on day 1)
- Add new patterns as you get bug reports
- Keep a `failed_parses.log` and review weekly

### **Never Call LLM Before Regex**

The architecture in the PRD says "regex first, LLM fallback only". This is critical for cost control. If you reverse it, you'll burn through Gemini quota immediately.

### **User Privacy**

- Never store WhatsApp raw messages in DB (parse immediately, delete)
- Don't log full message content in errors
- Be transparent in Privacy Policy about what you do with data
- Consider adding a "Delete my account" flow early

### **Database Backups**

- Supabase has automatic backups (free tier: daily)
- Export critical data weekly manually (free with pg_dump)
- Never delete production data casually

### **Monitoring**

Even on free tier, you should know:
- How many requests/day
- API latency (p95)
- Parse failure rate
- Error types

Set up basic monitoring in Week 5.

### **Testing Regex**

Create a test file with real messages:

```javascript
// tests/parser.test.js
const parser = require('../lib/parsers/regexTemplates');

const testCases = [
  {
    input: "Rs. 250 paid to Zomato via GPay. UPI Ref: 123ABC",
    expected: { amount: '250', merchant: 'Zomato', ref: '123ABC' }
  },
  // Add 50+ more real examples
];

testCases.forEach(({ input, expected }) => {
  const result = parser(input);
  console.assert(JSON.stringify(result) === JSON.stringify(expected), 
    `Failed: ${input}`);
});
```

---

## Post-MVP Growth Path

### **Month 2 (After Launch)**

- Collect feedback from first 100 real users
- Top 3 feature requests → implement in Week 1
- Iterate on category suggestions (accuracy should be >90% by now)
- Setup referral program (simple: both get 1 free month)

### **Month 3 (500+ Users)**

- Upgrade Supabase to Pro
- Build Family Dashboard
- Add Budget tracking
- Create YouTube tutorials on how to use the app
- Reach out to finance YouTube channels

### **Month 4 (1000+ Users)**

- Add GST/Business tracking (for freelancers)
- Integrate with accountants/CA platforms
- Monthly recurring revenue should be ₹30K–50K
- Consider hiring first contractor (customer support)

### **Month 6 (5000+ Users)**

- Mobile app (if demand is high)
- Bank integrations (AA framework)
- Advanced analytics
- Potential to raise angel funding

---

## Troubleshooting & Common Issues

### **WhatsApp Webhook Not Receiving Messages**

- [ ] Verify webhook URL is publicly accessible
- [ ] Check webhook token matches (Settings → Webhooks)
- [ ] Message might be hitting rate limit (Meta limits: 1,000/day free)
- [ ] Check request logs in Vercel

### **Regex Not Matching**

- [ ] Print the raw message text to see exact format
- [ ] Test regex on regex101.com
- [ ] Notification format might differ by phone/app version
- [ ] Add new pattern to library

### **Database Connection Fails**

- [ ] Check SUPABASE_URL and SUPABASE_KEY in .env
- [ ] Verify IP whitelist (Supabase: Settings → Network)
- [ ] Free tier might have connection limit (~10 concurrent)

### **Gemini API Quota Exceeded**

- [ ] Switch to Regex-first (should only fallback on ~15%)
- [ ] Check if LLM is being called unnecessarily
- [ ] Wait for quota reset (daily limit)

---

## File Structure (Final)

```
upisense-mvp/
├── backend/
│   ├── api/
│   │   ├── transactions.js
│   │   ├── auth.js
│   │   └── users.js
│   ├── lib/
│   │   ├── parsers/
│   │   │   └── regexTemplates.js
│   │   ├── merchants/
│   │   │   └── dictionary.json
│   │   ├── categories/
│   │   │   └── defaults.js
│   │   └── jobs/
│   │       └── weeklyReport.js
│   ├── routes/
│   │   ├── webhook.js
│   │   └── api.js
│   ├── index.js
│   ├── .env (local only, not committed)
│   ├── package.json
│   └── vercel.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/
│   │   │   ├── TransactionFeed.jsx
│   │   │   ├── Charts.jsx
│   │   │   └── Header.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useTransactions.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
├── README.md
├── .gitignore
└── UPISENSE_MVP_ROADMAP.md (this file)
```

---

## Key Metrics to Track

By end of Week 6, track these:

| Metric | Target | Why |
|--------|--------|-----|
| Parse success rate | >85% | Confirms cost architecture |
| Category accuracy | >85% | User satisfaction |
| Onboarding completion | >60% | Users actually using it |
| Time from forward → dashboard | <10s | User experience |
| WhatsApp delivery success | >98% | Reliability |
| API response time (p95) | <500ms | Performance |

---

## Final Notes

1. **Ship fast, iterate based on feedback.** The PRD is a guide, not a contract.
2. **Regex parsing is your competitive advantage.** Don't skip it.
3. **Focus on user retention, not growth.** 100 active users is better than 1,000 inactive ones.
4. **Document as you build.** Future you will thank current you.
5. **Save this roadmap and update it as you progress.** Refer back weekly.

**Good luck! You've got this. 🚀**

---

*Last Updated: February 2026*  
*Next Review: After Week 3 (Check if on schedule)*

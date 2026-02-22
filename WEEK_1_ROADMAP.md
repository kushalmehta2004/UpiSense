# UpiSense MVP - Week 1 Comprehensive Roadmap

**Duration**: 7 Days (Mon-Sun)  
**Goal**: Get WhatsApp bot receiving messages, parsing with regex, storing in DB, and onboarding 10 beta testers.  
**Expected Hours**: 25-30 hours (spread across the week)

---

## 📋 Week 1 Overview

By the end of this week, you'll have:
- ✅ A running WhatsApp bot integrated with Meta Cloud API
- ✅ Regex-based parser extracting UPI transaction data (~80% success)
- ✅ PostgreSQL database storing transactions
- ✅ User authentication with phone OTP
- ✅ Basic parse pipeline: WhatsApp → Parsing → DB → Confirmation
- ✅ Ready to onboard 10 beta testers

---

## Daily Breakdown

### **Monday - Project Setup & Infrastructure (4-5 hours)**

#### Task 1.1: GitHub & Node.js Project Setup (1.5 hours)

**What**: Initialize your development environment

```bash
# Create main project directory
mkdir upisense-mvp
cd upisense-mvp
git init

# Initialize Node.js backend
mkdir backend
cd backend
npm init -y

# Install core dependencies
npm install fastify fastify-cors dotenv pg @supabase/supabase-js axios
npm install -D typescript @types/node tsx nodemon

# Create folder structure
mkdir -p api lib/{parsers,merchants,categories,jobs} routes config

# Return to root
cd ..
```

**Checklist**:
- [ ] Create `.gitignore` in root
  ```
  node_modules/
  .env
  .env.local
  dist/
  build/
  .DS_Store
  ```
- [ ] Create `.env` file (DON'T commit)
  ```
  PORT=3000
  SUPABASE_URL=
  SUPABASE_KEY=
  GEMINI_API_KEY=
  META_VERIFY_TOKEN=
  META_BUSINESS_ACCOUNT_ID=
  MSG91_AUTH_KEY=
  RAZORPAY_KEY_ID=
  RAZORPAY_KEY_SECRET=
  ```
- [ ] Create `backend/index.js` (basic Fastify server)
- [ ] Verify `npm start` works (should fail but no syntax errors)

---

#### Task 1.2: Supabase Setup (2-2.5 hours)

**What**: Create PostgreSQL database with initial schema

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com) → Sign up (free tier)
   - Create new project (choose Mumbai region if available)
   - Wait 3-5 minutes for initialization
   - Go to Settings → API → Copy `Project URL` and `anon` key
   - Add both to your `.env`:
     ```
     SUPABASE_URL=https://xxxxx.supabase.co
     SUPABASE_KEY=eyJhb...
     ```

2. **Create Database Schema**:
   - Go to Supabase Console → SQL Editor → New Query
   - Run this schema (copy from UPISENSE_MVP_ROADMAP.md Week 1 section):

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
     parse_method VARCHAR(20),
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
     user_id UUID,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Verify Tables**:
   - Go to Table Editor in Supabase console
   - Should see 4 tables: `users`, `transactions`, `merchant_memory`, `categories`

**Checklist**:
- [ ] Supabase project created
- [ ] API credentials in `.env`
- [ ] All 4 tables created
- [ ] Can connect from Node.js:
  ```bash
  node -e "require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)" && echo "Connected!"
  ```

---

#### Task 1.3: Verify Backend Server (1 hour)

**What**: Ensure Fastify server runs locally

**Create `backend/index.js`**:
```javascript
const fastify = require('fastify');
const cors = require('fastify-cors');

const app = fastify({ logger: true });
app.register(cors);

// Health check endpoint
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    console.log(`✅ Server running on http://localhost:${process.env.PORT || 3000}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
```

**Test**:
```bash
cd backend
npm start
# Visit http://localhost:3000/health
# Should return: { status: 'ok', timestamp: '...' }
```

**Checklist**:
- [ ] Server starts without errors
- [ ] `/health` endpoint responds
- [ ] Can kill server with Ctrl+C

---

### **Tuesday - WhatsApp Webhook Setup (4-5 hours)**

#### Task 2.1: Meta/WhatsApp Business Account Setup (1.5 hours)

**What**: Register with Meta to receive WhatsApp messages

1. **Create Meta Business App**:
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Click "My Apps" → "Create App"
   - App Name: `UpiSense-MVP`
   - App Purpose: Choose "Business"
   - Fill details (your name, business email)

2. **Add WhatsApp Product**:
   - Inside your app dashboard → "Add Product"
   - Find "WhatsApp" → "Set Up"
   - Choose "Cloud API" (not Hosted API)

3. **Create Phone Number Sandbox**:
   - Go to WhatsApp → "Getting Started"
   - Create sandbox phone number (e.g., `+1-201-555-0123`)
   - This is your **test number** for development
   - You can add up to 50 phone numbers to test with

4. **Get API Credentials**:
   - Go to WhatsApp → Settings → Business Account
   - Copy:
     - `Business Account ID` → Add to `.env` as `META_BUSINESS_ACCOUNT_ID`
     - `Permanent Access Token` (or generate) → Don't add to `.env` yet, you'll use it during deployment

5. **Generate Webhook Verify Token**:
   - Generate random token (to secure your webhook):
   ```bash
   # On Mac/Linux:
   openssl rand -hex 16
   # Output example: a1b2c3d4e5f6g7h8
   ```
   - Add to `.env`:
     ```
     META_VERIFY_TOKEN=a1b2c3d4e5f6g7h8
     ```

**Checklist**:
- [ ] Meta business app created
- [ ] WhatsApp product added
- [ ] Sandbox phone number created
- [ ] `META_BUSINESS_ACCOUNT_ID` in `.env`
- [ ] `META_VERIFY_TOKEN` in `.env`

---

#### Task 2.2: WhatsApp Webhook Endpoint (2 hours)

**What**: Create endpoint to receive messages from WhatsApp

**Create `backend/routes/whatsapp-webhook.js`**:

```javascript
const plugin = async (fastify, options) => {
  // Webhook verification (initial handshake)
  fastify.get('/webhook/whatsapp', async (request, reply) => {
    const {
      'hub.mode': mode,
      'hub.challenge': challenge,
      'hub.verify_token': token
    } = request.query;

    if (mode !== 'subscribe') {
      return reply.code(400).send({ error: 'Invalid mode' });
    }

    if (token !== process.env.META_VERIFY_TOKEN) {
      return reply.code(403).send({ error: 'Invalid token' });
    }

    console.log('✅ WhatsApp webhook verified');
    return reply.send(challenge);
  });

  // Webhook receiver (incoming messages)
  fastify.post('/webhook/whatsapp', async (request, reply) => {
    console.log('📨 Incoming webhook:', JSON.stringify(request.body, null, 2));

    const { entry } = request.body;

    if (!entry || !entry[0]) {
      return reply.send({ success: true });
    }

    const changes = entry[0].changes;
    if (!changes || !changes[0]) {
      return reply.send({ success: true });
    }

    const { value } = changes[0];
    if (!value || !value.messages) {
      return reply.send({ success: true });
    }

    // Extract message data
    const message = value.messages[0];
    const phoneId = value.metadata.phone_number_id;
    const senderId = message.from;
    const text = message.text?.body;

    if (!text) {
      return reply.send({ success: true });
    }

    console.log(`📤 Message from ${senderId}: ${text}`);

    // TODO: Call parser and store in DB (Week 2)
    // For now, just acknowledge receipt
    try {
      // Send read receipt
      // (Optional: implement in Week 4)
      return reply.send({ success: true, received: true });
    } catch (error) {
      console.error('❌ Error processing message:', error);
      return reply.code(500).send({ error: 'Internal error' });
    }
  });

  // Mark message as read (optional)
  fastify.post('/api/mark-read', async (request, reply) => {
    const { messageId } = request.body;
    // TODO: Implement in Week 4
    return reply.send({ success: true });
  });
};

module.exports = plugin;
```

**Update `backend/index.js`** to register the webhook route:

```javascript
const whatsappWebhook = require('./routes/whatsapp-webhook.js');

const start = async () => {
  // ... existing code ...
  await app.register(whatsappWebhook);
  // ... rest of code ...
};
```

**Checklist**:
- [ ] `/webhook/whatsapp` GET endpoint created
- [ ] `/webhook/whatsapp` POST endpoint created
- [ ] Routes registered in index.js
- [ ] Server starts without errors
- [ ] Can see logs in console

---

#### Task 2.3: Deploy to Vercel (1.5 hours)

**What**: Deploy backend to public URL so Meta can send webhooks

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   # Opens browser, authenticate with GitHub/email
   ```

3. **Deploy**:
   ```bash
   cd backend
   vercel --prod
   # Select "y" for default settings
   ```

4. **Get Deployment URL**:
   - Vercel outputs: `✓ Production: https://your-project-abc123.vercel.app`
   - Copy this URL (you'll need it for Meta)

5. **Configure Meta Webhook** (back in Meta dashboard):
   - Go to WhatsApp → Configuration → Webhook URL
   - Paste: `https://your-project-abc123.vercel.app/webhook/whatsapp`
   - Verify Token: `a1b2c3d4e5f6g7h8` (your META_VERIFY_TOKEN)
   - Click "Verify and Save"
   - Should show ✅ "Webhook verified"

6. **Subscribe to Webhook Events**:
   - Still in Webhook Configuration
   - Under "Webhook fields", subscribe to:
     - [ ] `messages`
     - [ ] `message_status` (optional, for delivery confirmation)

**Checklist**:
- [ ] Vercel CLI installed
- [ ] Backend deployed to Vercel
- [ ] Public URL created
- [ ] Meta webhook URL configured
- [ ] Meta webhook verified (✅ checkmark)
- [ ] `messages` event subscribed

---

### **Wednesday - Regex Parser Development (5-6 hours)**

#### Task 3.1: Build Regex Templates (3 hours)

**What**: Create regex patterns to extract UPI transaction data

**Create `backend/lib/parsers/regexTemplates.js`**:

```javascript
const templates = {
  gpay: {
    pattern: /Rs\.\s*([\d,]+(?:\.\d{2})?)\s+paid to\s+([^.]+?)\s+via GPay.*?(?:UPI Ref|Ref):\s*(\S+)/is,
    fields: ['amount', 'merchant', 'ref'],
    sourceApp: 'google_pay',
    confidence: 0.95
  },
  phonepe: {
    pattern: /Payment of Rs\.([\d,]+(?:\.\d{2})?)\s+to\s+([^.]+?)\s+(?:is|was)\s+successful.*?(?:UPI Ref No|Ref):\s*(\S+)/is,
    fields: ['amount', 'merchant', 'ref'],
    sourceApp: 'phonepe',
    confidence: 0.95
  },
  paytm: {
    pattern: /You have paid Rs\.([\d,]+(?:\.\d{2})?)\s+to\s+([^.]+?)(?:\.|\s).*?(?:UPI Ref|Ref):\s*(\S+)/is,
    fields: ['amount', 'merchant', 'ref'],
    sourceApp: 'paytm',
    confidence: 0.95
  },
  sbi: {
    pattern: /A\/C X(\d{4}).*debited by Rs\s*([\d,]+(?:\.\d{2})?)\s+.*?trf to\s+([^\s.]+).*?(?:Ref No|Ref):\s*(\S+)/is,
    fields: ['account_last4', 'amount', 'upi_id', 'ref'],
    sourceApp: 'sbi',
    confidence: 0.95
  },
  hdfc: {
    pattern: /HDFC Bank:\s*Rs\s*([\d,]+(?:\.\d{2})?)\s+debited.*?to\s+([^\s.]+).*?(?:Ref|Reference):\s*(\S+)/is,
    fields: ['amount', 'upi_id', 'ref'],
    sourceApp: 'hdfc',
    confidence: 0.95
  },
  icici: {
    pattern: /ICICI.*?Rs\s*([\d,]+(?:\.\d{2})?)\s+.*?to\s+([^\s.]+).*?(?:Ref|UTR):\s*(\S+)/is,
    fields: ['amount', 'upi_id', 'ref'],
    sourceApp: 'icici',
    confidence: 0.90
  },
  axis: {
    pattern: /Axis Bank.*?Rs\s*([\d,]+(?:\.\d{2})?)\s+.*?([^\s.]+).*?(?:Ref|UTR):\s*(\S+)/is,
    fields: ['amount', 'upi_id', 'ref'],
    sourceApp: 'axis',
    confidence: 0.90
  }
};

/**
 * Parse transaction from UPI notification text
 * @param {string} text - Raw message text
 * @returns {Object|null} Parsed transaction or null if no match
 */
function parseTransaction(text) {
  if (!text || typeof text !== 'string') return null;

  for (const [source, config] of Object.entries(templates)) {
    const match = text.match(config.pattern);
    if (match) {
      const result = {
        source_app: config.sourceApp,
        parse_method: 'regex',
        confidence: config.confidence
      };

      // Normalize amount (remove commas, convert to number)
      const amountStr = match[1]?.replace(/,/g, '');
      if (amountStr) {
        result.amount = parseFloat(amountStr);
      }

      // Map captured groups to fields
      config.fields.forEach((field, idx) => {
        const value = match[idx + 1];
        if (value) {
          if (field === 'amount') {
            result[field] = parseFloat(value.replace(/,/g, ''));
          } else if (field === 'merchant' || field === 'upi_id') {
            result[field] = value.trim();
          } else {
            result[field] = value;
          }
        }
      });

      console.log(`✅ Parsed with ${source}: ${JSON.stringify(result)}`);
      return result;
    }
  }

  return null;
}

module.exports = { parseTransaction, templates };
```

**Create test file `backend/lib/parsers/testRegex.js`**:

```javascript
const { parseTransaction } = require('./regexTemplates.js');

// Test samples (collect real samples from users later)
const testMessages = [
  `Rs. 500 paid to Zomato via GPay on 21-Feb-2026 at 7:45 PM. UPI Ref: 321098765432.`,
  `Payment of Rs.1,250 to Swiggy is successful. Your unique Transaction Reference is: 109876543210.`,
  `You have paid Rs.1500 to Amazon. UPI Ref: 210987654321.`,
  `HDFC Bank: Rs 2000 debited from your Account. Beneficiary: Google@OKHDFCBANK. Ref 123456789.`,
  `A/C X4567 debited by Rs 300 on 21-FEB for trf to upi@sbi by Phone Banking. Ref No 987654321.`,
];

console.log('🧪 Testing Regex Parser...\n');

testMessages.forEach((msg, idx) => {
  console.log(`Test ${idx + 1}: "${msg}"`);
  const result = parseTransaction(msg);
  console.log(`Result: ${result ? JSON.stringify(result, null, 2) : '❌ NO MATCH'}\n`);
});
```

**Test it**:
```bash
cd backend
node lib/parsers/testRegex.js
```

**Expected Output**: Should match at least 3/5 test messages

**Checklist**:
- [ ] `regexTemplates.js` created with 7+ patterns
- [ ] `parseTransaction()` function works
- [ ] Test file created
- [ ] Running tests shows matches for common formats
- [ ] All regex patterns use case-insensitive matching (`i` flag)

---

#### Task 3.2: Parser Integration into Webhook (2-3 hours)

**What**: Connect parser to WhatsApp webhook

**Update `backend/routes/whatsapp-webhook.js`**:

```javascript
const { parseTransaction } = require('../lib/parsers/regexTemplates.js');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const plugin = async (fastify, options) => {
  fastify.get('/webhook/whatsapp', async (request, reply) => {
    const {
      'hub.mode': mode,
      'hub.challenge': challenge,
      'hub.verify_token': token
    } = request.query;

    if (mode !== 'subscribe' || token !== process.env.META_VERIFY_TOKEN) {
      return reply.code(403).send({ error: 'Invalid token' });
    }

    return reply.send(challenge);
  });

  fastify.post('/webhook/whatsapp', async (request, reply) => {
    try {
      const { entry } = request.body;
      if (!entry || !entry[0]?.changes?.[0]) {
        return reply.send({ success: true });
      }

      const { value } = entry[0].changes[0];
      if (!value?.messages) {
        return reply.send({ success: true });
      }

      const message = value.messages[0];
      const senderId = message.from;
      const text = message.text?.body;

      if (!text) {
        return reply.send({ success: true });
      }

      console.log(`📨 Message from ${senderId}: ${text}`);

      // Parse transaction
      const parsed = parseTransaction(text);

      if (parsed) {
        // Get user (create if doesn't exist)
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('whatsapp_number', senderId)
          .single();

        let userId = user?.id;

        if (!userId) {
          // Create new user
          const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
              whatsapp_number: senderId,
              phone: senderId,
              name: `User_${senderId.slice(-4)}`
            }])
            .select('id')
            .single();

          if (error) throw error;
          userId = newUser.id;
          console.log(`👤 Created new user: ${userId}`);
        }

        // Store transaction
        const { data: txn, error: txnError } = await supabase
          .from('transactions')
          .insert([{
            user_id: userId,
            amount: parsed.amount,
            merchant_name: parsed.merchant || parsed.upi_id,
            upi_id: parsed.upi_id,
            source_app: parsed.source_app,
            parse_method: parsed.parse_method,
            confidence: parsed.confidence,
            timestamp: new Date()
          }])
          .select('id')
          .single();

        if (txnError) throw txnError;

        console.log(`✅ Stored transaction: ${txn.id}`);
        console.log(`   Amount: ₹${parsed.amount} | Merchant: ${parsed.merchant || parsed.upi_id}`);

        return reply.send({ success: true, parsed: true });
      } else {
        console.log(`⚠️  Could not parse: ${text.substring(0, 50)}...`);
        // Will integrate LLM fallback in Week 2
        return reply.send({ success: true, parsed: false });
      }
    } catch (error) {
      console.error('❌ Error:', error);
      return reply.code(500).send({ error: 'Internal error' });
    }
  });
};

module.exports = plugin;
```

**Test**:
```bash
# 1. Ensure server is running
npm start

# 2. Send test message via WhatsApp to sandbox number:
# "Rs. 500 paid to Zomato via GPay on 21-Feb-2026 at 7:45 PM. UPI Ref: 321098765432."

# 3. Check server logs - should show:
# ✅ Stored transaction: xxx
# ✅ Amount: ₹500 | Merchant: Zomato
```

**Checklist**:
- [ ] WhatsApp webhook route imports parser
- [ ] Message text is passed to `parseTransaction()`
- [ ] Parsed data is stored in Supabase
- [ ] User is created if doesn't exist
- [ ] Server logs show successful parse
- [ ] Transaction appears in Supabase table

---

### **Thursday - User Authentication (4-5 hours)**

#### Task 4.1: OTP Authentication Endpoint (3 hours)

**What**: Create signup/login flow with phone OTP

**Create `backend/routes/auth.js`**:

```javascript
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const plugin = async (fastify, options) => {
  /**
   * POST /auth/signup
   * Request body: { phone: string, name?: string }
   * Response: { message: string, sessionId?: string }
   */
  fastify.post('/auth/signup', async (request, reply) => {
    const { phone, name } = request.body;

    // Validate phone
    if (!phone || !phone.match(/^[0-9]{10,15}$/)) {
      return reply.code(400).send({ error: 'Invalid phone number' });
    }

    try {
      // Check if user exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .single();

      if (existing) {
        // User exists, send OTP for login
        console.log(`👤 User ${phone} already exists. Sending OTP...`);
      } else {
        // New user
        console.log(`✨ New signup: ${phone}`);
      }

      // TODO: Send OTP via MSG91 (Week 2)
      // For now, just acknowledge
      return reply.send({
        message: 'OTP sent to your phone',
        sessionId: `session_${Date.now()}`,
        // In production, don't return OTP; this is for testing only:
        otp: '123456' // REMOVE IN PRODUCTION
      });
    } catch (error) {
      console.error('❌ Signup error:', error);
      return reply.code(500).send({ error: 'Server error' });
    }
  });

  /**
   * POST /auth/verify
   * Request body: { phone: string, otp: string }
   * Response: { token: string, user: {...} }
   */
  fastify.post('/auth/verify', async (request, reply) => {
    const { phone, otp } = request.body;

    if (!phone || !otp) {
      return reply.code(400).send({ error: 'Missing phone or OTP' });
    }

    try {
      // TODO: Verify OTP with MSG91 (Week 2)
      // For now, accept any OTP
      if (otp !== '123456' && otp.length < 6) {
        return reply.code(400).send({ error: 'Invalid OTP' });
      }

      // Get or create user
      let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (!user) {
        // Create user on first OTP verification
        const { data: newUser, error } = await supabase
          .from('users')
          .insert([{
            phone,
            whatsapp_number: phone,
            name: `User_${phone.slice(-4)}`,
            plan: 'free'
          }])
          .select('*')
          .single();

        if (error) throw error;
        user = newUser;
        console.log(`✅ Created new user: ${user.id}`);
      } else {
        console.log(`✅ Authenticated user: ${user.id}`);
      }

      // Generate JWT token
      const token = fastify.jwt.sign({ userId: user.id, phone: user.phone });

      return reply.send({
        success: true,
        token,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          plan: user.plan
        }
      });
    } catch (error) {
      console.error('❌ Verify error:', error);
      return reply.code(500).send({ error: 'Server error' });
    }
  });

  /**
   * GET /auth/profile
   * Returns current user profile (requires JWT)
   */
  fastify.get('/auth/profile', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user;

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send(user);
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
};

module.exports = plugin;
```

**Update `backend/index.js`** to add JWT and auth routes:

```javascript
const fastify = require('fastify');
const cors = require('fastify-cors');
const jwt = require('@fastify/jwt');
require('dotenv').config();

const app = fastify({ logger: true });

app.register(cors);
app.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod' });

const authRoutes = require('./routes/auth.js');
const whatsappWebhook = require('./routes/whatsapp-webhook.js');

const start = async () => {
  try {
    app.register(authRoutes);
    app.register(whatsappWebhook);

    await app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    console.log(`✅ Server running on http://localhost:${process.env.PORT || 3000}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
```

**Install JWT**:
```bash
npm install @fastify/jwt
```

**Test with curl**:
```bash
# Signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "name": "Test User"}'

# Verify OTP (use returned OTP or "123456")
curl -X POST http://localhost:3000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "123456"}'

# Should return: { success: true, token: "...", user: {...} }

# Get profile
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <your-token>"
```

**Checklist**:
- [ ] `@fastify/jwt` installed
- [ ] `/auth/signup` endpoint works
- [ ] `/auth/verify` endpoint works
- [ ] JWT token generated on verify
- [ ] `/auth/profile` requires valid JWT
- [ ] Test curl commands work as expected

---

#### Task 4.2: Environment Setup (1-2 hours)

**What**: Finalize `.env` and deploy updated backend

1. **Update `.env`**:
   ```
   PORT=3000
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=eyJhbGc...
   JWT_SECRET=your-super-secret-key-change-this
   META_VERIFY_TOKEN=a1b2c3d4e5f6g7h8
   META_BUSINESS_ACCOUNT_ID=xxx
   GEMINI_API_KEY=
   MSG91_AUTH_KEY=
   RAZORPAY_KEY_ID=
   RAZORPAY_KEY_SECRET=
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod --env SUPABASE_URL=xxx --env SUPABASE_KEY=xxx --env JWT_SECRET=xxx
   ```

3. **Update .env in Vercel**:
   - Go to Vercel dashboard → Project → Settings → Environment Variables
   - Add all environment variables here

**Checklist**:
- [ ] All env vars set locally
- [ ] Backend redeployed
- [ ] Auth endpoints work on deployed URL

---

### **Friday - Testing & Beta User Onboarding (4-5 hours)**

#### Task 5.1: Manual Testing (2 hours)

**What**: Test the full flow end-to-end

**Checklist**:

1. **Signup Flow**:
   - [ ] User can signup with phone number
   - [ ] OTP is "accepted" (we'll integrate real OTP later)
   - [ ] JWT token is returned
   - [ ] Token can be used to access `/auth/profile`

2. **WhatsApp Message → Parse → Store**:
   - [ ] Send real UPI notification to WhatsApp sandbox
   - [ ] Check server logs for "✅ Stored transaction"
   - [ ] Verify transaction appears in Supabase `transactions` table
   - [ ] Amount, merchant, ref are correctly parsed

3. **Database**:
   - [ ] `users` table has your test user
   - [ ] `transactions` table has 3+ test transactions
   - [ ] All data looks correct

**Test Transactions to Send**:
   - From Google Pay: "Rs. 500 paid to Zomato via GPay on 21-Feb-2026..."
   - From PhonePe: "Payment of Rs.1,250 to Swiggy is successful..."
   - From Paytm: "You have paid Rs.1500 to Amazon..."

---

#### Task 5.2: Prepare for Beta Testing (2-3 hours)

**What**: Document setup instructions for 10 beta testers

**Create `BETA_TESTING.md`** in root:

```markdown
# UpiSense MVP - Beta Testing Guide

## Who Should Join?
- Friends, colleagues, or online community members
- Comfortable with technical setup
- Active UPI users (make 3+ payments per day)
- Can provide feedback

## How to Get Started

### 1. Sign Up
- Visit: `https://your-app.vercel.app/signup` (coming next week)
- Enter phone number + name
- Receive OTP (check spam folder)
- Verify OTP → Get dashboard access

### 2. Enable Forwarding
- Save our WhatsApp contact: `+1-201-555-0123` (sandbox number)
- Forward any UPI notification to us
- Dashboard updates within 10 seconds
- You'll see transactions categorized automatically

### 3. Share Feedback
- **Form**: (Coming in Week 2)
- **WhatsApp**: Reply with any issues
- **Email**: (Coming in Week 2)

## Known Limitations (Week 1)
- ❌ Dashboard not live yet (coming Week 3)
- ❌ Some transaction formats may not parse (we'll improve)
- ❌ P2P payments not categorized yet (coming Week 2)
- ⚠️  Categories manually assigned for now

## What to Test
1. Forward 5-10 transactions
2. Check if they parse correctly
3. Report any parsing failures with full message text

## Thank You!
You're helping us build the future of expense tracking.
```

**Create onboarding email template**:

```
Subject: Welcome to UpiSense MVP Beta! 🚀

Hi [NAME],

Thanks for joining our beta testing program! We're excited to get your feedback on UpiSense.

✨ What is UpiSense?
A WhatsApp-based expense tracker that automatically categorizes your UPI transactions. Zero app installs, zero friction.

🚀 Getting Started:
1. Sign up: https://your-app.vercel.app/signup
2. Forward UPI notifications to: +1-201-555-0123
3. Check the dashboard for your transactions (coming next week)

📋 Help Us Test:
- Forward at least 5 UPI notifications this week
- Reply with any parsing issues
- Share feedback on what you'd like to see

Questions? Reply to this email.

Thanks,
[YOUR NAME]
UpiSense Team
```

**Checklist**:
- [ ] Beta testing guide created
- [ ] Onboarding email template prepared
- [ ] List of 10 beta testers (name + phone + email)
- [ ] Can send email to first beta testers

---

### **Saturday & Sunday - Debugging & Iteration (3-4 hours)**

#### Task 6.1: Collect Real Transaction Samples (1-2 hours)

**What**: Get feedback from beta testers, fix regex patterns

1. **Send invites to 5-10 beta testers** (start small)
2. **Collect their UPI notifications**:
   - Ask them to forward any payment notification
   - Save all messages in a spreadsheet
   - Note which ones parsed correctly vs failed

3. **Improve regex patterns** based on real data:
   - Update `/lib/parsers/regexTemplates.js`
   - Add new patterns for banks we missed
   - Redeploy to Vercel

**Template for collecting feedback**:
```
Hi [User]!

Can you help test UpiSense? 

Steps:
1. Forward 5 UPI notifications to +1-201-555-0123
2. Tell me which ones worked vs failed
3. If any failed, send me the full message text

Example notifications:
- Bank payment confirmations
- UPI payment receipts
- Merchant payment status

Thanks! 🙏
```

**Checklist**:
- [ ] 5-10 beta testers invited
- [ ] Collected 3+ sample transactions from each
- [ ] All sample transactions tested locally
- [ ] Regex patterns updated based on failures
- [ ] Backend redeployed with fixes

---

#### Task 6.2: System Stability Check (1-2 hours)

**What**: Ensure everything is production-ready

1. **Check logs**:
   ```bash
   vercel logs [your-app] --follow
   ```
   - Look for any errors in console
   - Fix any bugs before Monday

2. **Database health**:
   - Check Supabase dashboard
   - Verify no duplicate transactions
   - Check data integrity

3. **Deployment**:
   - [ ] Backend deployed to Vercel
   - [ ] All env vars configured
   - [ ] WhatsApp webhook active and verified
   - [ ] No errors in production logs

4. **Documentation**:
   - [ ] `.env` file documented (what each var does)
   - [ ] Deployment instructions written
   - [ ] Regex patterns documented
   - [ ] Database schema documented

**Checklist**:
- [ ] Zero errors in production logs
- [ ] All 10 beta testers can use the system
- [ ] Transactions are storing correctly
- [ ] Parsing success rate >75%
- [ ] System is stable for 24+ hours

---

## 📊 Week 1 Success Criteria

By end of Friday, you should have:

| Deliverable | Status |
|---|---|
| WhatsApp bot receiving messages | ✅ |
| Regex parser working (>75% success) | ✅ |
| Transactions stored in PostgreSQL | ✅ |
| User authentication with phone OTP | ✅ |
| Backend deployed to Vercel | ✅ |
| 10 beta testers can send messages | ✅ |
| Basic error handling & logging | ✅ |

**Success Metrics**:
- ✅ 0 critical bugs in production
- ✅ >80% of test transactions parse correctly
- ✅ <5 second response time
- ✅ All 10 beta testers successfully onboarded

---

## 🎯 Next Steps (Week 2)

Once Week 1 is complete, you'll move to:
- **LLM fallback** for complex merchants
- **Merchant memory** learning
- **Smart categorization**
- **P2P transaction handling**

**Prep for Week 2**:
- [ ] Collect 50+ real transaction samples
- [ ] Identify patterns LLM needs to handle
- [ ] Set up Google Gemini free API key
- [ ] Plan categorization logic

---

## 💡 Tips for Success

1. **Start early, test continuously**: Don't wait until end of week to test
2. **Document as you go**: It'll save time later
3. **Keep beta testers updated**: They're your best feedback source
4. **Deploy incrementally**: Don't wait to deploy until Friday
5. **Prioritize**: If you get stuck, skip and come back (don't lose a day)

Good luck! 🚀

---

**Last Updated**: February 2026  
**Status**: Ready for Week 1 Development

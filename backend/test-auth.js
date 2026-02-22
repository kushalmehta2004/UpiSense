require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let token = null;

async function testAuthFlow() {
  console.log('🔐 Testing Authentication Flow\n');

  try {
    // Step 1: Signup
    console.log('═'.repeat(60));
    console.log('Step 1: SIGNUP');
    console.log('═'.repeat(60));
    
    const signupRes = await axios.post(`${BASE_URL}/auth/signup`, {
      phone: '919876543220',
      name: 'Test User'
    });

    console.log('✅ Signup Response:');
    console.log(`   Message: ${signupRes.data.message}`);
    console.log(`   OTP (dev): ${signupRes.data.otp}`);
    console.log(`   SessionId: ${signupRes.data.sessionId}\n`);

    // Step 2: Verify OTP
    console.log('═'.repeat(60));
    console.log('Step 2: VERIFY OTP');
    console.log('═'.repeat(60));

    const verifyRes = await axios.post(`${BASE_URL}/auth/verify`, {
      phone: '919876543220',
      otp: signupRes.data.otp
    });

    console.log('✅ Verify Response:');
    console.log(`   Success: ${verifyRes.data.success}`);
    console.log(`   User ID: ${verifyRes.data.user.id}`);
    console.log(`   User Phone: ${verifyRes.data.user.phone}`);
    console.log(`   User Name: ${verifyRes.data.user.name}`);
    console.log(`   Plan: ${verifyRes.data.user.plan}`);
    console.log(`   Token: ${verifyRes.data.token.substring(0, 30)}...\n`);

    token = verifyRes.data.token;

    // Step 3: Get Profile (with JWT)
    console.log('═'.repeat(60));
    console.log('Step 3: GET PROFILE (Protected)');
    console.log('═'.repeat(60));

    const profileRes = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ Profile Response:');
    console.log(`   ID: ${profileRes.data.user.id}`);
    console.log(`   Phone: ${profileRes.data.user.phone}`);
    console.log(`   Name: ${profileRes.data.user.name}`);
    console.log(`   Plan: ${profileRes.data.user.plan}`);
    console.log(`   Created: ${profileRes.data.user.created_at}\n`);

    // Step 4: Verify Token
    console.log('═'.repeat(60));
    console.log('Step 4: VERIFY TOKEN');
    console.log('═'.repeat(60));

    const verifyTokenRes = await axios.get(`${BASE_URL}/auth/verify-token`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ Token is valid:', verifyTokenRes.data.valid, '\n');

    // Step 5: Test invalid token
    console.log('═'.repeat(60));
    console.log('Step 5: TEST INVALID TOKEN');
    console.log('═'.repeat(60));

    try {
      await axios.get(`${BASE_URL}/auth/profile`, {
        headers: {
          Authorization: 'Bearer invalid_token_xyz'
        }
      });
    } catch (error) {
      console.log('✅ Invalid token rejected as expected');
      console.log(`   Error: ${error.response.data.error}\n`);
    }

    // Step 6: Test missing token
    console.log('═'.repeat(60));
    console.log('Step 6: TEST MISSING TOKEN');
    console.log('═'.repeat(60));

    try {
      await axios.get(`${BASE_URL}/auth/profile`);
    } catch (error) {
      console.log('✅ Missing token rejected as expected');
      console.log(`   Error: ${error.response.data.error}\n`);
    }

    // Step 7: Logout
    console.log('═'.repeat(60));
    console.log('Step 7: LOGOUT');
    console.log('═'.repeat(60));

    const logoutRes = await axios.post(`${BASE_URL}/auth/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ Logout Response:');
    console.log(`   Success: ${logoutRes.data.success}`);
    console.log(`   Message: ${logoutRes.data.message}\n`);

    console.log('═'.repeat(60));
    console.log('✨ All authentication tests passed!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAuthFlow();

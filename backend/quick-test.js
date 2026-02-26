const axios = require('axios');

// Use the 6-digit OTP you received at the email you signed up with.
const OTP = process.env.TEST_OTP || '';

(async () => {
  if (!OTP) {
    console.log('Set TEST_OTP to the code from your email, e.g. TEST_OTP=847291 node quick-test.js');
    return;
  }
  try {
    const res = await axios.post('http://localhost:3000/auth/verify', {
      phone: '919876543219',
      email: 'your@email.com', // same email used at signup
      otp: OTP,
      name: 'Test User',
    });
    console.log('✅ Verify success:');
    console.log('Token:', res.data.token);
    console.log('User:', res.data.user);
  } catch (e) {
    console.error('❌ Error:', e.response?.data || e.message);
  }
})();

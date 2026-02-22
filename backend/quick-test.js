const axios = require('axios');

(async () => {
  try {
    const res = await axios.post('http://localhost:3000/auth/verify', {
      phone: '919876543219',
      otp: '123456'
    });
    console.log('✅ Verify success:');
    console.log('Token:', res.data.token);
    console.log('Token type:', typeof res.data.token);
    console.log('User:', res.data.user);
  } catch (e) {
    console.error('❌ Error:', e.response?.data || e.message);
  }
})();

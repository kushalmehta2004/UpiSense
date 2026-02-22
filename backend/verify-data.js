require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

(async () => {
  console.log('🔍 Verifying stored data...\n');

  const { data: users } = await supabase.from('users').select('*');
  const { data: txns } = await supabase.from('transactions').select('*');

  console.log(`👥 Total Users: ${users?.length || 0}`);
  if (users && users.length > 0) {
    console.log('Sample users:');
    users.slice(0, 3).forEach(u => {
      console.log(`   - ${u.phone} (${u.name})`);
    });
  }

  console.log(`\n💳 Total Transactions: ${txns?.length || 0}`);
  if (txns && txns.length > 0) {
    console.log('Sample transactions:');
    txns.slice(0, 5).forEach(t => {
      console.log(`   - ₹${t.amount} to ${t.merchant_name} (${t.source_app}, confidence: ${(t.confidence * 100).toFixed(0)}%)`);
    });
  }

  console.log('\n✨ Data verification complete!');
})();

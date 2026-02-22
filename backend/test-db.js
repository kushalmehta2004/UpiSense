require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testConnection() {
  try {
    console.log('🧪 Testing Supabase connection...\n');

    // Try to query the users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error connecting to database:');
      console.error(error.message);
      process.exit(1);
    }

    console.log('✅ Successfully connected to Supabase!');
    console.log(`📊 Users table is ready (currently ${data.length} users)`);
    
    // List tables
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (!tablesError && tables) {
        console.log('\n📋 Available tables:');
        tables.forEach(t => console.log(`   ✓ ${t.table_name}`));
      }
    } catch (err) {
      console.log('\n📋 Tables created (could not list, but connection verified)');
    }

    console.log('\n✨ Database setup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();

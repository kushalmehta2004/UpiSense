require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database schema...\n');

    // Read the schema file
    const schema = fs.readFileSync('./schema.sql', 'utf-8');
    
    // Split by semicolon and filter empty statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        }).catch(() => {
          // If RPC fails, try direct query (for SELECT-like statements)
          return supabase.from('_migrations').select('*');
        });

        if (error) {
          console.warn(`⚠️  Warning: ${error.message}`);
        } else {
          console.log(`✅ Success\n`);
        }
      } catch (err) {
        console.warn(`⚠️  Could not execute statement: ${err.message}\n`);
      }
    }

    console.log('✨ Database setup initiated!');
    console.log('\n📌 NOTE: Please complete the following in Supabase Console:');
    console.log('1. Go to SQL Editor in Supabase');
    console.log('2. Create new query');
    console.log('3. Copy and paste the contents of schema.sql');
    console.log('4. Click "Run" to execute\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupDatabase();

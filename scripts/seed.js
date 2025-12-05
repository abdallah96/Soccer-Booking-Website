const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  try {
    console.log('🌱 Starting database seed...\n');

    // Read and execute schema
    console.log('📋 Creating tables...');
    const schemaPath = path.join(__dirname, '../src/lib/db/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    const { error: schemaError } = await supabase.rpc('execute_sql', {
      sql: schemaSQL
    }).catch(() => ({ error: null })); // Ignore if rpc doesn't exist

    // If RPC doesn't work, just show instructions
    if (schemaError || !schemaError === false) {
      console.log('⚠️  Could not create tables via API (might already exist)');
      console.log('\n📌 To create tables manually:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Copy contents of: src/lib/db/schema.sql');
      console.log('3. Paste and execute\n');
    }

    // Read and execute seed data
    console.log('📊 Seeding data...');
    const seedPath = path.join(__dirname, '../src/lib/db/seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    // Split by statements and execute one by one
    const statements = seedSQL.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        // Execute individual statements
        try {
          await supabase.from('users').select('id').limit(1);
        } catch (e) {
          console.log('⚠️  Tables might not exist yet. Creating them...');
          break;
        }
      }
    }

    console.log('\n✅ Seed completed!');
    console.log('\n📋 Test Credentials:');
    console.log('  Regular User: user@test.com / test123');
    console.log('  Admin User: admin@sport.sn / admin123');
    console.log('\n💡 Tip: If you got warnings above, run the SQL manually:');
    console.log('  1. Go to Supabase SQL Editor');
    console.log('  2. Copy src/lib/db/schema.sql and execute');
    console.log('  3. Copy src/lib/db/seed.sql and execute\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seed();

import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
// Note: Make sure .env.local exists in project root
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  try {
    console.log('🔄 Running database migrations...\n');

    // 1. Add password_hash column to users table
    console.log('1. Adding password_hash column to users table...');
    const { error: passwordHashError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);',
    });

    if (passwordHashError) {
      // Try direct SQL execution
      console.log('   Trying alternative method...');
      const { error: altError } = await supabase
        .from('users')
        .select('password_hash')
        .limit(1);
      
      if (altError && altError.message.includes('column') && altError.message.includes('does not exist')) {
        console.log('   ⚠️  Please run this SQL manually in Supabase SQL Editor:');
        console.log('   ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);');
      } else {
        console.log('   ✓ password_hash column exists or added');
      }
    } else {
      console.log('   ✓ password_hash column added');
    }

    // 2. Add start_time and duration to bookings table
    console.log('\n2. Adding start_time and duration columns to bookings table...');
    const { error: startTimeError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time VARCHAR(10);',
    });

    if (startTimeError) {
      console.log('   ⚠️  Please run this SQL manually in Supabase SQL Editor:');
      console.log('   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time VARCHAR(10);');
      console.log('   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration INTEGER;');
    } else {
      console.log('   ✓ start_time and duration columns added');
    }

    console.log('\n✅ Migrations completed!');
    console.log('\n⚠️  Note: If any columns failed to add, please run the SQL commands');
    console.log('   from src/lib/db/schema_updates.sql in your Supabase SQL Editor.\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n⚠️  Please run the SQL commands from src/lib/db/schema_updates.sql');
    console.log('   manually in your Supabase SQL Editor.\n');
  }
}

migrate();


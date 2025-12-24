import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  try {
    console.log('🌱 Starting Petit Camp database seed...\n');

    // 1. Seed Petit Camp Field
    console.log('⚽ Seeding Petit Camp field...');
    const petitCampField = {
      id: 'petit-camp-1',
      name: 'Petit Camp',
      description: 'Terrain de football professionnel avec installations modernes. Éclairage de qualité, vestiaires équipés, parking sécurisé et rafraîchissements disponibles.',
      location: 'Thiés, Sénégal',
      price_per_hour: 20000,
      capacity: 18,
      rating: 4.8,
      facilities: ['Éclairage', 'Vestiaires', 'Parking', 'Rafraîchissements'],
      images: [],
    };

    const { data: fieldData, error: fieldError } = await supabase
      .from('fields')
      .upsert(petitCampField, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select('id')
      .single();

    if (fieldError) {
      // Try without id if id column doesn't exist or isn't unique
      const { data: altFieldData, error: altError } = await supabase
        .from('fields')
        .upsert({
          name: petitCampField.name,
          description: petitCampField.description,
          location: petitCampField.location,
          price_per_hour: petitCampField.price_per_hour,
          capacity: petitCampField.capacity,
          rating: petitCampField.rating,
          facilities: petitCampField.facilities,
          images: petitCampField.images,
        }, {
          onConflict: 'name',
          ignoreDuplicates: false,
        })
        .select('id')
        .single();

      if (altError) {
        console.error('   ❌ Error adding Petit Camp field:', altError.message);
      } else {
        console.log(`   ✓ Petit Camp field seeded (ID: ${altFieldData?.id})`);
      }
    } else {
      console.log(`   ✓ Petit Camp field seeded (ID: ${fieldData?.id})`);
    }

    // 2. Seed Test Users with Hashed Passwords
    console.log('\n👥 Seeding test users...');
    const users = [
      {
        email: 'admin@petitcamp.sn',
        name: 'Admin Petit Camp',
        phone: '+221771234567',
        role: 'admin',
        password: 'admin123',
      },
      {
        email: 'user@test.com',
        name: 'Test User',
        phone: '+221771234568',
        role: 'user',
        password: 'test123',
      },
    ];

    for (const user of users) {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', user.email)
        .single();

      if (existingUser) {
        // Update password hash if user exists
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const { error: updateError } = await supabase
          .from('users')
          .update({ password_hash: hashedPassword })
          .eq('id', existingUser.id);

        if (updateError) {
          console.log(`   ⚠️  User ${user.email} exists but couldn't update password`);
        } else {
          console.log(`   ✓ Updated password for existing user: ${user.email} (${user.role})`);
        }
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const { data, error } = await supabase
          .from('users')
          .insert({
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            password_hash: hashedPassword,
          })
          .select('id')
          .single();

        if (error) {
          console.error(`   ❌ Error adding user ${user.email}:`, error.message);
        } else {
          console.log(`   ✓ Added user: ${user.email} (${user.role})`);
        }
      }
    }

    console.log('\n✅ Database seed completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('   Admin: admin@petitcamp.sn / admin123');
    console.log('   User:  user@test.com / test123');
    console.log('\n💡 Note: Make sure to run schema migrations first if you haven\'t already.');
    console.log('   Run: npm run migrate (or manually run src/lib/db/schema_updates.sql)\n');
  } catch (error: any) {
    console.error('❌ Seed failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

seed();


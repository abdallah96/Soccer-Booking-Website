#!/usr/bin/env ts-node

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

async function createSuperAdmin() {
  try {
    // Get arguments from command line or use defaults
    const args = process.argv.slice(2);
    
    let email: string;
    let name: string;
    let password: string;
    let phone: string | undefined;

    if (args.length >= 3) {
      // Use command line arguments: email name password [phone]
      email = args[0];
      name = args[1];
      password = args[2];
      phone = args[3];
    } else {
      // Use environment variables or prompt
      email = process.env.SUPER_ADMIN_EMAIL || '';
      name = process.env.SUPER_ADMIN_NAME || '';
      password = process.env.SUPER_ADMIN_PASSWORD || '';
      phone = process.env.SUPER_ADMIN_PHONE;

      if (!email || !name || !password) {
        console.error('❌ Missing required information');
        console.error('\nUsage:');
        console.error('  Method 1: Command line arguments');
        console.error('    npm run create-super-admin <email> <name> <password> [phone]');
        console.error('\n  Method 2: Environment variables (in .env.local)');
        console.error('    SUPER_ADMIN_EMAIL=your@email.com');
        console.error('    SUPER_ADMIN_NAME="Your Name"');
        console.error('    SUPER_ADMIN_PASSWORD=yourpassword');
        console.error('    SUPER_ADMIN_PHONE=+221771234567 (optional)');
        console.error('\n  Method 3: Interactive (if none provided)');
        process.exit(1);
      }
    }

    // Validate email format
    if (!email.includes('@')) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }

    // Validate password length
    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    console.log('👑 Creating Super Admin...\n');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name}`);
    if (phone) console.log(`📞 Phone: ${phone}`);
    console.log('');

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (existingUser) {
      // User exists - update to super_admin if not already
      if (existingUser.role === 'super_admin') {
        console.log('✅ User already exists and is already a Super Admin');
        console.log(`   User ID: ${existingUser.id}`);
        
        // Ask if they want to update password
        const updatePassword = args.includes('--update-password') || process.env.UPDATE_PASSWORD === 'true';
        
        if (updatePassword) {
          console.log('\n🔄 Updating password...');
          const hashedPassword = await bcrypt.hash(password, 10);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: hashedPassword })
            .eq('id', existingUser.id);

          if (updateError) {
            console.error('❌ Failed to update password:', updateError.message);
            process.exit(1);
          }
          
          console.log('✅ Password updated successfully');
        } else {
          console.log('\n💡 To update password, run with --update-password flag');
          console.log('   npm run create-super-admin <email> <name> <password> --update-password');
        }
        return;
      }

      // Update existing user to super_admin
      console.log(`🔄 User exists with role: ${existingUser.role}`);
      console.log('   Updating to Super Admin...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'super_admin',
          password_hash: hashedPassword,
          name: name,
          ...(phone && { phone: phone }),
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('❌ Failed to update user:', updateError.message);
        process.exit(1);
      }

      console.log('✅ User updated to Super Admin successfully!');
      console.log(`   User ID: ${existingUser.id}`);
      return;
    }

    // Create new super_admin
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email,
        name: name,
        password_hash: hashedPassword,
        role: 'super_admin',
        phone: phone || null,
      })
      .select('id, email, name, role, created_at')
      .single();

    if (createError) {
      console.error('❌ Failed to create Super Admin:', createError.message);
      console.error('   Make sure the migration has been run (super_admin role exists)');
      process.exit(1);
    }

    console.log('✅ Super Admin created successfully!\n');
    console.log('📋 User Details:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Name: ${newUser.name}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Created: ${new Date(newUser.created_at).toLocaleString()}`);
    console.log('\n💡 You can now login at /auth/login and change your password in Settings');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
createSuperAdmin();

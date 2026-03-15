#!/usr/bin/env ts-node
/**
 * Clean all app data (bookings, subscriptions, reviews, blocked slots, etc.)
 * Optionally keeps super_admin users so you can log in again.
 *
 * Usage:
 *   npm run clean-all-data              # Keep super_admins, delete everything else
 *   npm run clean-all-data -- --all-users   # Delete ALL users (including super_admins)
 *
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const deleteAll = process.argv.includes('--all-users');

async function clean() {
  console.log('🧹 Cleaning all data...\n');
  if (!deleteAll) {
    console.log('   Super_admin users will be KEPT. Use --all-users to delete them too.\n');
  } else {
    console.log('   ⚠️  ALL users will be deleted (including super_admins).\n');
  }

  const steps: { name: string; fn: () => Promise<void> }[] = [
    { name: 'Payments', fn: async () => { const { error } = await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000'); if (error) throw error; } },
    { name: 'Bookings', fn: async () => { const { error } = await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000'); if (error) throw error; } },
    { name: 'Subscriptions', fn: async () => { const { error } = await supabase.from('subscriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); if (error) throw error; } },
    { name: 'Reviews', fn: async () => { const { error } = await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000'); if (error) throw error; } },
    { name: 'Blocked slots', fn: async () => { const { error } = await supabase.from('blocked_slots').delete().neq('id', '00000000-0000-0000-0000-000000000000'); if (error) throw error; } },
    { name: 'Pricing rules', fn: async () => { const { error } = await supabase.from('pricing_rules').delete().neq('id', '00000000-0000-0000-0000-000000000000'); if (error) throw error; } },
    { name: 'Week availability', fn: async () => { const { error } = await supabase.from('week_availability').delete().neq('id', '00000000-0000-0000-0000-000000000000'); if (error) throw error; } },
  ];

  for (const step of steps) {
    try {
      await step.fn();
      console.log(`   ✓ ${step.name}`);
    } catch (e: any) {
      if (e?.code === '42P01') {
        console.log(`   ⊘ ${step.name} (table missing, skipped)`);
      } else {
        console.error(`   ✗ ${step.name}:`, e?.message || e);
      }
    }
  }

  // Users: delete all or only non–super_admin
  try {
    if (deleteAll) {
      const { error } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      console.log('   ✓ Users (all)');
    } else {
      const { error } = await supabase.from('users').delete().neq('role', 'super_admin');
      if (error) throw error;
      console.log('   ✓ Users (kept super_admins)');
    }
  } catch (e: any) {
    console.error('   ✗ Users:', e?.message || e);
  }

  console.log('\n✅ Clean finished.');
  if (!deleteAll) {
    console.log('   Create a super_admin with: npm run create-super-admin <email> <name> <password> [phone]');
  }
}

clean().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});

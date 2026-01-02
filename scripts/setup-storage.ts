/**
 * Setup script for Supabase Storage Bucket
 * 
 * This script helps create the storage bucket and set up policies
 * Run with: npx tsx scripts/setup-storage.ts
 * 
 * Note: You need SUPABASE_SERVICE_ROLE_KEY in your .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease add these to your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage for Petit Camp...\n');

  try {
    // Step 1: Check if bucket exists
    console.log('📦 Checking if bucket exists...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.id === 'field-images');

    if (bucketExists) {
      console.log('✅ Bucket "field-images" already exists');
      
      // Check if bucket is public
      const bucket = buckets?.find(b => b.id === 'field-images');
      if (bucket && !bucket.public) {
        console.log('⚠️  Bucket exists but is NOT public!');
        console.log('   Making bucket public...');
        
        // Try to update bucket to public
        const { error: updateError } = await supabase.storage.updateBucket('field-images', {
          public: true,
        });
        
        if (updateError) {
          console.error('❌ Could not make bucket public:', updateError.message);
          console.error('\n💡 Please make the bucket public manually in Supabase Dashboard:');
          console.error('   1. Go to Storage > field-images');
          console.error('   2. Click "Settings"');
          console.error('   3. Toggle "Public bucket" to ON');
        } else {
          console.log('✅ Bucket is now public!');
        }
      } else if (bucket?.public) {
        console.log('✅ Bucket is public (images are accessible)');
      }
    } else {
      console.log('📦 Creating bucket "field-images"...');
      
      // Create the bucket
      const { data: bucket, error: createError } = await supabase.storage.createBucket('field-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB in bytes
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError.message);
        console.error('\n💡 You may need to create the bucket manually in Supabase Dashboard:');
        console.error('   1. Go to Storage > New bucket');
        console.error('   2. Name: field-images');
        console.error('   3. Make it PUBLIC (important!)');
        console.error('   4. File size limit: 5 MB');
        console.error('   5. Allowed MIME types: image/jpeg,image/jpg,image/png,image/webp');
        return;
      }

      console.log('✅ Bucket created successfully and is public!');
    }

    // Step 2: Set up policies
    console.log('\n🔒 Setting up storage policies...');
    
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'src/lib/db/storage_setup.sql');
    let sqlContent: string;
    
    try {
      sqlContent = readFileSync(sqlPath, 'utf-8');
    } catch (error) {
      console.error('❌ Could not read storage_setup.sql file');
      console.error('   Please run the SQL script manually in Supabase SQL Editor');
      return;
    }

    // Extract only the CREATE POLICY statements
    const policyStatements = sqlContent
      .split('-- ============================================')
      .filter(section => section.includes('CREATE POLICY'))
      .map(section => {
        const match = section.match(/CREATE POLICY[^;]+;/);
        return match ? match[0] : null;
      })
      .filter(Boolean) as string[];

    if (policyStatements.length === 0) {
      console.log('⚠️  No policy statements found in SQL file');
      console.log('   Please run the SQL script manually in Supabase SQL Editor');
      return;
    }

    console.log(`   Found ${policyStatements.length} policies to create`);
    console.log('\n⚠️  Note: Policies need to be created via SQL Editor in Supabase Dashboard');
    console.log('   Please run the SQL from: src/lib/db/storage_setup.sql');
    console.log('   Or copy the following policies:\n');

    policyStatements.forEach((policy, index) => {
      console.log(`   Policy ${index + 1}:`);
      console.log(`   ${policy}\n`);
    });

    console.log('✅ Storage setup instructions provided');
    console.log('\n📝 Next steps:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and run the SQL from: src/lib/db/storage_setup.sql');
    console.log('   3. Or use the policies shown above');
    console.log('\n✨ Setup complete!');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupStorage();


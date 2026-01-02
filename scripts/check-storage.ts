/**
 * Quick script to check if storage bucket exists and is configured correctly
 * Run with: npx tsx scripts/check-storage.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkStorage() {
  console.log('🔍 Checking Supabase Storage configuration...\n');

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }

    const bucket = buckets?.find(b => b.id === 'field-images');

    if (!bucket) {
      console.log('❌ Bucket "field-images" does NOT exist!\n');
      console.log('📝 To fix this:');
      console.log('   1. Run: npx tsx scripts/setup-storage.ts');
      console.log('   2. Or create manually in Supabase Dashboard > Storage');
      console.log('   3. Name: field-images');
      console.log('   4. Make it PUBLIC ✅');
      return;
    }

    console.log('✅ Bucket "field-images" exists');

    // Check if public
    if (!bucket.public) {
      console.log('❌ Bucket is NOT public! Images won\'t be accessible.\n');
      console.log('📝 To fix this:');
      console.log('   1. Go to Supabase Dashboard > Storage > field-images');
      console.log('   2. Click "Settings"');
      console.log('   3. Toggle "Public bucket" to ON ✅');
      return;
    }

    console.log('✅ Bucket is PUBLIC (images are accessible)');

    // Check file size limit
    if (bucket.file_size_limit) {
      const limitMB = bucket.file_size_limit / (1024 * 1024);
      console.log(`✅ File size limit: ${limitMB} MB`);
    }

    // Check allowed MIME types
    if (bucket.allowed_mime_types && bucket.allowed_mime_types.length > 0) {
      console.log(`✅ Allowed MIME types: ${bucket.allowed_mime_types.join(', ')}`);
    }

    // Try to list files (test access)
    const { data: files, error: listFilesError } = await supabase.storage
      .from('field-images')
      .list('field-images', { limit: 1 });

    if (listFilesError) {
      console.log('⚠️  Could not list files:', listFilesError.message);
    } else {
      const fileCount = files?.length || 0;
      console.log(`✅ Can access bucket (${fileCount} file(s) found)`);
    }

    console.log('\n✨ Storage is configured correctly!');

  } catch (error) {
    console.error('❌ Error checking storage:', error);
    process.exit(1);
  }
}

checkStorage();


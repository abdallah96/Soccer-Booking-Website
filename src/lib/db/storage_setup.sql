-- ============================================
-- Petit Camp - Supabase Storage Setup
-- Storage Bucket Policies for Image Uploads
-- ============================================
-- 
-- IMPORTANT: Before running this script, you MUST create the storage bucket manually:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: "field-images"
-- 4. Make it PUBLIC
-- 5. File size limit: 5 MB (or your preference)
-- 6. Allowed MIME types: image/jpeg,image/jpg,image/png,image/webp
-- 
-- Then run this script to set up the policies.
-- ============================================

-- ============================================
-- STEP 1: Enable Storage Policies (if not already enabled)
-- ============================================

-- Note: Storage policies are managed differently than table RLS
-- These policies control access to the storage.objects table

-- ============================================
-- STEP 2: Policy for Authenticated Upload
-- Allows authenticated users (admins) to upload images
-- ============================================

-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Authenticated users can upload field images" ON storage.objects;

CREATE POLICY "Authenticated users can upload field images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'field-images' AND
  (storage.foldername(name))[1] = 'field-images'
);

-- ============================================
-- STEP 3: Policy for Authenticated Update
-- Allows authenticated users to update their uploaded images
-- ============================================

-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Authenticated users can update field images" ON storage.objects;

CREATE POLICY "Authenticated users can update field images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'field-images' AND
  (storage.foldername(name))[1] = 'field-images'
);

-- ============================================
-- STEP 4: Policy for Authenticated Delete
-- Allows authenticated users to delete images
-- ============================================

-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Authenticated users can delete field images" ON storage.objects;

CREATE POLICY "Authenticated users can delete field images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'field-images' AND
  (storage.foldername(name))[1] = 'field-images'
);

-- ============================================
-- Verification Queries (run these to check setup)
-- ============================================

-- Check if bucket exists (run in Supabase SQL Editor)
-- SELECT * FROM storage.buckets WHERE id = 'field-images';

-- Check policies (run in Supabase SQL Editor)
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================
-- Notes:
-- ============================================
-- IMPORTANT: Public buckets don't need SELECT policies!
-- Public buckets allow public read access by default.
-- RLS policies are still required for INSERT, UPDATE, and DELETE operations.
--
-- 1. The bucket must be created manually in Supabase Dashboard
-- 2. Make sure the bucket is PUBLIC for public image access
--    - Public buckets allow anyone to read/view images WITHOUT policies
--    - RLS policies are still required for uploads and deletes
-- 3. File size limit should be set to 5MB in bucket settings
-- 4. Allowed MIME types should include: image/jpeg, image/jpg, image/png, image/webp
-- 5. These policies allow:
--    - Anyone to read/view images (automatic with public bucket, no policy needed)
--    - Authenticated users to upload/update/delete images (via these policies)
-- ============================================


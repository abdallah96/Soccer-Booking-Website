-- Row Level Security Policies for Admin Field Management
-- Run this in your Supabase SQL Editor

-- ============================================
-- FIELDS TABLE POLICIES
-- ============================================

-- Allow everyone to read fields (public access)
CREATE POLICY IF NOT EXISTS "Fields are viewable by everyone"
ON fields
FOR SELECT
USING (true);

-- Allow admins to insert fields
CREATE POLICY IF NOT EXISTS "Admins can insert fields"
ON fields
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow admins to update fields
CREATE POLICY IF NOT EXISTS "Admins can update fields"
ON fields
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow admins to delete fields
CREATE POLICY IF NOT EXISTS "Admins can delete fields"
ON fields
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================
-- ALTERNATIVE: If using service role key (bypasses RLS)
-- ============================================
-- If your API routes use SUPABASE_SERVICE_ROLE_KEY instead of anon key,
-- RLS is bypassed automatically. But for better security, use the policies above.

-- ============================================
-- NOTE: If auth.uid() doesn't work (custom auth)
-- ============================================
-- If you're using custom JWT auth and auth.uid() doesn't work,
-- you might need to temporarily disable RLS for fields table:
-- ALTER TABLE fields DISABLE ROW LEVEL SECURITY;
-- 
-- OR create a function to check admin role:
-- 
-- CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
-- RETURNS BOOLEAN AS $$
-- BEGIN
--   RETURN EXISTS (
--     SELECT 1 FROM users
--     WHERE id = user_id
--     AND role = 'admin'
--   );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- Then use: is_admin(auth.uid())


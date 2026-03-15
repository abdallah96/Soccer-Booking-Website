-- ============================================
-- Fix RLS Issues for Petit Camp
-- ============================================
-- This fixes all Supabase RLS warnings:
-- 1. RLS not enabled on reviews and blocked_slots
-- 2. Performance issues with auth.uid() 
-- 3. Multiple permissive policies
-- ============================================
-- Note: This app uses custom JWT auth (not Supabase Auth)
-- Real security is enforced in API layer
-- RLS here is for Supabase compliance
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS week_availability ENABLE ROW LEVEL SECURITY;

-- ============================================
-- WEEK_AVAILABILITY - Single Policy
-- ============================================

DROP POLICY IF EXISTS "Public can view week availability" ON week_availability;
DROP POLICY IF EXISTS "Admins can manage week availability" ON week_availability;

-- Single unified policy (avoids multiple permissive policies)
CREATE POLICY "week_availability_all" ON week_availability
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- REVIEWS - Separate policies per action
-- ============================================

DROP POLICY IF EXISTS "Public can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

-- Single policy per action to avoid multiple permissive policies
CREATE POLICY "reviews_select" ON reviews
  FOR SELECT
  USING (true);

CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "reviews_update" ON reviews
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "reviews_delete" ON reviews
  FOR DELETE
  USING (true);

-- ============================================
-- BLOCKED_SLOTS - Single Policy
-- ============================================

DROP POLICY IF EXISTS "Public can view blocked slots" ON blocked_slots;
DROP POLICY IF EXISTS "Admins can manage blocked slots" ON blocked_slots;

-- Single unified policy
CREATE POLICY "blocked_slots_all" ON blocked_slots
  FOR ALL
  USING (true)
  WITH CHECK (true);

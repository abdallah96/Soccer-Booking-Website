-- ============================================
-- Migration: Admin Reply to Reviews
-- Date: 2026-01-18
-- Description: Adds admin reply functionality to reviews table
-- ============================================

-- 1. Add admin_reply column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_reply TEXT;

-- 2. Add admin_id column to track which admin replied
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES users(id);

-- 3. Add admin_replied_at timestamp
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_replied_at TIMESTAMP;

-- 4. Create index on admin_id for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_admin_id ON reviews(admin_id);

-- 5. Create index on admin_replied_at for sorting
CREATE INDEX IF NOT EXISTS idx_reviews_admin_replied_at ON reviews(admin_replied_at);

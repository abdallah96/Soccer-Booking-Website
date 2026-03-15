-- ============================================
-- Migration: Payment Timer + Cancellation Reason
-- Date: 2026-03-15
-- Description:
--   1. Adds payment_expires_at to bookings (30-min payment window)
--   2. Adds cancellation_reason to bookings (admin can set motif)
--   3. Adds cancelled_by to track who cancelled (admin|user|system)
-- ============================================

-- 1. Payment expiry timestamp (set when booking is created with pending_payment)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP;

-- 2. Cancellation reason (visible to client)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 3. Who cancelled: 'user', 'admin', 'system' (expired timer)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20)
  CHECK (cancelled_by IN ('user', 'admin', 'system'));

-- 4. Set payment_expires_at for any existing pending_payment bookings (30 min from creation)
UPDATE bookings
SET payment_expires_at = created_at + INTERVAL '30 minutes'
WHERE status = 'pending_payment' AND payment_expires_at IS NULL;

-- 5. Index for efficient timer queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_expires_at ON bookings(payment_expires_at)
  WHERE status = 'pending_payment';

-- ============================================
-- Migration: Booking Payment Status & Pending Payment + Super Admin Role
-- Date: 2026-01-18
-- Description: 
--   1. Adds pending_payment status and payment tracking fields to bookings
--   2. Adds super_admin role for CEO/owner who manages all admins
-- ============================================

-- ============================================
-- PART 1: Super Admin Role Support
-- ============================================

-- 1. Drop the old CHECK constraint on users.role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Add new CHECK constraint to include 'super_admin' role
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- ============================================
-- PART 2: Booking Payment Status & Pending Payment
-- ============================================

-- 1. Drop the old CHECK constraint on bookings.status
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- 2. Add new CHECK constraint to include 'pending_payment' status
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'cancelled'));

-- 3. Add payment_status column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid' 
  CHECK (payment_status IN ('unpaid', 'partial', 'paid'));

-- 4. Add payment_date column to bookings table (nullable, set when payment is received)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;

-- 5. Update existing bookings to have 'unpaid' payment_status if null
UPDATE bookings SET payment_status = 'unpaid' WHERE payment_status IS NULL;

-- 6. Update existing confirmed bookings to have 'paid' payment_status
UPDATE bookings 
SET payment_status = 'paid', 
    payment_date = COALESCE(payment_date, updated_at)
WHERE status = 'confirmed' AND payment_status = 'unpaid';

-- 7. Create index on payment_status for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- 8. Create index on payment_date for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_payment_date ON bookings(payment_date);

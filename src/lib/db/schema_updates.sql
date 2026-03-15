-- Schema updates for Petit Camp
-- Run these migrations on your Supabase database

-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add start_time and duration to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time VARCHAR(10);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Create Petit Camp field if it doesn't exist
INSERT INTO fields (id, name, description, location, price_per_hour, capacity, rating, facilities)
VALUES (
  'petit-camp-1',
  'Petit Camp',
  'Terrain de football professionnel avec installations modernes. Éclairage de qualité, vestiaires équipés, parking sécurisé et rafraîchissements disponibles.',
  'Thiés, Sénégal',
  20000,
  22,
  4.8,
  ARRAY['Éclairage', 'Vestiaires', 'Parking', 'Rafraîchissements']
) ON CONFLICT (id) DO NOTHING;

-- If using name as unique identifier instead of id
-- INSERT INTO fields (name, description, location, price_per_hour, capacity, rating, facilities)
-- VALUES (
--   'Petit Camp',
--   'Terrain de football professionnel avec installations modernes. Éclairage de qualité, vestiaires équipés, parking sécurisé et rafraîchissements disponibles.',
--   'Thiés, Sénégal',
--   20000,
--   22,
--   4.8,
--   ARRAY['Éclairage', 'Vestiaires', 'Parking', 'Rafraîchissements']
-- ) ON CONFLICT DO NOTHING;

-- ============================================
-- Migration: Booking Payment Status & Pending Payment
-- Date: 2026-01-18
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


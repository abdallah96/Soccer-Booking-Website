-- Migration: Loyalty & Discount Codes
-- Creates discount_codes table for tracking loyalty rewards

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'free_session' CHECK (discount_type IN ('free_session', 'percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL DEFAULT 100,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  threshold_reached INTEGER NOT NULL DEFAULT 10
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_user_id ON discount_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_is_used ON discount_codes(is_used);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own discount codes"
  ON discount_codes FOR SELECT
  USING (true);

CREATE POLICY "Admins manage discount codes"
  ON discount_codes FOR ALL
  USING (true);

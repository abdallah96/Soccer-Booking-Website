-- ============================================
-- Migration: Subscriptions + Flexible Pricing Rules
-- Date: 2026-03-15
-- ============================================

-- ── FLEXIBLE PRICING RULES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,               -- e.g. "Tarif week-end", "Tarif soirée"
  day_type VARCHAR(20) NOT NULL             -- 'weekday', 'weekend', 'all'
    CHECK (day_type IN ('weekday', 'weekend', 'all')),
  hour_start INTEGER NOT NULL CHECK (hour_start >= 0 AND hour_start <= 23),
  hour_end INTEGER NOT NULL CHECK (hour_end >= 0 AND hour_end <= 23),
  price_per_hour DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_field_id ON pricing_rules(field_id);
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pricing rules" ON pricing_rules FOR ALL USING (true);

-- ── SUBSCRIPTIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sun,1=Mon...
  start_time VARCHAR(5) NOT NULL,           -- e.g. '19:00'
  duration INTEGER NOT NULL DEFAULT 60 CHECK (duration IN (60, 90)),
  payment_method VARCHAR(20) NOT NULL DEFAULT 'wave',
  discount_percent INTEGER NOT NULL DEFAULT 10 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE,                            -- NULL = ongoing
  next_booking_date DATE,                   -- date of next auto-created booking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_field_id ON subscriptions(field_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_booking_date ON subscriptions(next_booking_date);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage subscriptions" ON subscriptions FOR ALL USING (true);

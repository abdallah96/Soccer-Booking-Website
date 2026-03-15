-- Blocked Slots table (for admin to block specific times)
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  full_day BOOLEAN DEFAULT false,
  reason VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table (Google-style reviews)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(field_id, user_id) -- One review per user per field
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blocked_slots_field_id ON blocked_slots(field_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(date);
CREATE INDEX IF NOT EXISTS idx_reviews_field_id ON reviews(field_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Enable Row Level Security
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for blocked_slots
-- Note: Real auth is handled in API layer with service role
DROP POLICY IF EXISTS "Public can view blocked slots" ON blocked_slots;
DROP POLICY IF EXISTS "Admins can manage blocked slots" ON blocked_slots;

CREATE POLICY "blocked_slots_all" ON blocked_slots
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies for reviews
-- Note: Real auth is handled in API layer
DROP POLICY IF EXISTS "Public can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

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

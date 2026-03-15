-- Week Availability table (simpler than blocking individual slots)
CREATE TABLE IF NOT EXISTS week_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- Monday of the week
  is_open BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(field_id, week_start_date)
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_week_availability_field_id ON week_availability(field_id);
CREATE INDEX IF NOT EXISTS idx_week_availability_week_start ON week_availability(week_start_date);

-- Enable Row Level Security
ALTER TABLE week_availability ENABLE ROW LEVEL SECURITY;

-- Single unified policy (avoids multiple permissive policies)
-- Note: Real auth is handled in API layer with service role
DROP POLICY IF EXISTS "Public can view week availability" ON week_availability;
DROP POLICY IF EXISTS "Admins can manage week availability" ON week_availability;

CREATE POLICY "week_availability_all" ON week_availability
  FOR ALL
  USING (true)
  WITH CHECK (true);

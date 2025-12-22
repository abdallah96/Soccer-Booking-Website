-- ============================================
-- Petit Camp - Complete Database Setup
-- Safe to run multiple times - no errors!
-- ============================================

-- ============================================
-- STEP 1: Create Tables (if they don't exist)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  price_per_hour DECIMAL(10, 2) NOT NULL,
  capacity INTEGER NOT NULL,
  rating DECIMAL(3, 1) DEFAULT 0,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  facilities TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time VARCHAR(50) NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(field_id, date, time)
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_method VARCHAR(50) CHECK (payment_method IN ('wave', 'orange_money', 'cash')),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 2: Add Missing Columns Safely
-- ============================================

DO $$ 
BEGIN
  -- Add password_hash to users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
  END IF;

  -- Add start_time to bookings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bookings' 
    AND column_name = 'start_time'
  ) THEN
    ALTER TABLE bookings ADD COLUMN start_time VARCHAR(10);
  END IF;

  -- Add duration to bookings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bookings' 
    AND column_name = 'duration'
  ) THEN
    ALTER TABLE bookings ADD COLUMN duration INTEGER;
  END IF;
END $$;

-- ============================================
-- STEP 3: Add Unique Constraint to Fields Name (if needed)
-- ============================================

DO $$ 
BEGIN
  -- Check if unique constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fields_name_unique'
  ) THEN
    -- Check if there are duplicate names first
    IF NOT EXISTS (
      SELECT name FROM fields 
      GROUP BY name 
      HAVING COUNT(*) > 1
    ) THEN
      ALTER TABLE fields ADD CONSTRAINT fields_name_unique UNIQUE (name);
    END IF;
  END IF;
END $$;

-- ============================================
-- STEP 4: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_field_id ON bookings(field_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_time_slots_field_id ON time_slots(field_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);

-- ============================================
-- STEP 5: Enable Row Level Security
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Seed Petit Camp Field (Safe Insert)
-- ============================================

DO $$
BEGIN
  -- Check if Petit Camp field already exists
  IF NOT EXISTS (SELECT 1 FROM fields WHERE name = 'Petit Camp') THEN
    -- Insert new field
    INSERT INTO fields (name, description, location, price_per_hour, capacity, rating, facilities)
    VALUES (
      'Petit Camp',
      'Terrain de football professionnel avec installations modernes. Éclairage de qualité, vestiaires équipés, parking sécurisé et rafraîchissements disponibles.',
      'Dakar, Sénégal',
      20000,
      22,
      4.8,
      ARRAY['Éclairage', 'Vestiaires', 'Parking', 'Rafraîchissements']
    );
  ELSE
    -- Update existing field
    UPDATE fields 
    SET 
      description = 'Terrain de football professionnel avec installations modernes. Éclairage de qualité, vestiaires équipés, parking sécurisé et rafraîchissements disponibles.',
      location = 'Dakar, Sénégal',
      price_per_hour = 20000,
      capacity = 22,
      rating = 4.8,
      facilities = ARRAY['Éclairage', 'Vestiaires', 'Parking', 'Rafraîchissements'],
      updated_at = CURRENT_TIMESTAMP
    WHERE name = 'Petit Camp';
  END IF;
END $$;

-- ============================================
-- VERIFICATION (Optional - shows what was created)
-- ============================================

SELECT 'Setup Complete!' as message;

SELECT 
  'Tables' as type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'fields', 'bookings', 'time_slots', 'payments');

SELECT 
  'Petit Camp field' as type,
  COUNT(*) as count
FROM fields 
WHERE name = 'Petit Camp';

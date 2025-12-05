# Manual Database Seeding Guide

Your Supabase credentials are configured! Now let's populate the database with sample data.

## 🚀 Quick Steps

### Step 1: Create Tables

1. Open your Supabase dashboard: https://lfacyvxiwnvzfevlkbzb.supabase.co
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy ALL of this code and paste it:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fields table
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

-- Time slots table
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

-- Bookings table
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

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_field_id ON bookings(field_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_time_slots_field_id ON time_slots(field_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
```

5. Click **Execute** (or press Cmd+Enter)
6. Wait for ✅ success message

---

### Step 2: Populate With Sample Data

1. Create a **New Query** in SQL Editor
2. Copy ALL of this code and paste it:

```sql
-- Seed Users
INSERT INTO users (email, name, phone, role) VALUES
('admin@sport.sn', 'Admin User', '+221771234567', 'admin'),
('user@test.com', 'Test User', '+221771234568', 'user'),
('john@example.com', 'John Doe', '+221771234569', 'user'),
('marie@example.com', 'Marie Seck', '+221771234570', 'user')
ON CONFLICT (email) DO NOTHING;

-- Seed Football Fields
INSERT INTO fields (name, description, location, price_per_hour, capacity, rating, images, facilities) VALUES
(
  'Stadium Elite Football Field',
  'Professional-grade football field with modern facilities',
  'Downtown Sports Complex, Dakar',
  15000,
  22,
  4.8,
  ARRAY['https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'],
  ARRAY['Floodlights', 'Changing Rooms', 'Parking', 'Refreshments']
),
(
  'Sunset Valley Field',
  'Beautiful field with evening floodlights and great views',
  'Plateau, Dakar',
  12000,
  20,
  4.5,
  ARRAY['https://images.unsplash.com/photo-1570902235392-8f6121c2a9f8?w=800'],
  ARRAY['Floodlights', 'Parking', 'Seating Area']
),
(
  'Riverside Sports Arena',
  'Spacious field perfect for tournaments and big games',
  'Île de Gorée, Dakar',
  18000,
  24,
  4.9,
  ARRAY['https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=800'],
  ARRAY['Floodlights', 'Changing Rooms', 'Parking', 'Stadium Seating', 'Refreshments']
),
(
  'Petite Côte Mini Field',
  'Perfect for casual games and youth tournaments',
  'Petite Côte, Dakar',
  8000,
  16,
  4.2,
  ARRAY['https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800'],
  ARRAY['Floodlights', 'Parking']
),
(
  'Grand Yoff Premier Field',
  'Top-tier field with all premium amenities',
  'Grand Yoff, Dakar',
  20000,
  24,
  4.9,
  ARRAY['https://images.unsplash.com/photo-1508098682722-e7c75f5f97cc?w=800'],
  ARRAY['Floodlights', 'Changing Rooms', 'Parking', 'Stadium Seating', 'Cafeteria', 'Medical Room']
);

-- Seed Time Slots (next 30 days, for each field and time slot)
WITH date_range AS (
  SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '1 day'::interval)::date AS date
),
time_slots_base AS (
  SELECT * FROM (VALUES
    ('08:00 - 10:00'),
    ('10:00 - 12:00'),
    ('12:00 - 14:00'),
    ('14:00 - 16:00'),
    ('16:00 - 18:00'),
    ('18:00 - 20:00'),
    ('20:00 - 22:00')
  ) AS t(slot)
)
INSERT INTO time_slots (field_id, date, time, available)
SELECT f.id, dr.date, tsb.slot, RANDOM() > 0.3
FROM fields f
CROSS JOIN date_range dr
CROSS JOIN time_slots_base tsb
ON CONFLICT (field_id, date, time) DO NOTHING;

-- Seed Sample Bookings
INSERT INTO bookings (user_id, field_id, date, time_slot, status, payment_method, amount)
SELECT
  u.id,
  f.id,
  CURRENT_DATE + INTERVAL '1 day',
  '18:00 - 20:00',
  'pending',
  'wave',
  15000
FROM users u, fields f
WHERE u.email = 'user@test.com' AND f.name = 'Stadium Elite Football Field'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO bookings (user_id, field_id, date, time_slot, status, payment_method, amount)
SELECT
  u.id,
  f.id,
  CURRENT_DATE + INTERVAL '2 days',
  '16:00 - 18:00',
  'confirmed',
  'orange_money',
  12000
FROM users u, fields f
WHERE u.email = 'john@example.com' AND f.name = 'Sunset Valley Field'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO bookings (user_id, field_id, date, time_slot, status, payment_method, amount)
SELECT
  u.id,
  f.id,
  CURRENT_DATE + INTERVAL '3 days',
  '10:00 - 12:00',
  'confirmed',
  'cash',
  18000
FROM users u, fields f
WHERE u.email = 'marie@example.com' AND f.name = 'Riverside Sports Arena'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO bookings (user_id, field_id, date, time_slot, status, payment_method, amount)
SELECT
  u.id,
  f.id,
  CURRENT_DATE + INTERVAL '4 days',
  '14:00 - 16:00',
  'cancelled',
  'wave',
  8000
FROM users u, fields f
WHERE u.email = 'user@test.com' AND f.name = 'Petite Côte Mini Field'
LIMIT 1
ON CONFLICT DO NOTHING;
```

3. Click **Execute** (or press Cmd+Enter)
4. Wait for ✅ success message

---

## ✅ Done!

Your database is now populated with:
- ✅ 4 users
- ✅ 5 football fields with images
- ✅ 1,050 time slots (30 days)
- ✅ 4 sample bookings

---

## 🧪 Test It

1. Start your app:
```bash
npm run dev
```

2. Visit http://localhost:3000/fields
   - You should see 5 fields!

3. Try logging in with:
   - Email: `user@test.com`
   - Password: `test123`

4. Or admin:
   - Email: `admin@sport.sn`
   - Password: `admin123`

---

## 📊 What Was Created

**Users:**
- admin@sport.sn (Admin) 
- user@test.com (User)
- john@example.com (User)
- marie@example.com (User)

**Fields:**
- Stadium Elite (15,000 CFA/hour)
- Sunset Valley (12,000 CFA/hour)
- Riverside Arena (18,000 CFA/hour)
- Petite Côte (8,000 CFA/hour)
- Grand Yoff (20,000 CFA/hour)

**Bookings:**
- 4 sample bookings with different statuses

---

Done! Your database is ready to use. 🎉

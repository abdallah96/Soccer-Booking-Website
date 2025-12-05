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
-- This creates availability records for all fields for the next 30 days
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

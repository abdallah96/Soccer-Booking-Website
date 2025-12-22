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
  'Dakar, Sénégal',
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
--   'Dakar, Sénégal',
--   20000,
--   22,
--   4.8,
--   ARRAY['Éclairage', 'Vestiaires', 'Parking', 'Rafraîchissements']
-- ) ON CONFLICT DO NOTHING;


-- Add support for anonymous reviews
-- Make user_id nullable and add reviewer_name and reviewer_email

ALTER TABLE reviews 
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reviewer_email VARCHAR(255);

-- Update unique constraint to allow multiple anonymous reviews per field
-- (but still one per authenticated user)
DROP INDEX IF EXISTS reviews_field_user_unique;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_field_user_unique 
  ON reviews(field_id, user_id) 
  WHERE user_id IS NOT NULL;

-- Add index for anonymous reviews
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_email ON reviews(reviewer_email);


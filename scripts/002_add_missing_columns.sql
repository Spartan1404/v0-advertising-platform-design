-- Add missing columns to ad_slots table
ALTER TABLE ad_slots ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'header';
ALTER TABLE ad_slots ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing rows to have default values
UPDATE ad_slots SET position = 'header' WHERE position IS NULL;
UPDATE ad_slots SET is_active = TRUE WHERE is_active IS NULL;

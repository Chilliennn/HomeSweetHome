-- Add missing columns to keywords table
-- Run this SQL in your Supabase SQL Editor

-- Add is_active column (for soft deletes)
ALTER TABLE keywords 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add severity column if missing
ALTER TABLE keywords 
ADD COLUMN IF NOT EXISTS severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- Set all existing keywords to active
UPDATE keywords 
SET is_active = true 
WHERE is_active IS NULL;

-- Set default severity for existing keywords if null
UPDATE keywords 
SET severity = 'medium' 
WHERE severity IS NULL;

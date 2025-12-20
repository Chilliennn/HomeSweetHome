-- Add risk_level column to relationships table
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS risk_level text;

-- Add constraint to only allow valid values
ALTER TABLE relationships 
ADD CONSTRAINT relationships_risk_level_check 
CHECK (risk_level IN ('healthy', 'caution', 'critical'));

-- Set default value for existing rows
UPDATE relationships SET risk_level = 'healthy' WHERE risk_level IS NULL;

-- Make it NOT NULL after setting defaults
ALTER TABLE relationships ALTER COLUMN risk_level SET DEFAULT 'healthy';
ALTER TABLE relationships ALTER COLUMN risk_level SET NOT NULL;

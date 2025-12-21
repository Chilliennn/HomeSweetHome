-- Add risk_level_manual column to track if admin manually set the risk level
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS risk_level_manual boolean DEFAULT false;

-- Add last_message_at column to quickly check last contact without joining messages table
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS last_message_at timestamp with time zone;

-- Update last_message_at for existing relationships
UPDATE relationships r
SET last_message_at = (
    SELECT MAX(sent_at)
    FROM messages m
    WHERE (m.sender_id = r.youth_id AND m.receiver_id = r.elderly_id)
       OR (m.sender_id = r.elderly_id AND m.receiver_id = r.youth_id)
);

-- Create function to auto-calculate risk level based on last contact
CREATE OR REPLACE FUNCTION calculate_risk_level(last_contact timestamp with time zone)
RETURNS text AS $$
BEGIN
    IF last_contact IS NULL THEN
        RETURN 'critical';
    END IF;
    
    IF CURRENT_TIMESTAMP - last_contact >= INTERVAL '7 days' THEN
        RETURN 'critical';
    ELSIF CURRENT_TIMESTAMP - last_contact >= INTERVAL '3 days' THEN
        RETURN 'caution';
    ELSE
        RETURN 'healthy';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-update risk level when new message arrives
CREATE OR REPLACE FUNCTION auto_update_risk_level_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_message_at for the relationship
    UPDATE relationships
    SET 
        last_message_at = NEW.sent_at,
        risk_level = calculate_risk_level(NEW.sent_at),
        risk_level_manual = false  -- Reset to auto-calculation
    WHERE (youth_id = NEW.sender_id AND elderly_id = NEW.receiver_id)
       OR (youth_id = NEW.receiver_id AND elderly_id = NEW.sender_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS trigger_auto_update_risk_level ON messages;
CREATE TRIGGER trigger_auto_update_risk_level
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION auto_update_risk_level_on_message();

-- Auto-calculate risk levels for all existing relationships
UPDATE relationships
SET 
    risk_level = calculate_risk_level(last_message_at),
    risk_level_manual = false
WHERE risk_level_manual = false OR risk_level_manual IS NULL;

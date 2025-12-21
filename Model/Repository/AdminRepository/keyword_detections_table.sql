-- Create keyword_detections table to log when keywords are detected in messages
CREATE TABLE IF NOT EXISTS keyword_detections (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword_id uuid NOT NULL,
    message_id uuid NOT NULL,
    detected_at timestamptz DEFAULT now(),
    context text, -- Snippet of message showing the keyword in context
    
    -- Foreign keys
    CONSTRAINT fk_keyword FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE,
    CONSTRAINT fk_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_keyword_detections_keyword_id ON keyword_detections(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_detections_detected_at ON keyword_detections(detected_at);
CREATE INDEX IF NOT EXISTS idx_keyword_detections_message_id ON keyword_detections(message_id);

-- Add RLS policies (assuming admin access)
ALTER TABLE keyword_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access to keyword_detections"
ON keyword_detections
FOR ALL
USING (true)
WITH CHECK (true);

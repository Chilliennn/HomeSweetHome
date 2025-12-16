-- Safety Reports Table for UC401
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS safety_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('Positive Feedback', 'Safety Concern')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  severity_level TEXT NOT NULL CHECK (severity_level IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Review', 'Resolved')),
  evidence_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_safety_reports_user_id ON safety_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_severity ON safety_reports(severity_level);
CREATE INDEX IF NOT EXISTS idx_safety_reports_status ON safety_reports(status);
CREATE INDEX IF NOT EXISTS idx_safety_reports_created_at ON safety_reports(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON safety_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own reports
CREATE POLICY "Users can create reports"
  ON safety_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON safety_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Policy: Admins can update report status
CREATE POLICY "Admins can update reports"
  ON safety_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public)
VALUES ('safety-evidence', 'safety-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can upload to their own folder
CREATE POLICY "Users can upload evidence"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'safety-evidence' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: Users can view their own files
CREATE POLICY "Users can view own evidence"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'safety-evidence' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: Admins can view all files
CREATE POLICY "Admins can view all evidence"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'safety-evidence' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

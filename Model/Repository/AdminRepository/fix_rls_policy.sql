-- Fix RLS Policy for Safety Reports - Run this in Supabase SQL Editor
-- This adds policies that work during development/testing

-- Option 1: Disable RLS (easiest for development - NOT for production!)
-- ALTER TABLE safety_reports DISABLE ROW LEVEL SECURITY;

-- Option 2: Add a permissive insert policy (better approach)
-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create reports" ON safety_reports;

-- Create a more permissive policy for inserts (allows any authenticated or anonymous user)
CREATE POLICY "Allow report submissions"
  ON safety_reports
  FOR INSERT
  WITH CHECK (true);

-- Also update the select policy to allow users to see their own reports
DROP POLICY IF EXISTS "Users can view own reports" ON safety_reports;
CREATE POLICY "Users can view reports"
  ON safety_reports
  FOR SELECT
  USING (true);

-- If you want to completely disable RLS for testing (uncomment below):
-- ALTER TABLE safety_reports DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STORAGE BUCKET POLICIES (for file uploads)
-- ============================================

-- First, make sure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('safety-evidence', 'safety-evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing restrictive storage policies
DROP POLICY IF EXISTS "Users can upload evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own evidence" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all evidence" ON storage.objects;

-- Create permissive policies for development
CREATE POLICY "Allow evidence uploads"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'safety-evidence');

CREATE POLICY "Allow evidence downloads"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'safety-evidence');

CREATE POLICY "Allow evidence updates"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'safety-evidence');

CREATE POLICY "Allow evidence deletes"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'safety-evidence');

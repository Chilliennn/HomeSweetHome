-- ============================================
-- Consultation Requests & Advisors Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- ADVISORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS advisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    specialization VARCHAR(100),
    languages TEXT[] DEFAULT ARRAY['English'],
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
    current_workload INTEGER DEFAULT 0,
    max_workload INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONSULTATION REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS consultation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL,
    
    -- Request details
    consultation_type VARCHAR(100) NOT NULL,
    preferred_method VARCHAR(50) DEFAULT 'video_call' CHECK (preferred_method IN ('video_call', 'phone', 'in_person', 'chat')),
    preferred_datetime TIMESTAMPTZ,
    concern_description TEXT NOT NULL,
    urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high')),
    
    -- Status tracking
    status VARCHAR(30) DEFAULT 'pending_assignment' CHECK (status IN (
        'pending_assignment',
        'assigned',
        'in_progress',
        'completed',
        'dismissed'
    )),
    
    -- Assignment
    assigned_advisor_id UUID REFERENCES advisors(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    assigned_by UUID REFERENCES users(id),
    
    -- Resolution
    resolution_notes TEXT,
    dismissed_reason TEXT,
    completed_at TIMESTAMPTZ,
    
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_requester ON consultation_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_urgency ON consultation_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_advisors_status ON advisors(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

-- Allow all for now (adjust for production)
CREATE POLICY "Allow all for advisors" ON advisors FOR ALL USING (true);
CREATE POLICY "Allow all for consultation_requests" ON consultation_requests FOR ALL USING (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Consultation tables created successfully!' AS result;

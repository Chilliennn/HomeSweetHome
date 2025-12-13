-- ============================================
-- HomeSweetHome Database Schema for Supabase
-- ============================================
-- Copy this into Supabase SQL Editor and run it

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('youth', 'elderly', 'admin')),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    location VARCHAR(255),
    languages TEXT[],
    profile_photo_url TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    is_active BOOLEAN DEFAULT true,
    profile_data JSONB,
    
    -- Additional fields for admin display
    age INTEGER GENERATED ALWAYS AS (
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))
    ) STORED,
    avatar_url TEXT,
    occupation VARCHAR(255),
    education VARCHAR(255),
    age_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    youth_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    motivation_letter TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_ngo_review' CHECK (status IN (
        'pending_ngo_review',
        'ngo_approved',
        'pre_chat_active',
        'both_accepted',
        'rejected',
        'withdrawn',
        'info_requested'
    )),
    
    -- NGO Review fields
    ngo_reviewer_id UUID REFERENCES users(id),
    ngo_notes TEXT,
    locked_by UUID REFERENCES users(id),
    
    -- Approval fields
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    
    -- Rejection fields
    rejected_by UUID REFERENCES users(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    rejection_notes TEXT,
    
    -- Info request fields
    info_requested_by UUID REFERENCES users(id),
    info_requested_at TIMESTAMPTZ,
    info_requested TEXT,
    info_notes TEXT,
    
    -- Decision fields
    youth_decision VARCHAR(20) DEFAULT 'pending' CHECK (youth_decision IN ('pending', 'accept', 'decline')),
    elderly_decision VARCHAR(20) DEFAULT 'pending' CHECK (elderly_decision IN ('pending', 'accept', 'decline')),
    
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- ============================================
-- RELATIONSHIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    youth_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id),
    current_stage VARCHAR(50) DEFAULT 'getting_to_know' CHECK (current_stage IN (
        'getting_to_know',
        'trial_period',
        'official_ceremony',
        'family_life'
    )),
    stage_start_date TIMESTAMPTZ DEFAULT NOW(),
    stage_metrics JSONB DEFAULT '{"message_count": 0, "active_days": 0, "video_calls": 0, "meetings": 0, "progress_percentage": 0, "requirements_met": false}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
    family_name VARCHAR(255),
    ceremony_date DATE,
    certificate_url TEXT,
    end_request_status VARCHAR(30) DEFAULT 'none',
    end_request_by UUID,
    end_request_reason TEXT,
    end_request_at TIMESTAMPTZ,
    end_admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id),
    relationship_id UUID REFERENCES relationships(id),
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'video', 'video_call')),
    content TEXT,
    media_url TEXT,
    call_duration_minutes INTEGER,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SAFETY INCIDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS safety_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id),
    reporter_id UUID REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    incident_type VARCHAR(50) CHECK (incident_type IN (
        'financial_request',
        'negative_sentiment',
        'harassment',
        'abuse',
        'inappropriate_content',
        'other'
    )),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    evidence JSONB,
    status VARCHAR(30) DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'resolved', 'false_positive')),
    assigned_admin_id UUID REFERENCES users(id),
    admin_notes TEXT,
    admin_action_taken TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN (
        'stage_milestone',
        'new_message',
        'calendar_reminder',
        'safety_alert',
        'admin_notice',
        'application_update'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_youth ON applications(youth_id);
CREATE INDEX IF NOT EXISTS idx_applications_elderly ON applications(elderly_id);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);
CREATE INDEX IF NOT EXISTS idx_relationships_status ON relationships(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (adjust for production)
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for applications" ON applications FOR ALL USING (true);
CREATE POLICY "Allow all for relationships" ON relationships FOR ALL USING (true);
CREATE POLICY "Allow all for messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all for safety_incidents" ON safety_incidents FOR ALL USING (true);
CREATE POLICY "Allow all for notifications" ON notifications FOR ALL USING (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'HomeSweetHome schema created successfully!' AS result;

-- ============================================
-- HomeSweetHome Seed Data for Testing
-- ============================================

-- Clean up existing data (Optional - remove if you want to keep existing data)
-- DELETE FROM consultation_requests;
-- DELETE FROM advisors;
-- DELETE FROM safety_incidents;
-- DELETE FROM applications;
-- DELETE FROM relationships;
-- DELETE FROM users;

-- ============================================
-- 1. USERS
-- ============================================

-- Admin
INSERT INTO users (id, user_type, email, full_name, phone, date_of_birth, verification_status, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin', 'admin001@homesweethome.org', 'Admin001', '+60 19-111 1111', '1985-01-15', 'verified', true),
    ('00000000-0000-0000-0000-000000000002', 'admin', 'admin002@homesweethome.org', 'Admin002', '+60 19-222 2222', '1987-05-20', 'verified', true)
ON CONFLICT (id) DO NOTHING;

-- Youth (6 users)
INSERT INTO users (id, user_type, email, full_name, phone, date_of_birth, gender, location, verification_status, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111101', 'youth', 'sarah@test.com', 'Sarah Chen', '+60 12-345 6789', '2002-03-15', 'female', 'Kuala Lumpur', 'verified', true),
    ('11111111-1111-1111-1111-111111111102', 'youth', 'david@test.com', 'David Lim', '+60 13-456 7890', '2001-08-22', 'male', 'Penang', 'verified', true),
    ('11111111-1111-1111-1111-111111111103', 'youth', 'maya@test.com', 'Maya Rahman', '+60 14-567 8901', '2003-11-05', 'female', 'Johor Bahru', 'verified', true),
    ('11111111-1111-1111-1111-111111111104', 'youth', 'wei@test.com', 'Wei Jian', '+60 15-678 9012', '2000-07-12', 'male', 'Selangor', 'verified', true),
    ('11111111-1111-1111-1111-111111111105', 'youth', 'aisyah@test.com', 'Aisyah Binti Hassan', '+60 16-789 0123', '2002-09-25', 'female', 'Melaka', 'verified', true),
    ('11111111-1111-1111-1111-111111111106', 'youth', 'ryan@test.com', 'Ryan Tan', '+60 17-890 1234', '2001-04-18', 'male', 'Kuala Lumpur', 'verified', true)
ON CONFLICT (id) DO NOTHING;

-- Elderly (6 users)
INSERT INTO users (id, user_type, email, full_name, phone, date_of_birth, gender, location, verification_status, is_active)
VALUES 
    ('22222222-2222-2222-2222-222222222201', 'elderly', 'uncle.tan@test.com', 'Tan Ah Kow', '+60 19-321 6549', '1955-06-20', 'male', 'Kuala Lumpur', 'verified', true),
    ('22222222-2222-2222-2222-222222222202', 'elderly', 'auntie.lee@test.com', 'Lee Mei Ling', '+60 19-654 9870', '1958-02-14', 'female', 'Penang', 'verified', true),
    ('22222222-2222-2222-2222-222222222203', 'elderly', 'pakcik.ahmad@test.com', 'Ahmad bin Ismail', '+60 19-987 6543', '1952-09-30', 'male', 'Selangor', 'verified', true),
    ('22222222-2222-2222-2222-222222222204', 'elderly', 'auntiemary@test.com', 'Mary Fernandez', '+60 19-210 5432', '1956-12-03', 'female', 'Melaka', 'verified', true),
    ('22222222-2222-2222-2222-222222222205', 'elderly', 'unclewong@test.com', 'Wong Kam Fook', '+60 19-543 2109', '1954-08-15', 'male', 'Ipoh', 'verified', true),
    ('22222222-2222-2222-2222-222222222206', 'elderly', 'makcik.fatimah@test.com', 'Fatimah Binti Ali', '+60 19-876 5432', '1957-01-28', 'female', 'Kuantan', 'verified', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. APPLICATIONS (Total: 12 for Application Review Queue)
-- Distribution: 4 pending_ngo_review, 4 info_requested, 2 locked by Admin001, 2 locked by Admin002
-- ============================================

INSERT INTO applications (id, youth_id, elderly_id, motivation_letter, status, applied_at, locked_by)
VALUES 
    -- Pending Review (4 applications, not locked)
    ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 
     'Dear Uncle Tan, I am Sarah, a university student studying Computer Science. I would love to learn from your wisdom and gain perspective from your life experiences.', 
     'pending_ngo_review', NOW() - INTERVAL '4 days', NULL),
    
    ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 
     'Hello Auntie Lee! I am David, a photography student. I miss my grandmother and would love to help you with technology while learning about traditional recipes.', 
     'pending_ngo_review', NOW() - INTERVAL '3 days', NULL),
    
    ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222204', 
     'Dear Auntie Mary, I am Maya. I am interested in learning about Portuguese-Malay heritage and culture from you.', 
     'pending_ngo_review', NOW() - INTERVAL '2 days', NULL),
    
    ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222205', 
     'Hello Uncle Wong, I am Wei Jian. I want to learn Chinese calligraphy and tea ceremony from you.', 
     'pending_ngo_review', NOW() - INTERVAL '1 day', NULL),
    
    -- Info Requested (4 applications)
    ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222203', 
     'Hi Pakcik Ahmad, I am Aisyah. I am interested in hearing stories about Malaysia in the past and learning traditional crafts.', 
     'info_requested', NOW() - INTERVAL '5 days', NULL),
    
    ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222206', 
     'Dear Makcik Fatimah, I am Ryan. I would love to learn about your traditional cooking and kampung life stories.', 
     'info_requested', NOW() - INTERVAL '4 days', NULL),
    
    ('33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222202', 
     'Dear Auntie Lee, I am Sarah. I would love to learn about your batik art and cultural heritage.', 
     'info_requested', NOW() - INTERVAL '6 days', NULL),
    
    ('33333333-3333-3333-3333-333333333308', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222205', 
     'Hello Uncle Wong, I am David. I want to document your life stories through photography and learn from you.', 
     'info_requested', NOW() - INTERVAL '3 days', NULL),
    
    -- Locked by Admin001 (2 applications)
    ('33333333-3333-3333-3333-333333333309', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222201', 
     'Dear Uncle Tan, I am Maya. I heard about your knowledge of traditional cooking and would love to learn your recipes.', 
     'pending_ngo_review', NOW() - INTERVAL '8 hours', '00000000-0000-0000-0000-000000000001'),
    
    ('33333333-3333-3333-3333-333333333310', '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222203', 
     'Hi Pakcik Ahmad, I am Wei Jian. I want to learn about gardening and traditional Malay wisdom from you.', 
     'info_requested', NOW() - INTERVAL '4 hours', '00000000-0000-0000-0000-000000000001'),
    
    -- Locked by Admin002 (2 applications)
    ('33333333-3333-3333-3333-333333333311', '11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222202', 
     'Dear Auntie Lee, I am Aisyah. I would love to help you with daily activities while learning about your life experiences.', 
     'pending_ngo_review', NOW() - INTERVAL '6 hours', '00000000-0000-0000-0000-000000000002'),
    
    ('33333333-3333-3333-3333-333333333312', '11111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222204', 
     'Hi Auntie Mary, I am Ryan. I want to learn about your community work and how I can contribute to society.', 
     'info_requested', NOW() - INTERVAL '2 hours', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. RELATIONSHIPS (Required for Consultations)
-- ============================================

INSERT INTO relationships (id, youth_id, elderly_id, current_stage, status, created_at)
VALUES 
    ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', 'getting_to_know', 'active', NOW() - INTERVAL '25 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. ADVISORS (For Assigning Consultations)
-- ============================================

INSERT INTO advisors (id, name, specialization, status, current_workload, languages)
VALUES 
    ('55555555-5555-5555-5555-555555555501', 'Dr. Wong Li Mei', 'Relationship Guidance', 'available', 2, ARRAY['English', 'Mandarin', 'Cantonese']),
    ('55555555-5555-5555-5555-555555555502', 'Encik Razak bin Abdullah', 'Conflict Mediation', 'available', 3, ARRAY['English', 'Malay']),
    ('55555555-5555-5555-5555-555555555503', 'Ms. Priya Ramasamy', 'Communication Support', 'busy', 5, ARRAY['English', 'Tamil', 'Malay'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. CONSULTATION REQUESTS (For Consultation Dashboard)
-- ============================================

INSERT INTO consultation_requests (
    id, requester_id, partner_id, relationship_id, 
    consultation_type, preferred_method, preferred_datetime, 
    concern_description, status, urgency, submitted_at, 
    assigned_advisor_id, assigned_at
)
VALUES 
    -- Pending Request (Normal Urgency)
    ('66666666-6666-6666-6666-666666666601',
     '11111111-1111-1111-1111-111111111103', -- Maya (Youth)
     '22222222-2222-2222-2222-222222222203', -- Pakcik Ahmad (Elderly)
     '44444444-4444-4444-4444-444444444401',
     'General Advice', 'video_call', '2025-12-20T10:00:00Z',
     'I feel like we are having trouble finding topics to talk about recently.',
     'pending_assignment', 'normal', NOW() - INTERVAL '1 day',
     NULL, NULL),

    -- Pending Request (High Urgency)
    ('66666666-6666-6666-6666-666666666602',
     '22222222-2222-2222-2222-222222222203', -- Pakcik Ahmad (Elderly)
     '11111111-1111-1111-1111-111111111103', -- Maya (Youth)
     '44444444-4444-4444-4444-444444444401',
     'Conflict Resolution', 'voice_call', '2025-12-15T14:00:00Z',
     'There was a misunderstanding about a scheduled call and I want to clear it up.',
     'pending_assignment', 'high', NOW() - INTERVAL '4 hours',
     NULL, NULL),

    -- Assigned Request (In Progress)
    ('66666666-6666-6666-6666-666666666603',
     '11111111-1111-1111-1111-111111111103',
     '22222222-2222-2222-2222-222222222203',
     '44444444-4444-4444-4444-444444444401',
     'Communication Support', 'video_call', '2025-12-18T09:00:00Z',
     'We want to facilitate a better conversation.',
     'in_progress', 'normal', NOW() - INTERVAL '3 days',
     '55555555-5555-5555-5555-555555555502', NOW() - INTERVAL '1 day');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Comprehensive test data inserted! refresh your Admin UI to see changes.' AS result;

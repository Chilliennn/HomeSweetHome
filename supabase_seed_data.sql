-- ============================================
-- HomeSweetHome Seed Data for Testing
-- ============================================
-- Uses only basic columns that exist in your table

-- ============================================
-- ADMIN USER
-- ============================================
INSERT INTO users (id, user_type, email, full_name, date_of_birth, verification_status, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin', 'admin@homesweethome.org', 'Admin User', '1985-01-15', 'verified', true);

-- ============================================
-- YOUTH USERS (3 test youth)
-- ============================================
INSERT INTO users (id, user_type, email, full_name, date_of_birth, gender, location, verification_status, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111101', 'youth', 'sarah@test.com', 'Sarah Chen', '2002-03-15', 'female', 'Kuala Lumpur', 'verified', true),
    ('11111111-1111-1111-1111-111111111102', 'youth', 'david@test.com', 'David Lim', '2001-08-22', 'male', 'Penang', 'verified', true),
    ('11111111-1111-1111-1111-111111111103', 'youth', 'maya@test.com', 'Maya Rahman', '2003-11-05', 'female', 'Johor Bahru', 'pending', true);

-- ============================================
-- ELDERLY USERS (3 test elderly)
-- ============================================
INSERT INTO users (id, user_type, email, full_name, date_of_birth, gender, location, verification_status, is_active)
VALUES 
    ('22222222-2222-2222-2222-222222222201', 'elderly', 'uncle.tan@test.com', 'Tan Ah Kow', '1955-06-20', 'male', 'Kuala Lumpur', 'verified', true),
    ('22222222-2222-2222-2222-222222222202', 'elderly', 'auntie.lee@test.com', 'Lee Mei Ling', '1958-02-14', 'female', 'Penang', 'verified', true),
    ('22222222-2222-2222-2222-222222222203', 'elderly', 'pakcik.ahmad@test.com', 'Ahmad bin Ismail', '1952-09-30', 'male', 'Selangor', 'verified', true);

-- ============================================
-- APPLICATIONS (various statuses for testing)
-- ============================================

-- Application 1: Pending Review (Sarah → Uncle Tan)
INSERT INTO applications (id, youth_id, elderly_id, motivation_letter, status, applied_at)
VALUES (
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111101',
    '22222222-2222-2222-2222-222222222201',
    'Dear Uncle Tan, I am Sarah, a university student studying Computer Science. I grew up without grandparents as they all passed before I was born. I would love to learn about life wisdom, cooking traditional dishes, and hear stories from the past.',
    'pending_ngo_review',
    NOW() - INTERVAL '2 days'
);

-- Application 2: Pending Review (David → Auntie Lee)
INSERT INTO applications (id, youth_id, elderly_id, motivation_letter, status, applied_at)
VALUES (
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111102',
    '22222222-2222-2222-2222-222222222202',
    'Hello Auntie Lee! I am David from Penang. I recently lost my grandmother and miss having an elderly figure in my life. I would love to help you with technology while learning your recipes.',
    'pending_ngo_review',
    NOW() - INTERVAL '5 days'
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Test data inserted! You now have 1 admin, 3 youth, 3 elderly, and 2 applications.' AS result;

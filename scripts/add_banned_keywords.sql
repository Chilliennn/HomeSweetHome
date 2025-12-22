-- Script to create keywords table and add banned keywords
-- Run this in Supabase SQL Editor
-- Date: 2024-12-22

-- =====================================================
-- Step 1: Create the keywords table (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword TEXT NOT NULL,
    category_id TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster keyword lookups
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_keywords_category ON keywords(category_id);
CREATE INDEX IF NOT EXISTS idx_keywords_active ON keywords(is_active);

-- =====================================================
-- Step 2: Financial Exploitation Keywords (category_id = 1)
-- 30 keywords total - severity: 'critical'
-- =====================================================
INSERT INTO keywords (keyword, category_id, severity, is_active, created_at)
VALUES
    ('at the bank', '1', 'critical', true, NOW()),
    ('bank details', '1', 'critical', true, NOW()),
    ('online banking', '1', 'critical', true, NOW()),
    ('send money urgently', '1', 'critical', true, NOW()),
    ('wire transfer', '1', 'critical', true, NOW()),
    ('bank account', '1', 'critical', true, NOW()),
    ('routing number', '1', 'critical', true, NOW()),
    ('CVV code', '1', 'critical', true, NOW()),
    ('security code', '1', 'critical', true, NOW()),
    ('debit card', '1', 'critical', true, NOW()),
    ('payment details', '1', 'critical', true, NOW()),
    ('account number', '1', 'critical', true, NOW()),
    ('sort code', '1', 'critical', true, NOW()),
    ('IBAN', '1', 'critical', true, NOW()),
    ('SWIFT code', '1', 'critical', true, NOW()),
    ('paypal password', '1', 'critical', true, NOW()),
    ('wallet address', '1', 'critical', true, NOW()),
    ('crypto wallet', '1', 'critical', true, NOW()),
    ('send bitcoin', '1', 'critical', true, NOW()),
    ('western union', '1', 'critical', true, NOW()),
    ('money order', '1', 'critical', true, NOW()),
    ('cashapp', '1', 'critical', true, NOW()),
    ('venmo password', '1', 'critical', true, NOW()),
    ('bank login', '1', 'critical', true, NOW()),
    ('card verification', '1', 'critical', true, NOW()),
    ('transfer money', '1', 'critical', true, NOW()),
    ('credit card', '1', 'critical', true, NOW()),
    ('credit card number', '1', 'critical', true, NOW()),
    ('PIN code', '1', 'critical', true, NOW()),
    ('ATM password', '1', 'critical', true, NOW());

-- =====================================================
-- Step 3: Personal Information Keywords (category_id = 2)
-- 31 keywords total - severity: 'high'
-- =====================================================
INSERT INTO keywords (keyword, category_id, severity, is_active, created_at)
VALUES
    ('personal full name', '2', 'high', true, NOW()),
    ('home address', '2', 'high', true, NOW()),
    ('phone number', '2', 'high', true, NOW()),
    ('NRIC', '2', 'critical', true, NOW()),
    ('IC number', '2', 'critical', true, NOW()),
    ('passport number', '2', 'critical', true, NOW()),
    ('email password', '2', 'critical', true, NOW()),
    ('date of birth', '2', 'high', true, NOW()),
    ('social security', '2', 'critical', true, NOW()),
    ('SSN', '2', 'critical', true, NOW()),
    ('driving license', '2', 'high', true, NOW()),
    ('license number', '2', 'high', true, NOW()),
    ('full name', '2', 'high', true, NOW()),
    ('mother maiden name', '2', 'critical', true, NOW()),
    ('place of birth', '2', 'high', true, NOW()),
    ('tax ID', '2', 'critical', true, NOW()),
    ('national ID', '2', 'critical', true, NOW()),
    ('voter ID', '2', 'high', true, NOW()),
    ('personal email', '2', 'high', true, NOW()),
    ('work address', '2', 'high', true, NOW()),
    ('residential address', '2', 'high', true, NOW()),
    ('postal code', '2', 'high', true, NOW()),
    ('zip code', '2', 'high', true, NOW()),
    ('mobile number', '2', 'high', true, NOW()),
    ('contact number', '2', 'high', true, NOW()),
    ('emergency contact', '2', 'high', true, NOW()),
    ('family details', '2', 'high', true, NOW()),
    ('marital status', '2', 'high', true, NOW()),
    ('spouse name', '2', 'high', true, NOW()),
    ('children names', '2', 'high', true, NOW()),
    ('blood type', '2', 'high', true, NOW());

-- =====================================================
-- Step 4: Verify the insertion
-- =====================================================
SELECT 
    keyword,
    CASE 
        WHEN category_id = '1' THEN 'Financial Exploitation'
        WHEN category_id = '2' THEN 'Personal Information'
    END as category,
    severity,
    is_active
FROM keywords
WHERE is_active = true
ORDER BY category_id, keyword;

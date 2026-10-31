-- Migration 002: blood request fields and expiry (SCRUM-29)
-- Status mapping to the spec: Pending = Open, Matching = In-Progress.
-- Urgency mapping: Level 1 - Stat = Critical, Level 2 - Urgent = High, Routine = Normal.

ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'Expired';

ALTER TABLE hospital_requests
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS hospital_address TEXT,
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

UPDATE hospital_requests
SET expires_at = created_at + INTERVAL '24 hours'
WHERE expires_at IS NULL;

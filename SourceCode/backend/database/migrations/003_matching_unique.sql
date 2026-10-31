-- Migration 003: one matching row per (request, donor) (SCRUM-30)
CREATE UNIQUE INDEX IF NOT EXISTS uq_matching_request_donor
    ON matching_logs (request_id, donor_id);

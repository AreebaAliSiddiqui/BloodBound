-- Migration 005: track donation per appointment (SCRUM-36)
ALTER TABLE camp_appointments
    ADD COLUMN IF NOT EXISTS donated BOOLEAN DEFAULT FALSE;

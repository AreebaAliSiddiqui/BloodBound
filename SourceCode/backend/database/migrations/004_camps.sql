-- Migration 004: camp lifecycle and capacity (SCRUM-34)
DO $$ BEGIN
    CREATE TYPE camp_status AS ENUM ('Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE camps
    ADD COLUMN IF NOT EXISTS status camp_status NOT NULL DEFAULT 'Draft',
    ADD COLUMN IF NOT EXISTS max_capacity INT NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

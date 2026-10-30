-- Seed Data for Bloodbound

-- 1. Insert Test Users (Roles: admin, hospital_staff, camp_organizer, donor)
INSERT INTO users (user_id, name, email, password_hash, role, phone) VALUES
('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@bloodbound.org', 'hash_admin', 'admin', '+923000000001'),
('22222222-2222-2222-2222-222222222222', 'Dr. Smith (City Hospital)', 'smith@cityhospital.com', 'hash_hosp', 'hospital_staff', '+923000000002'),
('33333333-3333-3333-3333-333333333333', 'Red Cross Org', 'organizer@redcross.org', 'hash_org', 'camp_organizer', '+923000000003'),
('44444444-4444-4444-4444-444444444444', 'Areeba Siddiqui', 'areeba@example.com', 'hash_donor1', 'donor', '+923001234567'),
('55555555-5555-5555-5555-555555555555', 'Rani Khan', 'rani@example.com', 'hash_donor2', 'donor', '+923007654321')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Donor Profiles
INSERT INTO donor_profiles (donor_id, user_id, blood_group, city, latitude, longitude, last_donation_date, is_eligible) VALUES
('a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'O-', 'Karachi', 24.8607, 67.0011, '2026-06-15', TRUE),
('b2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'A+', 'Karachi', 24.8712, 67.0300, '2026-08-01', TRUE)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Insert Sample Emergency Hospital Request
INSERT INTO hospital_requests (request_id, hospital_id, patient_identifier, blood_group, component, units_required, urgency, status) VALUES
('r1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'PAT-8902', 'O-', 'Packed RBCs', 2, 'Level 1 - Stat', 'Matching');

-- 4. Insert Sample Donation Camp
INSERT INTO camps (camp_id, organizer_id, camp_name, location_address, city, start_time, end_time, target_units) VALUES
('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Annual University Blood Drive', 'NED University Campus Ground', 'Karachi', '2026-11-10 09:00:00+05', '2026-11-10 17:00:00+05', 100);
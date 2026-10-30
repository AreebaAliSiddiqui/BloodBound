-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('donor', 'hospital_staff', 'camp_organizer', 'admin');
CREATE TYPE blood_group AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE component_type AS ENUM ('Whole Blood', 'Packed RBCs', 'Platelets', 'Plasma');
CREATE TYPE request_urgency AS ENUM ('Level 1 - Stat', 'Level 2 - Urgent', 'Routine');
CREATE TYPE request_status AS ENUM ('Pending', 'Matching', 'Fulfilled', 'Cancelled');

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'donor',
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Donor Profiles Table
CREATE TABLE IF NOT EXISTS donor_profiles (
    donor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    blood_group blood_group NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    last_donation_date DATE,
    is_eligible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Hospital Requests Table
CREATE TABLE IF NOT EXISTS hospital_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    patient_identifier VARCHAR(50) NOT NULL,
    blood_group blood_group NOT NULL,
    component component_type NOT NULL,
    units_required INT NOT NULL CHECK (units_required > 0),
    urgency request_urgency NOT NULL DEFAULT 'Level 2 - Urgent',
    status request_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Donation Camps Table
CREATE TABLE IF NOT EXISTS camps (
    camp_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    camp_name VARCHAR(150) NOT NULL,
    location_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    target_units INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Camp Appointments Table
CREATE TABLE IF NOT EXISTS camp_appointments (
    appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camp_id UUID REFERENCES camps(camp_id) ON DELETE CASCADE,
    donor_id UUID REFERENCES donor_profiles(donor_id) ON DELETE CASCADE,
    slot_time TIMESTAMP WITH TIME ZONE NOT NULL,
    attended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_donor_camp_slot UNIQUE (camp_id, donor_id)
);

-- 6. Blood Inventory Table
CREATE TABLE IF NOT EXISTS blood_inventory (
    unit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blood_group blood_group NOT NULL,
    component component_type NOT NULL,
    source_camp_id UUID REFERENCES camps(camp_id) ON DELETE SET NULL,
    allocated_request_id UUID REFERENCES hospital_requests(request_id) ON DELETE SET NULL,
    expiry_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Matching & Broadcast Logs Table
CREATE TABLE IF NOT EXISTS matching_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES hospital_requests(request_id) ON DELETE CASCADE,
    donor_id UUID REFERENCES donor_profiles(donor_id) ON DELETE CASCADE,
    alert_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    response_status VARCHAR(30) DEFAULT 'Pending'
);
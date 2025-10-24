-- Tutor Scene Complete Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS promo_redemption CASCADE;
DROP TABLE IF EXISTS promo_code CASCADE;
DROP TABLE IF EXISTS payout CASCADE;
DROP TABLE IF EXISTS refund CASCADE;
DROP TABLE IF EXISTS payment_transaction CASCADE;
DROP TABLE IF EXISTS session_recording CASCADE;
DROP TABLE IF EXISTS session_consent CASCADE;
DROP TABLE IF EXISTS booking CASCADE;
DROP TABLE IF EXISTS booking_request CASCADE;
DROP TABLE IF EXISTS recurring_booking_pattern CASCADE;
DROP TABLE IF EXISTS review CASCADE;
DROP TABLE IF EXISTS message CASCADE;
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS support_ticket CASCADE;
DROP TABLE IF EXISTS dispute CASCADE;
DROP TABLE IF EXISTS background_check CASCADE;
DROP TABLE IF EXISTS kyc_request CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS availability_slot CASCADE;
DROP TABLE IF EXISTS tutor_subject CASCADE;
DROP TABLE IF EXISTS tutor_language CASCADE;
DROP TABLE IF EXISTS language CASCADE;
DROP TABLE IF EXISTS subject CASCADE;
DROP TABLE IF EXISTS tutor_application CASCADE;
DROP TABLE IF EXISTS tutor_profile CASCADE;
DROP TABLE IF EXISTS student_profile CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS cms_page CASCADE;

-- ENUMS
CREATE TYPE user_role AS ENUM ('student', 'tutor', 'admin', 'support');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE tutor_application_stage AS ENUM ('pre_req', 'resume', 'interview', 'admin_review', 'background_check', 'approved', 'rejected');
CREATE TYPE tutor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended', 'inactive');
CREATE TYPE booking_status AS ENUM ('pending', 'tutor_review', 'confirmed', 'cancelled', 'completed', 'no_show', 'disputed');
CREATE TYPE booking_request_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded', 'cancelled');
CREATE TYPE refund_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'cancelled');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'cancelled');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE message_moderation_status AS ENUM ('clean', 'flagged', 'reviewed', 'removed');
CREATE TYPE kyc_status AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'requires_retry');
CREATE TYPE background_check_status AS ENUM ('pending', 'in_progress', 'clear', 'consider', 'suspended', 'dispute');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed');
CREATE TYPE support_ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'in_app', 'push');
CREATE TYPE notification_type AS ENUM ('booking_confirmed', 'booking_reminder', 'booking_cancelled', 'payment_received', 'payout_processed', 'message_received', 'review_received', 'application_status', 'system');
CREATE TYPE promo_code_discount_type AS ENUM ('percentage', 'fixed_amount');
CREATE TYPE consent_type AS ENUM ('recording', 'data_processing', 'terms_of_service');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'status_change', 'payment', 'refund');
CREATE TYPE recurring_booking_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');

-- Users table
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'student',
    status user_status DEFAULT 'pending',
    profile_photo_url VARCHAR(500),
    
    -- 2FA
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    
    -- Stripe
    stripe_connected_account_id VARCHAR(255),
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
    
    -- Google Calendar
    google_calendar_refresh_token TEXT,
    google_calendar_access_token TEXT,
    google_calendar_token_expiry TIMESTAMP,
    
    -- Tracking
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(100),
    
    -- Verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verified_at TIMESTAMP,
    phone_verified BOOLEAN DEFAULT FALSE,
    phone_verified_at TIMESTAMP,
    
    -- Password reset
    password_reset_token VARCHAR(255),
    password_reset_expiry TIMESTAMP,
    
    -- JWT
    refresh_token TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_phone ON "user"(phone_number);
CREATE INDEX idx_user_role ON "user"(role);
CREATE INDEX idx_user_status ON "user"(status);

-- Student Profile
CREATE TABLE student_profile (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    guardian_user_id INTEGER REFERENCES "user"(id),
    date_of_birth DATE,
    grade_level VARCHAR(50),
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tutor Profile
CREATE TABLE tutor_profile (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    bio TEXT,
    intro_video_url VARCHAR(500),
    hourly_rate DECIMAL(10, 2),
    credentials TEXT,
    status tutor_status DEFAULT 'pending',
    application_stage tutor_application_stage DEFAULT 'pre_req',
    cancellation_policy_hours INTEGER DEFAULT 24,
    cancellation_policy_text TEXT,
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_sessions_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tutor_status ON tutor_profile(status);
CREATE INDEX idx_tutor_stage ON tutor_profile(application_stage);

-- Tutor Application (multi-stage onboarding)
CREATE TABLE tutor_application (
    id SERIAL PRIMARY KEY,
    tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profile(id) ON DELETE CASCADE,
    application_stage tutor_application_stage DEFAULT 'pre_req',
    
    -- Pre-requisite stage
    pre_req_answers JSONB,
    pre_req_completed_at TIMESTAMP,
    
    -- Resume stage
    resume_url VARCHAR(500),
    resume_uploaded_at TIMESTAMP,
    
    -- Interview stage
    interview_scheduled_at TIMESTAMP,
    interview_zoom_link VARCHAR(500),
    interview_completed_at TIMESTAMP,
    interview_notes TEXT,
    
    -- Admin review
    admin_reviewed_by INTEGER REFERENCES "user"(id),
    admin_qualified BOOLEAN,
    admin_decision_notes TEXT,
    admin_reviewed_at TIMESTAMP,
    
    -- Background check
    background_check_initiated_at TIMESTAMP,
    background_check_completed_at TIMESTAMP,
    
    -- Final
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects
CREATE TABLE subject (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Languages
CREATE TABLE language (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tutor Subjects (with custom pricing)
CREATE TABLE tutor_subject (
    id SERIAL PRIMARY KEY,
    tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profile(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
    price_override DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tutor_profile_id, subject_id)
);

-- Tutor Languages
CREATE TABLE tutor_language (
    id SERIAL PRIMARY KEY,
    tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profile(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES language(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(50) DEFAULT 'fluent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tutor_profile_id, language_id)
);

-- Availability Slots
CREATE TABLE availability_slot (
    id SERIAL PRIMARY KEY,
    tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profile(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_availability_tutor ON availability_slot(tutor_profile_id);
CREATE INDEX idx_availability_time ON availability_slot(start_time, end_time);

-- Booking Request (student creates → tutor approves)
CREATE TABLE booking_request (
    id SERIAL PRIMARY KEY,
    student_profile_id INTEGER NOT NULL REFERENCES student_profile(id),
    tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profile(id),
    availability_slot_id INTEGER REFERENCES availability_slot(id),
    subject_id INTEGER REFERENCES subject(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    student_expectations_url VARCHAR(500),
    student_notes TEXT,
    status booking_request_status DEFAULT 'pending',
    tutor_response_at TIMESTAMP,
    tutor_response_notes TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_booking_request_student ON booking_request(student_profile_id);
CREATE INDEX idx_booking_request_tutor ON booking_request(tutor_profile_id);
CREATE INDEX idx_booking_request_status ON booking_request(status);

-- Recurring Booking Pattern
CREATE TABLE recurring_booking_pattern (
    id SERIAL PRIMARY KEY,
    student_profile_id INTEGER NOT NULL REFERENCES student_profile(id),
    tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profile(id),
    subject_id INTEGER REFERENCES subject(id),
    frequency recurring_booking_frequency NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    day_of_week INTEGER,
    time_of_day TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking (confirmed sessions)
CREATE TABLE booking (
    id SERIAL PRIMARY KEY,
    booking_request_id INTEGER REFERENCES booking_request(id),
    student_profile_id INTEGER NOT NULL REFERENCES student_profile(id),
    tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profile(id),
    availability_slot_id INTEGER REFERENCES availability_slot(id),
    subject_id INTEGER REFERENCES subject(id),
    recurring_pattern_id INTEGER REFERENCES recurring_booking_pattern(id),
    
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    
    status booking_status DEFAULT 'confirmed',
    
    -- Pricing
    total_price DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2),
    tutor_payout_amount DECIMAL(10, 2),
    
    -- Stripe
    stripe_payment_intent_id VARCHAR(255),
    
    -- Zoom
    zoom_meeting_id VARCHAR(255),
    zoom_join_link VARCHAR(500),
    zoom_start_url VARCHAR(500),
    
    -- Cancellation
    cancelled_at TIMESTAMP,
    cancelled_by INTEGER REFERENCES "user"(id),
    cancellation_reason TEXT,
    refund_eligible BOOLEAN DEFAULT TRUE,
    
    -- Completion
    completed_at TIMESTAMP,
    student_attended BOOLEAN,
    tutor_attended BOOLEAN,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_booking_student ON booking(student_profile_id);
CREATE INDEX idx_booking_tutor ON booking(tutor_profile_id);
CREATE INDEX idx_booking_status ON booking(status);
CREATE INDEX idx_booking_time ON booking(start_time);

-- Session Consent (recording, data processing, etc.)
CREATE TABLE session_consent (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    consent_type consent_type NOT NULL,
    has_consented BOOLEAN NOT NULL,
    consent_timestamp TIMESTAMP NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session Recording
CREATE TABLE session_recording (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
    recording_url VARCHAR(500),
    transcript_url VARCHAR(500),
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    storage_location VARCHAR(500),
    admin_viewed_at TIMESTAMP,
    admin_viewed_by INTEGER REFERENCES "user"(id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Transactions
CREATE TABLE payment_transaction (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES booking(id),
    stripe_charge_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    status payment_status DEFAULT 'pending',
    platform_fee_amount DECIMAL(10, 2),
    tutor_amount DECIMAL(10, 2),
    payment_method_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_booking ON payment_transaction(booking_id);
CREATE INDEX idx_payment_status ON payment_transaction(status);

-- Refunds
CREATE TABLE refund (
    id SERIAL PRIMARY KEY,
    payment_transaction_id INTEGER NOT NULL REFERENCES payment_transaction(id),
    stripe_refund_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    initiated_by_user_id INTEGER REFERENCES "user"(id),
    status refund_status DEFAULT 'pending',
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payouts (to tutors)
CREATE TABLE payout (
    id SERIAL PRIMARY KEY,
    tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profile(id),
    booking_id INTEGER REFERENCES booking(id),
    stripe_transfer_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    status payout_status DEFAULT 'pending',
    scheduled_for TIMESTAMP,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payout_tutor ON payout(tutor_profile_id);
CREATE INDEX idx_payout_status ON payout(status);

-- Promo Codes
CREATE TABLE promo_code (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type promo_code_discount_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    minimum_purchase_amount DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promo_code ON promo_code(code);

-- Promo Redemptions
CREATE TABLE promo_redemption (
    id SERIAL PRIMARY KEY,
    promo_code_id INTEGER NOT NULL REFERENCES promo_code(id),
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    booking_id INTEGER REFERENCES booking(id),
    amount_discounted DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE review (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES booking(id),
    student_user_id INTEGER NOT NULL REFERENCES "user"(id),
    tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profile(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status review_status DEFAULT 'pending',
    moderated_by_user_id INTEGER REFERENCES "user"(id),
    moderated_at TIMESTAMP,
    moderation_notes TEXT,
    is_visible BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_tutor ON review(tutor_profile_id);
CREATE INDEX idx_review_status ON review(status);

-- Messages
CREATE TABLE message (
    id SERIAL PRIMARY KEY,
    sender_user_id INTEGER NOT NULL REFERENCES "user"(id),
    receiver_user_id INTEGER NOT NULL REFERENCES "user"(id),
    content TEXT NOT NULL,
    is_moderated BOOLEAN DEFAULT FALSE,
    moderation_status message_moderation_status DEFAULT 'clean',
    moderation_flagged_at TIMESTAMP,
    flagged_keywords TEXT[],
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_sender ON message(sender_user_id);
CREATE INDEX idx_message_receiver ON message(receiver_user_id);
CREATE INDEX idx_message_moderation ON message(moderation_status);

-- Notifications
CREATE TABLE notification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    type notification_type NOT NULL,
    channel notification_channel NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    data JSONB,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_user ON notification(user_id);
CREATE INDEX idx_notification_type ON notification(type);
CREATE INDEX idx_notification_read ON notification(read_at);

-- KYC Requests
CREATE TABLE kyc_request (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    provider VARCHAR(50) NOT NULL,
    provider_request_id VARCHAR(255),
    status kyc_status DEFAULT 'pending',
    decision TEXT,
    decision_at TIMESTAMP,
    documents_required TEXT[],
    documents_submitted JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Background Checks
CREATE TABLE background_check (
    id SERIAL PRIMARY KEY,
    tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profile(id),
    provider VARCHAR(50) DEFAULT 'checkr',
    provider_report_id VARCHAR(255),
    status background_check_status DEFAULT 'pending',
    result TEXT,
    completed_at TIMESTAMP,
    cost DECIMAL(10, 2),
    report_data JSONB,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disputes
CREATE TABLE dispute (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES booking(id),
    payment_transaction_id INTEGER REFERENCES payment_transaction(id),
    initiated_by_user_id INTEGER NOT NULL REFERENCES "user"(id),
    reason TEXT NOT NULL,
    status dispute_status DEFAULT 'open',
    resolution TEXT,
    resolved_by_user_id INTEGER REFERENCES "user"(id),
    resolved_at TIMESTAMP,
    evidence_documents TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support Tickets
CREATE TABLE support_ticket (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status support_ticket_status DEFAULT 'open',
    priority support_ticket_priority DEFAULT 'medium',
    assigned_to_user_id INTEGER REFERENCES "user"(id),
    category VARCHAR(100),
    tags TEXT[],
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_user ON support_ticket(user_id);
CREATE INDEX idx_ticket_status ON support_ticket(status);
CREATE INDEX idx_ticket_assigned ON support_ticket(assigned_to_user_id);

-- Audit Logs
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(id),
    action audit_action NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- CMS Pages (for policies, terms, etc.)
CREATE TABLE cms_page (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_by INTEGER REFERENCES "user"(id),
    updated_by INTEGER REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default data
INSERT INTO language (name, code) VALUES 
('English', 'en'),
('Spanish', 'es'),
('French', 'fr'),
('German', 'de'),
('Chinese', 'zh'),
('Arabic', 'ar'),
('Hindi', 'hi'),
('Portuguese', 'pt'),
('Russian', 'ru'),
('Japanese', 'ja');

INSERT INTO subject (name, description, category) VALUES 
('Mathematics', 'Elementary to Advanced Mathematics', 'STEM'),
('Physics', 'Physics and Applied Sciences', 'STEM'),
('Chemistry', 'Chemistry and Lab Sciences', 'STEM'),
('Biology', 'Biology and Life Sciences', 'STEM'),
('Computer Science', 'Programming and Computer Science', 'STEM'),
('English', 'English Language and Literature', 'Language Arts'),
('History', 'World and US History', 'Social Studies'),
('Spanish', 'Spanish Language', 'Languages'),
('French', 'French Language', 'Languages'),
('Music', 'Music Theory and Practice', 'Arts'),
('Art', 'Visual Arts', 'Arts'),
('SAT Prep', 'SAT Test Preparation', 'Test Prep'),
('ACT Prep', 'ACT Test Preparation', 'Test Prep');

-- Create default admin user (password: Admin@123)
INSERT INTO "user" (email, password_hash, first_name, last_name, role, status, email_verified) VALUES 
('admin@tutorscene.com', '$2b$10$XxFvQ6MzO5yqF.qfBi7jqOJi3Y0gY9sJmKT3/EqcPPMCJGhvMJV2S', 'Admin', 'User', 'admin', 'active', TRUE);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutor_profile_updated_at BEFORE UPDATE ON tutor_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_profile_updated_at BEFORE UPDATE ON student_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_updated_at BEFORE UPDATE ON booking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transaction_updated_at BEFORE UPDATE ON payment_transaction FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

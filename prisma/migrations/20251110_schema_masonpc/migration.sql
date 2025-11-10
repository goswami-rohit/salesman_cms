-- Prerequisite: Enable UUID functions in PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Alter daily_visit_reports (Unchanged)
ALTER TABLE daily_visit_reports
ADD COLUMN time_spent_in_loc TEXT;

-- 2. Alter technical_visit_reports (Consolidated & Corrected)
ALTER TABLE technical_visit_reports
ADD COLUMN purpose_of_visit VARCHAR(500),
ADD COLUMN site_photo_url VARCHAR(500),
ADD COLUMN first_visit_time TIMESTAMPTZ,
ADD COLUMN last_visit_time TIMESTAMPTZ,
ADD COLUMN first_visit_day VARCHAR(100),
ADD COLUMN last_visit_day VARCHAR(100),
ADD COLUMN site_visits_count INTEGER,
ADD COLUMN other_visits_count INTEGER,
ADD COLUMN total_visits_count INTEGER,
ADD COLUMN region VARCHAR(100),
ADD COLUMN area VARCHAR(100),
ADD COLUMN latitude DECIMAL(9, 6),   -- FIXED: Was TEXT
ADD COLUMN longitude DECIMAL(9, 6),  -- FIXED: Was TEXT
ADD COLUMN mason_id UUID,          -- FIXED: Was VARCHAR(255)
ADD COLUMN time_spent_in_loc TEXT;

-- 3. Add Foreign Key to technical_visit_reports
ALTER TABLE technical_visit_reports
ADD CONSTRAINT fk_tvr_mason_id 
FOREIGN KEY (mason_id) 
REFERENCES mason_pc_side(id)
ON DELETE SET NULL;

-- 4. Alter gift_allocation_logs (Migration script, Unchanged)
ALTER TABLE gift_allocation_logs
ADD COLUMN technical_visit_report_id VARCHAR(255),
ADD COLUMN dealer_visit_report_id VARCHAR(255),
DROP COLUMN related_report_id;

-- Link to Technical Visit Reports
ALTER TABLE gift_allocation_logs
ADD CONSTRAINT fk_gift_logs_tvr
FOREIGN KEY (technical_visit_report_id)
REFERENCES technical_visit_reports(id)
ON DELETE SET NULL;

-- Link to Dealer Visit Reports
ALTER TABLE gift_allocation_logs
ADD CONSTRAINT fk_gift_logs_dvr
FOREIGN KEY (dealer_visit_report_id)
REFERENCES daily_visit_reports(id)
ON DELETE SET NULL;

-- 5. Create new tables (mason_pc_side, schemes_offers)
CREATE TABLE mason_pc_side (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    kyc_doc_name VARCHAR(100) NULL,
    kyc_doc_id_num VARCHAR(150) NULL,
    verification_status VARCHAR(50) NULL,
    bags_lifted INTEGER NULL,
    points_gained INTEGER NULL,
    is_referred BOOLEAN NULL,
    referred_by_user VARCHAR(255) NULL,
    referred_to_user VARCHAR(255) NULL,
    dealer_id VARCHAR(255) NULL,
    user_id INTEGER NULL,
    
    -- Foreign Keys
    CONSTRAINT fk_mason_dealer
        FOREIGN KEY(dealer_id) 
        REFERENCES dealers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_mason_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    mason_id UUID NOT NULL,
    
    -- Foreign key to link this OTP to a specific mason
    CONSTRAINT fk_otp_mason
        FOREIGN KEY(mason_id) 
        REFERENCES mason_pc_side(id)
        ON DELETE CASCADE
);

-- Index for the new OTP table
CREATE INDEX idx_otp_verifications_mason_id
ON otp_verifications(mason_id);

CREATE TABLE schemes_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    start_date TIMESTAMPTZ NULL,
    end_date TIMESTAMPTZ NULL
);

-- 6. Create Join Tables (mason_on_scheme, masons_on_meetings)
-- ADDED: This table was missing from your SQL
CREATE TABLE mason_on_scheme (
    mason_id UUID NOT NULL,
    scheme_id UUID NOT NULL,
    enrolled_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NULL,

    -- Composite Primary Key
    PRIMARY KEY (mason_id, scheme_id),

    -- Foreign Keys
    CONSTRAINT fk_mos_mason
        FOREIGN KEY(mason_id) 
        REFERENCES mason_pc_side(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_mos_scheme
        FOREIGN KEY(scheme_id) 
        REFERENCES schemes_offers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE masons_on_meetings (
    mason_id UUID NOT NULL,
    meeting_id UUID NOT NULL,
    attended_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (mason_id, meeting_id),

    CONSTRAINT fk_mom_mason
        FOREIGN KEY(mason_id) 
        REFERENCES mason_pc_side(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_mom_meeting
        FOREIGN KEY(meeting_id) 
        REFERENCES tso_meetings(id)
        ON DELETE CASCADE
);

-- 7. Create Indexes (Unchanged)
CREATE INDEX idx_gift_logs_tvr_id
ON gift_allocation_logs(technical_visit_report_id);

CREATE INDEX idx_gift_logs_dvr_id
ON gift_allocation_logs(dealer_visit_report_id);

CREATE INDEX idx_mason_pc_side_dealer_id ON mason_pc_side(dealer_id);
CREATE INDEX idx_mason_pc_side_user_id ON mason_pc_side(user_id);

CREATE INDEX idx_mom_meeting_id ON masons_on_meetings(meeting_id);
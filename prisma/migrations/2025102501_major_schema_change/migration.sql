-- -----------------------------------------------------------
-- PHASE 1: CREATE NEW CORE TABLES FOR TSO & GIFT MANAGEMENT
-- -----------------------------------------------------------

-- 1. Create the new 'tso_meetings' table (Uses DEFAULT gen_random_uuid())
CREATE TABLE tso_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL, -- Required field
    date DATE NOT NULL,
    location VARCHAR(500) NOT NULL,
    budget_allocated DECIMAL(12, 2),
    participants_count INTEGER,
    created_by_user_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    
    CONSTRAINT fk_tso_meetings_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE NO ACTION
);
CREATE INDEX idx_tso_meetings_created_by_user_id ON tso_meetings (created_by_user_id);

-- 2. Create the 'gift_inventory' table (Uses SERIAL for primary key)
CREATE TABLE gift_inventory (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) UNIQUE NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_available_quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- 3. Create the 'gift_allocation_logs' table (Uses DEFAULT gen_random_uuid())
CREATE TABLE gift_allocation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    source_user_id INTEGER,
    destination_user_id INTEGER,
    related_report_id VARCHAR(255),
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    
    CONSTRAINT fk_gift_logs_gift FOREIGN KEY (gift_id) REFERENCES gift_inventory(id) ON DELETE CASCADE,
    CONSTRAINT fk_gift_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_gift_logs_source_user FOREIGN KEY (source_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_gift_logs_dest_user FOREIGN KEY (destination_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_gift_allocation_logs_gift_id ON gift_allocation_logs (gift_id);
CREATE INDEX idx_gift_allocation_logs_user_id ON gift_allocation_logs (user_id);
CREATE INDEX idx_gift_allocation_logs_source_user_id ON gift_allocation_logs (source_user_id);
CREATE INDEX idx_gift_allocation_logs_destination_user_id ON gift_allocation_logs (destination_user_id);


-- -----------------------------------------------------------
-- PHASE 2: UPDATE EXISTING TABLES (ADD NEW COLUMNS AND FKS)
-- -----------------------------------------------------------

-- 4. Update the 'sales_orders' table (DVR Link and Payment Method)
ALTER TABLE sales_orders
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50), 
    ADD COLUMN IF NOT EXISTS dvr_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_sales_orders_dvr_id ON sales_orders (dvr_id);

-- The constraint may already exist from previous runs, so we skip if present.
ALTER TABLE sales_orders
    ADD CONSTRAINT fk_sales_orders_dvr
    FOREIGN KEY (dvr_id)
    REFERENCES daily_visit_reports (id)
    ON DELETE SET NULL;


-- 5. Update the 'technical_visit_reports' table (TSO Activity Fields & FK to tso_meetings)
ALTER TABLE technical_visit_reports
    ADD COLUMN IF NOT EXISTS site_visit_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS dhalai_verification_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS is_verification_status VARCHAR(50);

-- CRUCIAL FIX: Ensure meeting_id column is created or converted to UUID type
DO $$ 
BEGIN
    -- Check if column exists, if not, add as UUID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technical_visit_reports' AND column_name = 'meeting_id'
    ) THEN
        ALTER TABLE technical_visit_reports ADD COLUMN meeting_id UUID;
    ELSE 
        -- If it exists, convert its type to UUID to match the tso_meetings.id type
        ALTER TABLE technical_visit_reports ALTER COLUMN meeting_id TYPE UUID USING NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_technical_visit_reports_meeting_id ON technical_visit_reports (meeting_id);
-- Add the corrected constraint
ALTER TABLE technical_visit_reports
    ADD CONSTRAINT fk_technical_visit_reports_tso_meeting
    FOREIGN KEY (meeting_id)
    REFERENCES tso_meetings (id)
    ON DELETE SET NULL;


-- -----------------------------------------------------------
-- PHASE 3: DROP REDUNDANT TABLES
-- -----------------------------------------------------------

-- 6. DROP ALL UNNECESSARY TABLES (Finalized List)
DROP TABLE IF EXISTS master_connected_table CASCADE;
DROP TABLE IF EXISTS client_reports CASCADE;
DROP TABLE IF EXISTS sales_report CASCADE;
DROP TABLE IF EXISTS collection_reports CASCADE;
DROP TABLE IF EXISTS dealer_development_process CASCADE;


-- -----------------------------------------------------------
-- PHASE 4: CLEAN UP & REFINE REMAINING TABLES
-- -----------------------------------------------------------

-- 7. Update the 'dealers' table to take over DDP data and clean up old relations
ALTER TABLE dealers
    -- Remove old relations
    DROP COLUMN IF EXISTS salesReports, 
    DROP COLUMN IF EXISTS collectionReports,
    DROP COLUMN IF EXISTS ddpRecords,
    
    -- Add the DDP fields directly to the Dealer table
    ADD COLUMN IF NOT EXISTS dealerDevelopmentStatus VARCHAR(50), 
    ADD COLUMN IF NOT EXISTS dealerDevelopmentObstacle VARCHAR(500);

-- 8. Update the 'users' table (Remove redundant relations)
ALTER TABLE users
    DROP COLUMN IF EXISTS clientReports,
    DROP COLUMN IF EXISTS ddpRecords;

-- 9. Update the 'daily_visit_reports' table (Remove redundant collection relation)
ALTER TABLE daily_visit_reports
    DROP COLUMN IF EXISTS collectionReport;
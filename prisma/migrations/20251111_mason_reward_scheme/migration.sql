-- ====================================================================
-- 1. RENAME AND MODIFY EXISTING TABLES/FIELDS
-- ====================================================================

-- Rename existing table `gift_inventory` to `rewards`
ALTER TABLE gift_inventory RENAME TO rewards;

-- Correctly modify `mason_pc_side` table: break changes into separate ALTER TABLE statements
-- 1. Rename verification_status to kyc_status
ALTER TABLE mason_pc_side RENAME COLUMN verification_status TO kyc_status;
-- 2. Set default for kyc_status
ALTER TABLE mason_pc_side ALTER COLUMN kyc_status SET DEFAULT 'none';
-- 3. Rename points_gained to points_balance
ALTER TABLE mason_pc_side RENAME COLUMN points_gained TO points_balance;
-- 4. Set default for points_balance
ALTER TABLE mason_pc_side ALTER COLUMN points_balance SET DEFAULT 0;

-- Update the rewards table (was gift_inventory) properties and add categoryId
ALTER TABLE rewards
    ADD COLUMN category_id INTEGER,
    ADD COLUMN stock INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN meta JSONB,
    -- Change unit_price column type to INTEGER and rename to point_cost
    ALTER COLUMN unit_price TYPE INTEGER USING unit_price::integer,
    RENAME COLUMN unit_price TO point_cost;

-- Update `gift_allocation_logs` foreign key to point to the renamed `rewards` table
ALTER TABLE gift_allocation_logs
    -- Drop the old FK constraint (name might vary, try dropping the primary foreign key)
    DROP CONSTRAINT IF EXISTS gift_allocation_logs_gift_id_fkey,
    -- Add the new FK constraint referencing the new table name
    ADD CONSTRAINT gift_allocation_logs_gift_id_fkey
    FOREIGN KEY (gift_id) REFERENCES rewards(id) ON DELETE NO ACTION;

-- Add the foreign key for reward_categories to the rewards table
ALTER TABLE rewards
    ADD CONSTRAINT rewards_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES reward_categories(id) ON DELETE NO ACTION;


-- ====================================================================
-- 2. CREATE NEW LOYALTY TABLES
-- ====================================================================

-- 2.1 RewardCategory
CREATE TABLE reward_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL
);

-- 2.2 KYCSubmissions (References mason_pc_side.id)
CREATE TABLE kyc_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mason_id UUID NOT NULL REFERENCES mason_pc_side(id) ON DELETE CASCADE,
    aadhaar_number VARCHAR(20),
    pan_number VARCHAR(20),
    voter_id_number VARCHAR(20),
    documents JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    remark TEXT,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(6) DEFAULT now()
);
CREATE INDEX idx_kyc_submissions_mason_id ON kyc_submissions (mason_id);


-- 2.3 TSOAssignment (References users.id and mason_pc_side.id)
CREATE TABLE tso_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tso_id INTEGER NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
    mason_id UUID NOT NULL REFERENCES mason_pc_side(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    -- Composite PK
    CONSTRAINT tso_assignments_pk PRIMARY KEY (tso_id, mason_id)
);
CREATE INDEX idx_tso_mason_unique ON tso_assignments (tso_id, mason_id);


-- 2.4 BagLifts (References mason_pc_side.id, dealers.id, users.id)
CREATE TABLE bag_lifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mason_id UUID NOT NULL REFERENCES mason_pc_side(id) ON DELETE CASCADE,
    dealer_id VARCHAR(255) REFERENCES dealers(id) ON DELETE SET NULL,
    purchase_date TIMESTAMPTZ(6) NOT NULL,
    bag_count INTEGER NOT NULL,
    points_credited INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ(6),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX idx_bag_lifts_mason_id ON bag_lifts (mason_id);
CREATE INDEX idx_bag_lifts_dealer_id ON bag_lifts (dealer_id);
CREATE INDEX idx_bag_lifts_status ON bag_lifts (status);


-- 2.5 RewardRedemptions (Missing Orders Table - References mason_pc_side.id and rewards.id)
CREATE TABLE reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mason_id UUID NOT NULL REFERENCES mason_pc_side(id) ON DELETE CASCADE,
    reward_id INTEGER NOT NULL REFERENCES rewards(id) ON DELETE NO ACTION,
    quantity INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'placed', -- "placed", "approved", "shipped", "delivered", "rejected"
    points_debited INTEGER NOT NULL,
    delivery_name VARCHAR(160),
    delivery_phone VARCHAR(20),
    delivery_address TEXT,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(6) DEFAULT now()
);
CREATE INDEX idx_reward_redemptions_mason_id ON reward_redemptions (mason_id);
CREATE INDEX idx_reward_redemptions_status ON reward_redemptions (status);


-- 2.6 PointsLedger (Dedicated Audit Log - References mason_pc_side.id and the new source tables)
CREATE TABLE points_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mason_id UUID NOT NULL REFERENCES mason_pc_side(id) ON DELETE CASCADE,
    source_type VARCHAR(32) NOT NULL, -- "bag_lift", "redemption", "adjustment"
    source_id UUID, -- References bag_lifts.id or reward_redemptions.id
    points INTEGER NOT NULL, -- +ve for credit, -ve for debit
    memo TEXT,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX idx_points_ledger_mason_id ON points_ledger (mason_id);
CREATE INDEX idx_points_ledger_source_id ON points_ledger (source_id);

-- Add deferred foreign key constraints referencing the source tables
ALTER TABLE points_ledger
    ADD CONSTRAINT fk_points_ledger_bag_lift
    FOREIGN KEY (source_id) REFERENCES bag_lifts(id) ON DELETE CASCADE;

ALTER TABLE points_ledger
    ADD CONSTRAINT fk_points_ledger_redemption
    FOREIGN KEY (source_id) REFERENCES reward_redemptions(id) ON DELETE CASCADE;
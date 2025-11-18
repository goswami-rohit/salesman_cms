CREATE TABLE "technical_sites" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "site_name" VARCHAR(255) NOT NULL,
    "concerned_person" VARCHAR(255) NOT NULL,
    "phone_no" VARCHAR(20) NOT NULL,
    "address" TEXT,
    "latitude" DECIMAL(10, 7),
    "longitude" DECIMAL(10, 7),
    "site_type" VARCHAR(50),
    "area" VARCHAR(100),
    "region" VARCHAR(100),
    "key_person_name" VARCHAR(255),
    "key_person_phone_num" VARCHAR(20),
    "stage_of_construction" VARCHAR(100),
    "construction_start_date" DATE,
    "construction_end_date" DATE,
    "converted_site" BOOLEAN DEFAULT FALSE,
    "first_visit_date" DATE,
    "last_visit_date" DATE,
    "need_follow_up" BOOLEAN DEFAULT FALSE,
    "related_dealer_id" VARCHAR(255),
    "related_mason_pc_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- Index for the primary dealer FK
CREATE INDEX "idx_technical_sites_dealer_id" ON "technical_sites" ("related_dealer_id");

-- Index for the primary mason/pc FK
CREATE INDEX "idx_technical_sites_mason_id" ON "technical_sites" ("related_mason_pc_id");

-- 1. Add the foreign key column
ALTER TABLE "users" ADD COLUMN "site_id" UUID;

-- 2. Add the foreign key constraint
ALTER TABLE "users" ADD CONSTRAINT "users_site_id_fkey" 
    FOREIGN KEY ("site_id") REFERENCES "technical_sites"("id") ON DELETE SET NULL;

-- 3. Add the index for performance
CREATE INDEX "idx_user_site_id" ON "users" ("site_id");

-- 1. Add the foreign key column
ALTER TABLE "dealers" ADD COLUMN "site_id" UUID;

-- 2. Add the foreign key constraint
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_site_id_fkey" 
    FOREIGN KEY ("site_id") REFERENCES "technical_sites"("id") ON DELETE SET NULL;

-- 3. Add the index for performance
CREATE INDEX "idx_dealers_site_id" ON "dealers" ("site_id");

-- 4. Add FK from dealers to TechnicalSite (SitePrimaryDealer inverse)
ALTER TABLE "technical_sites" ADD CONSTRAINT "technical_sites_related_dealer_id_fkey" 
    FOREIGN KEY ("related_dealer_id") REFERENCES "dealers"("id") ON DELETE SET NULL;

-- 1. Add the foreign key column (if not already present from previous steps)
ALTER TABLE "mason_pc_side" ADD COLUMN "site_id" UUID;

-- 2. Add the foreign key constraint
ALTER TABLE "mason_pc_side" ADD CONSTRAINT "mason_pc_side_site_id_fkey" 
    FOREIGN KEY ("site_id") REFERENCES "technical_sites"("id") ON DELETE SET NULL;

-- 3. Add the index for performance
CREATE INDEX "idx_mason_pc_side_site_id" ON "mason_pc_side" ("site_id");

-- 4. Add FK from mason_pc_side to TechnicalSite (SitePrimaryMason inverse)
ALTER TABLE "technical_sites" ADD CONSTRAINT "technical_sites_related_mason_pc_id_fkey" 
    FOREIGN KEY ("related_mason_pc_id") REFERENCES "mason_pc_side"("id") ON DELETE SET NULL;

-- 1. Add the foreign key column
ALTER TABLE "technical_visit_reports" ADD COLUMN "site_id" UUID;

-- 2. Add the foreign key constraint
ALTER TABLE "technical_visit_reports" ADD CONSTRAINT "technical_visit_reports_site_id_fkey" 
    FOREIGN KEY ("site_id") REFERENCES "technical_sites"("id") ON DELETE SET NULL;

-- 3. Add the index for performance
CREATE INDEX "idx_tvr_site_id" ON "technical_visit_reports" ("site_id");

-- 1. Add the foreign key column
ALTER TABLE "tso_meetings" ADD COLUMN "site_id" UUID;

-- 2. Add the foreign key constraint
ALTER TABLE "tso_meetings" ADD CONSTRAINT "tso_meetings_site_id_fkey" 
    FOREIGN KEY ("site_id") REFERENCES "technical_sites"("id") ON DELETE SET NULL;

-- 3. Add the index for performance
CREATE INDEX "idx_meeting_site_id" ON "tso_meetings" ("site_id");

-- 1. Add the foreign key column
ALTER TABLE "mason_on_scheme" ADD COLUMN "site_id" UUID;

-- 2. Add the foreign key constraint
ALTER TABLE "mason_on_scheme" ADD CONSTRAINT "mason_on_scheme_site_id_fkey" 
    FOREIGN KEY ("site_id") REFERENCES "technical_sites"("id") ON DELETE SET NULL;

-- 3. Add the index for performance
CREATE INDEX "idx_mos_site_id" ON "mason_on_scheme" ("site_id");

-- 1. Add the foreign key column
ALTER TABLE "geo_tracking" ADD COLUMN "site_id" UUID;

-- 2. Add the foreign key constraint
ALTER TABLE "geo_tracking" ADD CONSTRAINT "geo_tracking_site_id_fkey" 
    FOREIGN KEY ("site_id") REFERENCES "technical_sites"("id") ON DELETE SET NULL;

-- 3. Add the index for performance
CREATE INDEX "idx_geo_site_id" ON "geo_tracking" ("site_id");

-- 1. Add the foreign key column
ALTER TABLE "daily_tasks" ADD COLUMN "site_id" UUID;

-- 2. Add the foreign key constraint
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_site_id_fkey" 
    FOREIGN KEY ("site_id") REFERENCES "technical_sites"("id") ON DELETE SET NULL;

-- 3. Add the index for performance
CREATE INDEX "idx_daily_tasks_site_id" ON "daily_tasks" ("site_id");

-- 1. Add the foreign key column
ALTER TABLE "permanent_journey_plans" ADD COLUMN "site_id" UUID;

-- 2. Add the foreign key constraint
ALTER TABLE "permanent_journey_plans" ADD CONSTRAINT "permanent_journey_plans_site_id_fkey" 
    FOREIGN KEY ("site_id") REFERENCES "technical_sites"("id") ON DELETE SET NULL;

-- 3. Add the index for performance
CREATE INDEX "idx_pjp_site_id" ON "permanent_journey_plans" ("site_id");
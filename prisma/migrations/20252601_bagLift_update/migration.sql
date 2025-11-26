-- 1. Add the new columns to the 'bag_lifts' table
ALTER TABLE "bag_lifts" 
ADD COLUMN "site_id" UUID,
ADD COLUMN "site_key_person_name" VARCHAR(255),
ADD COLUMN "site_key_person_phone" VARCHAR(20),
ADD COLUMN "verification_site_image_url" TEXT,
ADD COLUMN "verification_proof_image_url" TEXT;

-- 2. Add the Foreign Key constraint for 'site_id' linking to 'technical_sites'
-- We use ON DELETE SET NULL because if a site is deleted, we don't want to delete the bag lift record.
ALTER TABLE "bag_lifts" 
ADD CONSTRAINT "bag_lifts_site_id_fkey" 
FOREIGN KEY ("site_id") 
REFERENCES "technical_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Create an index on 'site_id' for performance (matching your @@index([siteId]) requirement)
CREATE INDEX "idx_bag_lifts_site_id" ON "bag_lifts"("site_id");
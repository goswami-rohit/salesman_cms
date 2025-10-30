--
-- 1. Changes to the "users" table
--
ALTER TABLE "users"
ADD COLUMN "no_of_pjp" INTEGER;


--
-- 2. Changes to the "dealers" table
--
ALTER TABLE "dealers"
ADD COLUMN "sales_growth_percentage" DECIMAL(5, 2),
ADD COLUMN "no_of_pjp" INTEGER;


--
-- 3. Changes to the "dealer_brand_mapping" table
--
-- Add new fields
ALTER TABLE "dealer_brand_mapping"
ADD COLUMN "user_id" INTEGER,
ADD COLUMN "best_capacity_mt" DECIMAL(12, 2),
ADD COLUMN "brand_growth_capacity_percent" DECIMAL(5, 2);

-- Add Foreign Key constraint for the new user relation
ALTER TABLE "dealer_brand_mapping"
ADD CONSTRAINT "dealer_brand_mapping_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "users"("id")
ON DELETE SET NULL; -- Assuming default ON DELETE action is similar to SET NULL for optional fields

-- Optional: Add an index for the new foreign key
CREATE INDEX "dealer_brand_mapping_user_id_idx" ON "dealer_brand_mapping"("user_id");


--
-- 4. Changes to the "permanent_journey_plans" table
--
ALTER TABLE "permanent_journey_plans"
ADD COLUMN "visit_dealer_name" VARCHAR(255);
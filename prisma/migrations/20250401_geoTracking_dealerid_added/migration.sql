-- 1. Add the dealer_id column to the geo_tracking table
ALTER TABLE "geo_tracking" 
ADD COLUMN "dealer_id" VARCHAR(255);

-- 2. Create an index on the new column for query performance
CREATE INDEX "idx_geo_dealer_id" 
ON "geo_tracking"("dealer_id");

-- 3. Add the Foreign Key constraint linking to the dealers table
--    (Matches @relation(..., onDelete: SetNull))
ALTER TABLE "geo_tracking" 
ADD CONSTRAINT "geo_tracking_dealer_id_fkey" 
FOREIGN KEY ("dealer_id") 
REFERENCES "dealers"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;
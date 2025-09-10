-- Add latitude and longitude columns to the dealers table
ALTER TABLE "dealers" ADD COLUMN "latitude" DECIMAL(10, 7);
ALTER TABLE "dealers" ADD COLUMN "longitude" DECIMAL(10, 7);
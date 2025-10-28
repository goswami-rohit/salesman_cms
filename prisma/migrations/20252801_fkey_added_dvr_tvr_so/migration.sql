--
-- 1. ADD PJP Foreign Key to DailyVisitReport (daily_visit_reports)
--

-- Add the new column pjp_id (VARCHAR(255) as per the Prisma @db.VarChar)
ALTER TABLE daily_visit_reports
ADD COLUMN pjp_id VARCHAR(255);

-- Add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE daily_visit_reports
ADD CONSTRAINT fk_daily_visit_reports_pjp_id
FOREIGN KEY (pjp_id)
REFERENCES permanent_journey_plans(id)
ON DELETE SET NULL;

-- Create an index on the new foreign key column for faster lookups
CREATE INDEX idx_daily_visit_reports_pjp_id ON daily_visit_reports (pjp_id);


---

--
-- 2. ADD PJP Foreign Key to TechnicalVisitReport (technical_visit_reports)
--

-- Add the new column pjp_id (VARCHAR(255) as per the Prisma @db.VarChar)
ALTER TABLE technical_visit_reports
ADD COLUMN pjp_id VARCHAR(255);

-- Add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE technical_visit_reports
ADD CONSTRAINT fk_technical_visit_reports_pjp_id
FOREIGN KEY (pjp_id)
REFERENCES permanent_journey_plans(id)
ON DELETE SET NULL;

-- Create an index on the new foreign key column for faster lookups
CREATE INDEX idx_technical_visit_reports_pjp_id ON technical_visit_reports (pjp_id);


---

--
-- 3. ADD PJP Foreign Key to SalesOrder (sales_orders)
--

-- Add the new column pjp_id (VARCHAR(255) as per the Prisma @db.VarChar)
ALTER TABLE sales_orders
ADD COLUMN pjp_id VARCHAR(255);

-- Add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE sales_orders
ADD CONSTRAINT fk_sales_orders_pjp_id
FOREIGN KEY (pjp_id)
REFERENCES permanent_journey_plans(id)
ON DELETE SET NULL;

-- Create an index on the new foreign key column for faster lookups
CREATE INDEX idx_sales_orders_pjp_id ON sales_orders (pjp_id);

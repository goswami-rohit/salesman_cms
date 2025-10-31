-- PJP
-- 1) Add FK column
ALTER TABLE permanent_journey_plans
  ADD COLUMN IF NOT EXISTS dealer_id varchar(255);

-- 2) Create FK constraint
ALTER TABLE permanent_journey_plans
  ADD CONSTRAINT fk_pjp_dealer_id
  FOREIGN KEY (dealer_id) REFERENCES dealers(id)
  ON DELETE SET NULL;

-- 3) Create index
CREATE INDEX IF NOT EXISTS idx_pjp_dealer_id
  ON permanent_journey_plans(dealer_id);

-- 4) Drop old text column
ALTER TABLE permanent_journey_plans
  DROP COLUMN IF EXISTS visit_dealer_name;

-- DVR 
-- 1) Add FK columns
ALTER TABLE daily_visit_reports
  ADD COLUMN IF NOT EXISTS dealer_id varchar(255),
  ADD COLUMN IF NOT EXISTS sub_dealer_id varchar(255);

-- 2) Create FK constraints
ALTER TABLE daily_visit_reports
  ADD CONSTRAINT fk_dvr_dealer_id
  FOREIGN KEY (dealer_id) REFERENCES dealers(id)
  ON DELETE SET NULL;

ALTER TABLE daily_visit_reports
  ADD CONSTRAINT fk_dvr_sub_dealer_id
  FOREIGN KEY (sub_dealer_id) REFERENCES dealers(id)
  ON DELETE SET NULL;

-- 3) Create indexes
CREATE INDEX IF NOT EXISTS idx_dvr_dealer_id
  ON daily_visit_reports(dealer_id);

CREATE INDEX IF NOT EXISTS idx_dvr_sub_dealer_id
  ON daily_visit_reports(sub_dealer_id);

-- 4) Drop old text columns
ALTER TABLE daily_visit_reports
  DROP COLUMN IF EXISTS dealer_name,
  DROP COLUMN IF EXISTS sub_dealer_name;

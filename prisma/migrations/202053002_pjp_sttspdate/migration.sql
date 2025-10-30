--
-- 5. Additional Changes to the "permanent_journey_plans" table
--
ALTER TABLE "permanent_journey_plans"
ADD COLUMN "verification_status" VARCHAR(50), -- for PJP verfication status
ADD COLUMN "additional_visit_remarks" VARCHAR(500); -- for additionalVistRemarks
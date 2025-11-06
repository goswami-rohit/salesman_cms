-- same columns as above
ALTER TABLE permanent_journey_plans
ADD COLUMN bulk_op_id VARCHAR(50);

ALTER TABLE permanent_journey_plans
ADD COLUMN idempotency_key VARCHAR(120);

CREATE INDEX idx_pjp_bulk_op_id
  ON permanent_journey_plans (bulk_op_id);

-- enforce per-day uniqueness (does NOT block next month)
CREATE UNIQUE INDEX uniq_pjp_user_dealer_plan_date
  ON permanent_journey_plans (user_id, dealer_id, plan_date);

-- optional idempotency (only when provided)
CREATE UNIQUE INDEX uniq_pjp_idempotency_key_not_null
  ON permanent_journey_plans (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

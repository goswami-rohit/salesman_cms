DROP TABLE IF EXISTS sales_orders CASCADE;

CREATE TABLE sales_orders (
  id                          VARCHAR(255) PRIMARY KEY,

  user_id                     INTEGER,
  dealer_id                   VARCHAR(255),
  dvr_id                      VARCHAR(255),
  pjp_id                      VARCHAR(255),

  order_date                  DATE NOT NULL,
  order_party_name            VARCHAR(255) NOT NULL,

  party_phone_no              VARCHAR(20),
  party_area                  VARCHAR(255),
  party_region                VARCHAR(255),
  party_address               VARCHAR(500),

  delivery_date               DATE,
  delivery_area               VARCHAR(255),
  delivery_region             VARCHAR(255),
  delivery_address            VARCHAR(500),
  delivery_loc_pincode        VARCHAR(10),

  payment_mode                VARCHAR(50),
  payment_terms               VARCHAR(500),
  payment_amount              DECIMAL(12,2),
  received_payment            DECIMAL(12,2),
  received_payment_date       DATE,
  pending_payment             DECIMAL(12,2),

  order_qty                   DECIMAL(12,3),
  order_unit                  VARCHAR(20),

  item_price                  DECIMAL(12,2),
  discount_percentage         DECIMAL(5,2),
  item_price_after_discount   DECIMAL(12,2),

  item_type                   VARCHAR(20),
  item_grade                  VARCHAR(10),

  created_at                  TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ(6) DEFAULT NOW()
);

-- FKs
ALTER TABLE sales_orders
  ADD CONSTRAINT fk_sales_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE sales_orders
  ADD CONSTRAINT fk_sales_orders_dealer
    FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL;

ALTER TABLE sales_orders
  ADD CONSTRAINT fk_sales_orders_dvr
    FOREIGN KEY (dvr_id) REFERENCES daily_visit_reports(id) ON DELETE SET NULL;

ALTER TABLE sales_orders
  ADD CONSTRAINT fk_sales_orders_pjp
    FOREIGN KEY (pjp_id) REFERENCES permanent_journey_plans(id) ON DELETE SET NULL;

-- Indexes aligned with Prisma
CREATE INDEX idx_sales_orders_user_id ON sales_orders(user_id);
CREATE INDEX idx_sales_orders_dealer_id ON sales_orders(dealer_id);
CREATE INDEX idx_sales_orders_dvr_id ON sales_orders(dvr_id);
CREATE INDEX idx_sales_orders_pjp_id ON sales_orders(pjp_id);
CREATE INDEX idx_sales_orders_order_date ON sales_orders(order_date);

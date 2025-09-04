-- 20205903_added_sales_order/migration.sql

-- Add new columns to dealers
ALTER TABLE "public"."dealers"
ADD COLUMN "pinCode" VARCHAR(20),
ADD COLUMN "dateOfBirth" DATE,
ADD COLUMN "anniversaryDate" DATE;

-- Create Sales Orders table
CREATE TABLE "public"."sales_orders" (
    "id" VARCHAR(255) NOT NULL,
    "salesman_id" INTEGER,
    "dealer_id" VARCHAR(255),
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "orderTotal" DECIMAL(12,2) NOT NULL,
    "advancePayment" DECIMAL(12,2) NOT NULL,
    "pendingPayment" DECIMAL(12,2) NOT NULL,
    "estimatedDelivery" DATE NOT NULL,
    "remarks" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- Add FKs for Sales Orders
ALTER TABLE "public"."sales_orders"
ADD CONSTRAINT "sales_orders_salesman_id_fkey" FOREIGN KEY ("salesman_id")
REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."sales_orders"
ADD CONSTRAINT "sales_orders_dealer_id_fkey" FOREIGN KEY ("dealer_id")
REFERENCES "public"."dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update Master Connected Table
ALTER TABLE "public"."master_connected_table"
ADD COLUMN "salesOrderId" VARCHAR(255);

CREATE INDEX "idx_mct_sales_order_id" 
ON "public"."master_connected_table"("salesOrderId");

-- Add relation from MCT to Sales Orders
ALTER TABLE "public"."master_connected_table"
ADD CONSTRAINT "mct_sales_order_fkey" FOREIGN KEY ("salesOrderId")
REFERENCES "public"."sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

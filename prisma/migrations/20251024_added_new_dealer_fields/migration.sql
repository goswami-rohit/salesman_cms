--Altered dealer table

-- --- Verification Status ---
ALTER TABLE "dealers" ADD COLUMN "verification_status" VARCHAR(50) NOT NULL DEFAULT 'PENDING';

-- --- Contact & Business Info ---
ALTER TABLE "dealers" ADD COLUMN "whatsapp_no" VARCHAR(20) NULL;
ALTER TABLE "dealers" ADD COLUMN "email_id" VARCHAR(255) NULL;
ALTER TABLE "dealers" ADD COLUMN "business_type" VARCHAR(100) NULL;

-- --- Statutory IDs ---
ALTER TABLE "dealers" ADD COLUMN "gstin_no" VARCHAR(20) NULL;
ALTER TABLE "dealers" ADD COLUMN "pan_no" VARCHAR(20) NULL;
ALTER TABLE "dealers" ADD COLUMN "trade_lic_no" VARCHAR(150) NULL;
ALTER TABLE "dealers" ADD COLUMN "aadhar_no" VARCHAR(20) NULL;

-- --- Godown Details ---
ALTER TABLE "dealers" ADD COLUMN "godown_size_sqft" INTEGER NULL;
ALTER TABLE "dealers" ADD COLUMN "godown_capacity_mt_bags" VARCHAR(500) NULL;
ALTER TABLE "dealers" ADD COLUMN "godown_address_line" VARCHAR(500) NULL;
ALTER TABLE "dealers" ADD COLUMN "godown_landmark" VARCHAR(255) NULL;
ALTER TABLE "dealers" ADD COLUMN "godown_district" VARCHAR(100) NULL;
ALTER TABLE "dealers" ADD COLUMN "godown_area" VARCHAR(255) NULL;
ALTER TABLE "dealers" ADD COLUMN "godown_region" VARCHAR(100) NULL;
ALTER TABLE "dealers" ADD COLUMN "godown_pincode" VARCHAR(20) NULL;

-- --- Residential Address Details ---
ALTER TABLE "dealers" ADD COLUMN "residential_address_line" VARCHAR(500) NULL;
ALTER TABLE "dealers" ADD COLUMN "residential_landmark" VARCHAR(255) NULL;
ALTER TABLE "dealers" ADD COLUMN "residential_district" VARCHAR(100) NULL;
ALTER TABLE "dealers" ADD COLUMN "residential_area" VARCHAR(255) NULL;
ALTER TABLE "dealers" ADD COLUMN "residential_region" VARCHAR(100) NULL;
ALTER TABLE "dealers" ADD COLUMN "residential_pincode" VARCHAR(20) NULL;

-- --- Bank Details ---
ALTER TABLE "dealers" ADD COLUMN "bank_account_name" VARCHAR(255) NULL;
ALTER TABLE "dealers" ADD COLUMN "bank_name" VARCHAR(255) NULL;
ALTER TABLE "dealers" ADD COLUMN "bank_branch_address" VARCHAR(500) NULL;
ALTER TABLE "dealers" ADD COLUMN "bank_account_number" VARCHAR(50) NULL;
ALTER TABLE "dealers" ADD COLUMN "bank_ifsc_code" VARCHAR(50) NULL;

-- --- Sales & Promoter Details ---
ALTER TABLE "dealers" ADD COLUMN "brand_name" VARCHAR(255) NULL;
ALTER TABLE "dealers" ADD COLUMN "monthly_sale_mt" DECIMAL(10, 2) NULL;
ALTER TABLE "dealers" ADD COLUMN "no_of_dealers" INTEGER NULL;
ALTER TABLE "dealers" ADD COLUMN "area_covered" VARCHAR(255) NULL;
ALTER TABLE "dealers" ADD COLUMN "projected_monthly_sales_best_cement_mt" DECIMAL(10, 2) NULL;
ALTER TABLE "dealers" ADD COLUMN "no_of_employees_in_sales" INTEGER NULL;

-- --- Declaration ---
ALTER TABLE "dealers" ADD COLUMN "declaration_name" VARCHAR(255) NULL;
ALTER TABLE "dealers" ADD COLUMN "declaration_place" VARCHAR(100) NULL;
ALTER TABLE "dealers" ADD COLUMN "declaration_date" DATE NULL;

-- --- Document/Image URLs ---
ALTER TABLE "dealers" ADD COLUMN "trade_licence_pic_url" VARCHAR(500) NULL;
ALTER TABLE "dealers" ADD COLUMN "shop_pic_url" VARCHAR(500) NULL;
ALTER TABLE "dealers" ADD COLUMN "dealer_pic_url" VARCHAR(500) NULL;
ALTER TABLE "dealers" ADD COLUMN "blank_cheque_pic_url" VARCHAR(500) NULL;
ALTER TABLE "dealers" ADD COLUMN "partnership_deed_pic_url" VARCHAR(500) NULL;
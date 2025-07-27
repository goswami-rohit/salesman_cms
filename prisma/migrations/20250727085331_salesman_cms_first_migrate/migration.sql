-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "office_address" TEXT NOT NULL,
    "is_head_office" BOOLEAN NOT NULL DEFAULT true,
    "phone_number" VARCHAR(50) NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "workos_organization_id" TEXT,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "workos_user_id" TEXT NOT NULL,
    "company_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "phone_number" VARCHAR(50),
    "inviteToken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "salesman_login_id" TEXT,
    "hashed_password" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_visit_reports" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "report_date" DATE NOT NULL,
    "dealer_type" VARCHAR(50) NOT NULL,
    "dealer_name" VARCHAR(255),
    "sub_dealer_name" VARCHAR(255),
    "location" VARCHAR(500) NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "visit_type" VARCHAR(50) NOT NULL,
    "dealer_total_potential" DECIMAL(10,2) NOT NULL,
    "dealer_best_potential" DECIMAL(10,2) NOT NULL,
    "brand_selling" TEXT[],
    "contact_person" VARCHAR(255),
    "contact_person_phone_no" VARCHAR(20),
    "today_order_mt" DECIMAL(10,2) NOT NULL,
    "today_collection_rupees" DECIMAL(10,2) NOT NULL,
    "feedbacks" VARCHAR(500) NOT NULL,
    "solution_by_salesperson" VARCHAR(500),
    "any_remarks" VARCHAR(500),
    "check_in_time" TIMESTAMPTZ(6) NOT NULL,
    "check_out_time" TIMESTAMPTZ(6),
    "in_time_image_url" VARCHAR(500),
    "out_time_image_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_visit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_visit_reports" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "report_date" DATE NOT NULL,
    "visit_type" VARCHAR(50) NOT NULL,
    "site_name_concerned_person" VARCHAR(255) NOT NULL,
    "phone_no" VARCHAR(20) NOT NULL,
    "email_id" VARCHAR(255),
    "clients_remarks" VARCHAR(500) NOT NULL,
    "salesperson_remarks" VARCHAR(500) NOT NULL,
    "check_in_time" TIMESTAMPTZ(6) NOT NULL,
    "check_out_time" TIMESTAMPTZ(6),
    "in_time_image_url" VARCHAR(500),
    "out_time_image_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technical_visit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permanent_journey_plans" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan_date" DATE NOT NULL,
    "area_to_be_visited" VARCHAR(500) NOT NULL,
    "description" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permanent_journey_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealers" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "parent_dealer_id" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "region" VARCHAR(100) NOT NULL,
    "area" VARCHAR(255) NOT NULL,
    "phone_no" VARCHAR(20) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "total_potential" DECIMAL(10,2) NOT NULL,
    "best_potential" DECIMAL(10,2) NOT NULL,
    "brand_selling" TEXT[],
    "feedbacks" VARCHAR(500) NOT NULL,
    "remarks" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salesman_attendance" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "attendance_date" DATE NOT NULL,
    "location_name" VARCHAR(500) NOT NULL,
    "in_time_timestamp" TIMESTAMPTZ(6) NOT NULL,
    "out_time_timestamp" TIMESTAMPTZ(6),
    "in_time_image_captured" BOOLEAN NOT NULL,
    "out_time_image_captured" BOOLEAN NOT NULL,
    "in_time_image_url" VARCHAR(500),
    "out_time_image_url" VARCHAR(500),
    "in_time_latitude" DECIMAL(10,7) NOT NULL,
    "in_time_longitude" DECIMAL(10,7) NOT NULL,
    "in_time_accuracy" DECIMAL(10,2),
    "in_time_speed" DECIMAL(10,2),
    "in_time_heading" DECIMAL(10,2),
    "in_time_altitude" DECIMAL(10,2),
    "out_time_latitude" DECIMAL(10,7),
    "out_time_longitude" DECIMAL(10,7),
    "out_time_accuracy" DECIMAL(10,2),
    "out_time_speed" DECIMAL(10,2),
    "out_time_heading" DECIMAL(10,2),
    "out_time_altitude" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salesman_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salesman_leave_applications" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "leave_type" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "admin_remarks" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salesman_leave_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_admin_user_id_key" ON "companies"("admin_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_workos_organization_id_key" ON "companies"("workos_organization_id");

-- CreateIndex
CREATE INDEX "idx_admin_user_id" ON "companies"("admin_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_workos_user_id_key" ON "users"("workos_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_inviteToken_key" ON "users"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_salesman_login_id_key" ON "users"("salesman_login_id");

-- CreateIndex
CREATE INDEX "idx_user_company_id" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "idx_workos_user_id" ON "users"("workos_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_id_email_key" ON "users"("company_id", "email");

-- CreateIndex
CREATE INDEX "idx_daily_visit_reports_user_id" ON "daily_visit_reports"("user_id");

-- CreateIndex
CREATE INDEX "idx_technical_visit_reports_user_id" ON "technical_visit_reports"("user_id");

-- CreateIndex
CREATE INDEX "idx_permanent_journey_plans_user_id" ON "permanent_journey_plans"("user_id");

-- CreateIndex
CREATE INDEX "idx_dealers_user_id" ON "dealers"("user_id");

-- CreateIndex
CREATE INDEX "idx_dealers_parent_dealer_id" ON "dealers"("parent_dealer_id");

-- CreateIndex
CREATE INDEX "idx_salesman_attendance_user_id" ON "salesman_attendance"("user_id");

-- CreateIndex
CREATE INDEX "idx_salesman_leave_applications_user_id" ON "salesman_leave_applications"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "daily_visit_reports" ADD CONSTRAINT "daily_visit_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_visit_reports" ADD CONSTRAINT "technical_visit_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permanent_journey_plans" ADD CONSTRAINT "permanent_journey_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_parent_dealer_id_fkey" FOREIGN KEY ("parent_dealer_id") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salesman_attendance" ADD CONSTRAINT "salesman_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salesman_leave_applications" ADD CONSTRAINT "salesman_leave_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

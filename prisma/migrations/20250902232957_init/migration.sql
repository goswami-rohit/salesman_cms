-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" SERIAL NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "office_address" TEXT NOT NULL,
    "is_head_office" BOOLEAN NOT NULL DEFAULT true,
    "phone_number" VARCHAR(50) NOT NULL,
    "region" TEXT,
    "area" TEXT,
    "admin_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "workos_organization_id" TEXT,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "workos_user_id" TEXT,
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
    "region" TEXT,
    "area" TEXT,
    "salesman_login_id" TEXT,
    "hashed_password" TEXT,
    "reports_to_id" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_visit_reports" (
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
    "overdue_amount" DECIMAL(12,2),
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
CREATE TABLE "public"."technical_visit_reports" (
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
    "site_visit_brand_in_use" TEXT[],
    "site_visit_stage" TEXT,
    "conversion_from_brand" TEXT,
    "conversion_quantity_value" DECIMAL(10,2),
    "conversion_quantity_unit" VARCHAR(20),
    "associated_party_name" TEXT,
    "influencer_type" TEXT[],
    "service_type" TEXT,
    "quality_complaint" TEXT,
    "promotional_activity" TEXT,
    "channel_partner_visit" TEXT,

    CONSTRAINT "technical_visit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permanent_journey_plans" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "plan_date" DATE NOT NULL,
    "area_to_be_visited" VARCHAR(500) NOT NULL,
    "description" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permanent_journey_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dealers" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER,
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
CREATE TABLE "public"."salesman_attendance" (
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
CREATE TABLE "public"."salesman_leave_applications" (
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

-- CreateTable
CREATE TABLE "public"."client_reports" (
    "id" TEXT NOT NULL,
    "dealerType" TEXT NOT NULL,
    "dealer_sub_dealer_name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type_best_non_best" TEXT NOT NULL,
    "dealerTotalPotential" DECIMAL(10,2) NOT NULL,
    "dealerBestPotential" DECIMAL(10,2) NOT NULL,
    "brandSelling" TEXT[],
    "contactPerson" TEXT NOT NULL,
    "contact_person_phone_no" TEXT NOT NULL,
    "today_order_mt" DECIMAL(10,2) NOT NULL,
    "today_collection_rupees" DECIMAL(10,2) NOT NULL,
    "feedbacks" TEXT NOT NULL,
    "solutions_as_per_salesperson" TEXT NOT NULL,
    "anyRemarks" TEXT NOT NULL,
    "check_out_time" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."competition_reports" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "report_date" DATE NOT NULL,
    "brand_name" VARCHAR(255) NOT NULL,
    "billing" VARCHAR(100) NOT NULL,
    "nod" VARCHAR(100) NOT NULL,
    "retail" VARCHAR(100) NOT NULL,
    "schemes_yes_no" VARCHAR(10) NOT NULL,
    "avg_scheme_cost" DECIMAL(10,2) NOT NULL,
    "remarks" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "competition_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."geo_tracking" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accuracy" DECIMAL(10,2),
    "speed" DECIMAL(10,2),
    "heading" DECIMAL(10,2),
    "altitude" DECIMAL(10,2),
    "location_type" VARCHAR(50),
    "activity_type" VARCHAR(50),
    "app_state" VARCHAR(50),
    "battery_level" DECIMAL(5,2),
    "is_charging" BOOLEAN,
    "network_status" VARCHAR(50),
    "ip_address" VARCHAR(45),
    "site_name" VARCHAR(255),
    "check_in_time" TIMESTAMPTZ(6),
    "check_out_time" TIMESTAMPTZ(6),
    "total_distance_travelled" DECIMAL(10,3),
    "journey_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "dest_lat" DECIMAL(10,7),
    "dest_lng" DECIMAL(10,7),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "geo_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_tasks" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "assigned_by_user_id" INTEGER NOT NULL,
    "task_date" DATE NOT NULL,
    "visit_type" VARCHAR(50) NOT NULL,
    "related_dealer_id" VARCHAR(255),
    "site_name" VARCHAR(255),
    "description" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Assigned',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pjp_id" VARCHAR(255),

    CONSTRAINT "daily_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dealer_reports_and_scores" (
    "id" VARCHAR(255) NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "dealer_score" DECIMAL(10,2) NOT NULL,
    "trust_worthiness_score" DECIMAL(10,2) NOT NULL,
    "credit_worthiness_score" DECIMAL(10,2) NOT NULL,
    "order_history_score" DECIMAL(10,2) NOT NULL,
    "visit_frequency_score" DECIMAL(10,2) NOT NULL,
    "last_updated_date" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealer_reports_and_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_report" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "monthly_target" DECIMAL(12,2) NOT NULL,
    "till_date_achievement" DECIMAL(12,2) NOT NULL,
    "yesterday_target" DECIMAL(12,2),
    "yesterday_achievement" DECIMAL(12,2),
    "sales_person_id" INTEGER NOT NULL,
    "dealer_id" TEXT NOT NULL,

    CONSTRAINT "sales_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."collection_reports" (
    "id" VARCHAR(255) NOT NULL,
    "dvr_id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "collected_amount" DECIMAL(12,2) NOT NULL,
    "collected_on_date" DATE NOT NULL,
    "weekly_target" DECIMAL(12,2),
    "till_date_achievement" DECIMAL(12,2),
    "yesterday_target" DECIMAL(12,2),
    "yesterday_achievement" DECIMAL(12,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dealer_development_process" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "creation_date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "obstacle" TEXT,

    CONSTRAINT "dealer_development_process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ratings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "area" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."brands" (
    "id" SERIAL NOT NULL,
    "brand_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dealer_brand_mapping" (
    "id" VARCHAR(255) NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "capacity_mt" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "dealer_brand_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."master_connected_table" (
    "id" VARCHAR(255) NOT NULL,
    "companyId" INTEGER,
    "userId" INTEGER,
    "dealerId" VARCHAR(255),
    "dvrId" VARCHAR(255),
    "tvrId" VARCHAR(255),
    "permanentJourneyPlanId" VARCHAR(255),
    "permanentJourneyPlanCreatedById" INTEGER,
    "dailyTaskId" VARCHAR(255),
    "attendanceId" VARCHAR(255),
    "leaveApplicationId" VARCHAR(255),
    "clientReportId" VARCHAR(255),
    "competitionReportId" VARCHAR(255),
    "geoTrackingId" VARCHAR(255),
    "dealerReportsAndScoresId" VARCHAR(255),
    "salesReportId" INTEGER,
    "collectionReportId" VARCHAR(255),
    "ddpId" INTEGER,
    "ratingId" INTEGER,
    "brandId" INTEGER,
    "dealerBrandMappingId" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_connected_table_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_admin_user_id_key" ON "public"."companies"("admin_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_workos_organization_id_key" ON "public"."companies"("workos_organization_id");

-- CreateIndex
CREATE INDEX "idx_admin_user_id" ON "public"."companies"("admin_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_workos_user_id_key" ON "public"."users"("workos_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_inviteToken_key" ON "public"."users"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_salesman_login_id_key" ON "public"."users"("salesman_login_id");

-- CreateIndex
CREATE INDEX "idx_user_company_id" ON "public"."users"("company_id");

-- CreateIndex
CREATE INDEX "idx_workos_user_id" ON "public"."users"("workos_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_id_email_key" ON "public"."users"("company_id", "email");

-- CreateIndex
CREATE INDEX "idx_daily_visit_reports_user_id" ON "public"."daily_visit_reports"("user_id");

-- CreateIndex
CREATE INDEX "idx_technical_visit_reports_user_id" ON "public"."technical_visit_reports"("user_id");

-- CreateIndex
CREATE INDEX "idx_permanent_journey_plans_user_id" ON "public"."permanent_journey_plans"("user_id");

-- CreateIndex
CREATE INDEX "idx_permanent_journey_plans_created_by_id" ON "public"."permanent_journey_plans"("created_by_id");

-- CreateIndex
CREATE INDEX "idx_dealers_user_id" ON "public"."dealers"("user_id");

-- CreateIndex
CREATE INDEX "idx_dealers_parent_dealer_id" ON "public"."dealers"("parent_dealer_id");

-- CreateIndex
CREATE INDEX "idx_salesman_attendance_user_id" ON "public"."salesman_attendance"("user_id");

-- CreateIndex
CREATE INDEX "idx_salesman_leave_applications_user_id" ON "public"."salesman_leave_applications"("user_id");

-- CreateIndex
CREATE INDEX "competition_reports_user_id_idx" ON "public"."competition_reports"("user_id");

-- CreateIndex
CREATE INDEX "idx_geo_user_time" ON "public"."geo_tracking"("user_id", "recorded_at");

-- CreateIndex
CREATE INDEX "idx_geo_journey_time" ON "public"."geo_tracking"("journey_id", "recorded_at");

-- CreateIndex
CREATE INDEX "idx_geo_active" ON "public"."geo_tracking"("is_active");

-- CreateIndex
CREATE INDEX "idx_geo_tracking_user_id" ON "public"."geo_tracking"("user_id");

-- CreateIndex
CREATE INDEX "idx_geo_tracking_recorded_at" ON "public"."geo_tracking"("recorded_at");

-- CreateIndex
CREATE INDEX "idx_daily_tasks_user_id" ON "public"."daily_tasks"("user_id");

-- CreateIndex
CREATE INDEX "idx_daily_tasks_assigned_by_user_id" ON "public"."daily_tasks"("assigned_by_user_id");

-- CreateIndex
CREATE INDEX "idx_daily_tasks_task_date" ON "public"."daily_tasks"("task_date");

-- CreateIndex
CREATE INDEX "idx_daily_tasks_pjp_id" ON "public"."daily_tasks"("pjp_id");

-- CreateIndex
CREATE INDEX "idx_daily_tasks_related_dealer_id" ON "public"."daily_tasks"("related_dealer_id");

-- CreateIndex
CREATE INDEX "idx_daily_tasks_date_user" ON "public"."daily_tasks"("task_date", "user_id");

-- CreateIndex
CREATE INDEX "idx_daily_tasks_status" ON "public"."daily_tasks"("status");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_reports_and_scores_dealer_id_key" ON "public"."dealer_reports_and_scores"("dealer_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_reports_dvr_id_key" ON "public"."collection_reports"("dvr_id");

-- CreateIndex
CREATE INDEX "idx_collection_reports_dealer_id" ON "public"."collection_reports"("dealer_id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_brand_name_key" ON "public"."brands"("brand_name");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_brand_mapping_dealer_id_brand_id_key" ON "public"."dealer_brand_mapping"("dealer_id", "brand_id");

-- CreateIndex
CREATE INDEX "idx_mct_company_id" ON "public"."master_connected_table"("companyId");

-- CreateIndex
CREATE INDEX "idx_mct_user_id" ON "public"."master_connected_table"("userId");

-- CreateIndex
CREATE INDEX "idx_mct_dealer_id" ON "public"."master_connected_table"("dealerId");

-- CreateIndex
CREATE INDEX "idx_mct_pjp_id" ON "public"."master_connected_table"("permanentJourneyPlanId");

-- CreateIndex
CREATE INDEX "idx_mct_pjp_created_by_id" ON "public"."master_connected_table"("permanentJourneyPlanCreatedById");

-- CreateIndex
CREATE INDEX "idx_mct_dailytask_id" ON "public"."master_connected_table"("dailyTaskId");

-- CreateIndex
CREATE INDEX "idx_mct_dvr_id" ON "public"."master_connected_table"("dvrId");

-- CreateIndex
CREATE INDEX "idx_mct_tvr_id" ON "public"."master_connected_table"("tvrId");

-- CreateIndex
CREATE INDEX "idx_mct_attendance_id" ON "public"."master_connected_table"("attendanceId");

-- CreateIndex
CREATE INDEX "idx_mct_leave_id" ON "public"."master_connected_table"("leaveApplicationId");

-- CreateIndex
CREATE INDEX "idx_mct_client_report_id" ON "public"."master_connected_table"("clientReportId");

-- CreateIndex
CREATE INDEX "idx_mct_comp_report_id" ON "public"."master_connected_table"("competitionReportId");

-- CreateIndex
CREATE INDEX "idx_mct_geotracking_id" ON "public"."master_connected_table"("geoTrackingId");

-- CreateIndex
CREATE INDEX "idx_mct_dealer_scores_id" ON "public"."master_connected_table"("dealerReportsAndScoresId");

-- CreateIndex
CREATE INDEX "idx_mct_sales_report_id" ON "public"."master_connected_table"("salesReportId");

-- CreateIndex
CREATE INDEX "idx_mct_collection_report_id" ON "public"."master_connected_table"("collectionReportId");

-- CreateIndex
CREATE INDEX "idx_mct_ddp_id" ON "public"."master_connected_table"("ddpId");

-- CreateIndex
CREATE INDEX "idx_mct_rating_id" ON "public"."master_connected_table"("ratingId");

-- CreateIndex
CREATE INDEX "idx_mct_brand_id" ON "public"."master_connected_table"("brandId");

-- CreateIndex
CREATE INDEX "idx_mct_dealer_brand_map_id" ON "public"."master_connected_table"("dealerBrandMappingId");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_reports_to_id_fkey" FOREIGN KEY ("reports_to_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_visit_reports" ADD CONSTRAINT "daily_visit_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."technical_visit_reports" ADD CONSTRAINT "technical_visit_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permanent_journey_plans" ADD CONSTRAINT "permanent_journey_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permanent_journey_plans" ADD CONSTRAINT "permanent_journey_plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dealers" ADD CONSTRAINT "dealers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dealers" ADD CONSTRAINT "dealers_parent_dealer_id_fkey" FOREIGN KEY ("parent_dealer_id") REFERENCES "public"."dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salesman_attendance" ADD CONSTRAINT "salesman_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salesman_leave_applications" ADD CONSTRAINT "salesman_leave_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_reports" ADD CONSTRAINT "client_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competition_reports" ADD CONSTRAINT "competition_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."geo_tracking" ADD CONSTRAINT "geo_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_tasks" ADD CONSTRAINT "daily_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_tasks" ADD CONSTRAINT "daily_tasks_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_tasks" ADD CONSTRAINT "daily_tasks_related_dealer_id_fkey" FOREIGN KEY ("related_dealer_id") REFERENCES "public"."dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_tasks" ADD CONSTRAINT "daily_tasks_pjp_id_fkey" FOREIGN KEY ("pjp_id") REFERENCES "public"."permanent_journey_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dealer_reports_and_scores" ADD CONSTRAINT "dealer_reports_and_scores_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_report" ADD CONSTRAINT "sales_report_sales_person_id_fkey" FOREIGN KEY ("sales_person_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_report" ADD CONSTRAINT "sales_report_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collection_reports" ADD CONSTRAINT "collection_reports_dvr_id_fkey" FOREIGN KEY ("dvr_id") REFERENCES "public"."daily_visit_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collection_reports" ADD CONSTRAINT "collection_reports_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dealer_development_process" ADD CONSTRAINT "dealer_development_process_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dealer_development_process" ADD CONSTRAINT "dealer_development_process_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dealer_brand_mapping" ADD CONSTRAINT "dealer_brand_mapping_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dealer_brand_mapping" ADD CONSTRAINT "dealer_brand_mapping_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


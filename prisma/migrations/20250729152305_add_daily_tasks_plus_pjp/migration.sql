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

-- CreateIndex
CREATE INDEX "idx_daily_tasks_user_id" ON "public"."daily_tasks"("user_id");

-- CreateIndex
CREATE INDEX "idx_daily_tasks_assigned_by_user_id" ON "public"."daily_tasks"("assigned_by_user_id");

-- CreateIndex
CREATE INDEX "idx_daily_tasks_task_date" ON "public"."daily_tasks"("task_date");

-- CreateIndex
CREATE INDEX "idx_daily_tasks_pjp_id" ON "public"."daily_tasks"("pjp_id");

-- AddForeignKey
ALTER TABLE "public"."daily_tasks" ADD CONSTRAINT "daily_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_tasks" ADD CONSTRAINT "daily_tasks_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_tasks" ADD CONSTRAINT "daily_tasks_related_dealer_id_fkey" FOREIGN KEY ("related_dealer_id") REFERENCES "public"."dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_tasks" ADD CONSTRAINT "daily_tasks_pjp_id_fkey" FOREIGN KEY ("pjp_id") REFERENCES "public"."permanent_journey_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

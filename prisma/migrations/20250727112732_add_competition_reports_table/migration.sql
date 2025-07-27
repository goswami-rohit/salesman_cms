-- CreateTable
CREATE TABLE "competition_reports" (
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

-- CreateIndex
CREATE INDEX "competition_reports_user_id_idx" ON "competition_reports"("user_id");

-- AddForeignKey
ALTER TABLE "competition_reports" ADD CONSTRAINT "competition_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

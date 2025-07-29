-- CreateTable
CREATE TABLE "geo_tracking" (
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
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "geo_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_geo_tracking_user_id" ON "geo_tracking"("user_id");

-- CreateIndex
CREATE INDEX "idx_geo_tracking_recorded_at" ON "geo_tracking"("recorded_at");

-- AddForeignKey
ALTER TABLE "geo_tracking" ADD CONSTRAINT "geo_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add the new columns to the table
ALTER TABLE "users"
ADD COLUMN "is_technical_role" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "tech_login_id" TEXT NULL,
ADD COLUMN "tech_hash_password" TEXT NULL;
-- 1. Create the Scheme Slabs Table (The Rules)
CREATE TABLE IF NOT EXISTS "scheme_slabs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "scheme_id" uuid NOT NULL,
    "min_bags_best" integer,
    "min_bags_others" integer,
    "points_earned" integer NOT NULL,
    "slab_description" varchar(255),
    "reward_id" integer,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now()
);

-- 2. Create the Mason Achievements Table (The Tracking)
CREATE TABLE IF NOT EXISTS "mason_slab_achievements" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "mason_id" uuid NOT NULL,
    "scheme_slab_id" uuid NOT NULL,
    "achieved_at" timestamp with time zone DEFAULT now() NOT NULL,
    "points_awarded" integer NOT NULL
);

-- 3. Create Indices (For Performance & Uniqueness)
CREATE INDEX IF NOT EXISTS "idx_scheme_slabs_scheme_id" ON "scheme_slabs" ("scheme_id");
CREATE INDEX IF NOT EXISTS "idx_scheme_slabs_reward_id" ON "scheme_slabs" ("reward_id");

CREATE INDEX IF NOT EXISTS "idx_msa_mason_id" ON "mason_slab_achievements" ("mason_id");
CREATE INDEX IF NOT EXISTS "idx_msa_slab_id" ON "mason_slab_achievements" ("scheme_slab_id");
-- Ensure a mason cannot claim the same slab twice
CREATE UNIQUE INDEX IF NOT EXISTS "unique_mason_slab_claim" ON "mason_slab_achievements" ("mason_id", "scheme_slab_id");

-- 4. Add Foreign Keys (The Back Relations)

-- Link Scheme Slabs -> Schemes Offers
ALTER TABLE "scheme_slabs" 
    ADD CONSTRAINT "scheme_slabs_scheme_id_fkey" 
    FOREIGN KEY ("scheme_id") REFERENCES "schemes_offers"("id") ON DELETE CASCADE;

-- Link Scheme Slabs -> Rewards (Inventory)
ALTER TABLE "scheme_slabs" 
    ADD CONSTRAINT "scheme_slabs_reward_id_fkey" 
    FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE SET NULL;

-- Link Achievements -> Mason PC Side (User)
ALTER TABLE "mason_slab_achievements" 
    ADD CONSTRAINT "mason_slab_achievements_mason_id_fkey" 
    FOREIGN KEY ("mason_id") REFERENCES "mason_pc_side"("id") ON DELETE CASCADE;

-- Link Achievements -> Scheme Slabs (The specific level cleared)
ALTER TABLE "mason_slab_achievements" 
    ADD CONSTRAINT "mason_slab_achievements_scheme_slab_id_fkey" 
    FOREIGN KEY ("scheme_slab_id") REFERENCES "scheme_slabs"("id") ON DELETE CASCADE;
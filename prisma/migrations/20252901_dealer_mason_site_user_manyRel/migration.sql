-- 1. CREATE RELATION: Dealer <-> TechnicalSite (Name: SiteAssociatedDealers)
-- Dealer (A) is VARCHAR(255), TechnicalSite (B) is UUID
CREATE TABLE "_SiteAssociatedDealers" (
    "A" VARCHAR(255) NOT NULL,
    "B" UUID NOT NULL
);

-- Unique constraint so you can't link the same dealer to the same site twice
CREATE UNIQUE INDEX "_SiteAssociatedDealers_AB_unique" ON "_SiteAssociatedDealers"("A", "B");

-- Index on B for reverse lookups (finding all dealers for a site)
CREATE INDEX "_SiteAssociatedDealers_B_index" ON "_SiteAssociatedDealers"("B");

-- Foreign Keys with CASCADE (If a Dealer or Site is deleted, the link is removed automatically)
ALTER TABLE "_SiteAssociatedDealers" ADD CONSTRAINT "_SiteAssociatedDealers_A_fkey" FOREIGN KEY ("A") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_SiteAssociatedDealers" ADD CONSTRAINT "_SiteAssociatedDealers_B_fkey" FOREIGN KEY ("B") REFERENCES "technical_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- 2. CREATE RELATION: Dealer <-> Mason (Name: DealerAssociatedMasons)
-- Dealer (A) is VARCHAR(255), Mason (B) is UUID
CREATE TABLE "_DealerAssociatedMasons" (
    "A" VARCHAR(255) NOT NULL,
    "B" UUID NOT NULL
);

CREATE UNIQUE INDEX "_DealerAssociatedMasons_AB_unique" ON "_DealerAssociatedMasons"("A", "B");
CREATE INDEX "_DealerAssociatedMasons_B_index" ON "_DealerAssociatedMasons"("B");

ALTER TABLE "_DealerAssociatedMasons" ADD CONSTRAINT "_DealerAssociatedMasons_A_fkey" FOREIGN KEY ("A") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_DealerAssociatedMasons" ADD CONSTRAINT "_DealerAssociatedMasons_B_fkey" FOREIGN KEY ("B") REFERENCES "mason_pc_side"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- 3. CREATE RELATION: Mason <-> TechnicalSite (Name: SiteAssociatedMasons)
-- Mason (A) is UUID, TechnicalSite (B) is UUID
CREATE TABLE "_SiteAssociatedMasons" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

CREATE UNIQUE INDEX "_SiteAssociatedMasons_AB_unique" ON "_SiteAssociatedMasons"("A", "B");
CREATE INDEX "_SiteAssociatedMasons_B_index" ON "_SiteAssociatedMasons"("B");

ALTER TABLE "_SiteAssociatedMasons" ADD CONSTRAINT "_SiteAssociatedMasons_A_fkey" FOREIGN KEY ("A") REFERENCES "mason_pc_side"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_SiteAssociatedMasons" ADD CONSTRAINT "_SiteAssociatedMasons_B_fkey" FOREIGN KEY ("B") REFERENCES "technical_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- 4. CREATE RELATION: TechnicalSite <-> User (Name: SiteAssociatedUsers)
-- TechnicalSite (A) is UUID, User (B) is INT
CREATE TABLE "_SiteAssociatedUsers" (
    "A" UUID NOT NULL,
    "B" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "_SiteAssociatedUsers_AB_unique" ON "_SiteAssociatedUsers"("A", "B");
CREATE INDEX "_SiteAssociatedUsers_B_index" ON "_SiteAssociatedUsers"("B");

ALTER TABLE "_SiteAssociatedUsers" ADD CONSTRAINT "_SiteAssociatedUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "technical_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_SiteAssociatedUsers" ADD CONSTRAINT "_SiteAssociatedUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
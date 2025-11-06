-- unique in dealer gstin
ALTER TABLE "dealers"
ADD CONSTRAINT "dealers_gstin_no_unique" UNIQUE ("gstin_no");
-- CreateTable
CREATE TABLE "client_reports" (
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

-- AddForeignKey
ALTER TABLE "client_reports" ADD CONSTRAINT "client_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

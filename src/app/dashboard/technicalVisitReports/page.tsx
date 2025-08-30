// src/app/dashboard/technicalVisitReports/page.tsx
'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { UniqueIdentifier } from '@dnd-kit/core';
// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Technical Visit Report Data ---
const technicalVisitReportSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>,
  salesmanName: z.string(),
  role: z.string(), // Added missing field
  visitType: z.string(),
  siteNameConcernedPerson: z.string(),
  phoneNo: z.string(),
  date: z.string(),
  emailId: z.string().email().or(z.literal('')),
  clientsRemarks: z.string(),
  salespersonRemarks: z.string(), // CORRECTED to a string
  checkInTime: z.string(),
  checkOutTime: z.string(),
  siteVisitBrandInUse: z.array(z.string()), // CORRECTED to allow empty array
  siteVisitStage: z.string().optional(), // CORRECTED to optional
  conversionFromBrand: z.string().optional(),
  conversionQuantityValue: z.number().optional().nullable(), // CORRECTED to number, as sent from the API
  conversionQuantityUnit: z.string().optional(),
  associatedPartyName: z.string().optional(), // CORRECTED to optional
  influencerType: z.array(z.string()), // CORRECTED to allow empty array
  serviceType: z.string().optional(), // CORRECTED to optional
  qualityComplaint: z.string().optional(),
  promotionalActivity: z.string().optional(),
  channelPartnerVisit: z.string().optional(),
});

// Infer the TypeScript type from the Zod schema
type TechnicalVisitReport = z.infer<typeof technicalVisitReportSchema>;

export default function TechnicalVisitReportsPage() {
  const [technicalReports, setTechnicalReports] = React.useState<TechnicalVisitReport[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // --- Data Fetching Function ---
  const fetchTechnicalReports = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch from the API path
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/technical-visit-reports`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: TechnicalVisitReport[] = await response.json();
      setTechnicalReports(data);
      toast.success("Technical visit reports loaded successfully!");
    } catch (error: any) {
      console.error("Failed to fetch technical visit reports:", error);
      toast.error(`Failed to fetch technical visit reports: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);


  React.useEffect(() => {
    fetchTechnicalReports();
  }, [fetchTechnicalReports]);


  // --- 3. Define Columns for Technical Visit Report DataTable ---
  const technicalVisitReportColumns: ColumnDef<TechnicalVisitReport>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "visitType", header: "Visit Type" },
    { accessorKey: "siteNameConcernedPerson", header: "Site/Person" },
    { accessorKey: "phoneNo", header: "Phone No." },
    { accessorKey: "date", header: "Visit Date" },
    { accessorKey: "checkInTime", header: "Check-in" },
    { accessorKey: "checkOutTime", header: "Check-out" },
    {
      accessorKey: "clientsRemarks", header: "Client Remarks",
      cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.clientsRemarks}</span>,
    },
    {
      accessorKey: "salespersonRemarks", header: "Salesman Remarks",
      cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.salespersonRemarks}</span>,
    },
    { accessorKey: "siteVisitBrandInUse", header: "Brand in Use" },
    { accessorKey: "siteVisitStage", header: "Site Stage" },
    { accessorKey: "conversionFromBrand", header: "Conversion From" },
    { accessorKey: "conversionQuantityValue", header: "Conv. Qty." },
    { accessorKey: "conversionQuantityUnit", header: "Conv. Unit" },
    { accessorKey: "associatedPartyName", header: "Associated Party" },
    { accessorKey: "influencerType", header: "Influencer Type" },
    { accessorKey: "serviceType", header: "Service Type" },
    { accessorKey: "qualityComplaint", header: "Quality Complaint" },
    { accessorKey: "promotionalActivity", header: "Promotional Activity" },
    { accessorKey: "channelPartnerVisit", header: "Channel Partner Visit" },
  ];

  const handleTechnicalVisitReportOrderChange = (newOrder: TechnicalVisitReport[]) => {
    console.log("New technical visit report order:", newOrder.map(r => r.id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Technical Visit Reports</h2>
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <DataTableReusable
            columns={technicalVisitReportColumns}
            data={technicalReports} // Use fetched data
            //filterColumnAccessorKey="siteNameConcernedPerson" // Filter by site name
            enableRowDragging={false} // Technical visit reports typically don't need reordering
            onRowOrderChange={handleTechnicalVisitReportOrderChange}
          />
        </div>
      </div>
    </div>
  );
}
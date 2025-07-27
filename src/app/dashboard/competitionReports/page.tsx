// src/app/dashboard/competitionReports/page.tsx
'use client';

import * as React from 'react';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { UniqueIdentifier } from '@dnd-kit/core';

// Import your Shadcn UI components
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconDownload } from '@tabler/icons-react';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Competition Report Data ---
// This schema matches the fields observed in your "New Competitors Information" screenshot
const competitionReportSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>, // Unique ID for the report entry
  salesmanName: z.string(), // Assuming we'll link this to a salesman
  brandName: z.string(),
  date: z.string(), // Or z.date() if stored as Date objects
  billing: z.string(), // Assuming this is a string field
  nod: z.string(), // Assuming "NOD" is a string field
  retail: z.string(), // Assuming "Retail" is a string field
  schemesYesNo: z.string(), // "Yes" or "No"
  avgSchemeCost: z.number(),
  remarks: z.string(),
});

// Infer the TypeScript type from the Zod schema
type CompetitionReport = z.infer<typeof competitionReportSchema>;

export default function CompetitionReportsPage() {
  React.useEffect(() => {
    async function checkAuth() {
      const claims = await getTokenClaims();
      if (!claims || !claims.sub) {
        redirect('/login');
      }
      if (!claims.org_id) {
        redirect('/dashboard');
      }
    }
    checkAuth();
  }, []);

  // --- 2. Placeholder Data for Competition Reports ---
  const competitionReportData: CompetitionReport[] = [
    {
      id: "comp_report_1",
      salesmanName: "John Doe",
      brandName: "Competitor Brand X",
      date: "2025-07-25",
      billing: "Standard",
      nod: "High",
      retail: "Online",
      schemesYesNo: "Yes",
      avgSchemeCost: 1500,
      remarks: "New product launch observed. Aggressive pricing on Brand X.",
    },
    {
      id: "comp_report_2",
      salesmanName: "Jane Smith",
      brandName: "Rival Brand Y",
      date: "2025-07-24",
      billing: "Monthly",
      nod: "Medium",
      retail: "Physical Stores",
      schemesYesNo: "No",
      avgSchemeCost: 0,
      remarks: "Focusing on loyalty programs. Less aggressive on discounts.",
    },
    {
      id: "comp_report_3",
      salesmanName: "Alice Brown",
      brandName: "Brand Z",
      date: "2025-07-23",
      billing: "Quarterly",
      nod: "Low",
      retail: "Both",
      schemesYesNo: "Yes",
      avgSchemeCost: 800,
      remarks: "Running a 'buy one get one free' scheme on selected items.",
    },
  ];

  // --- 3. Define Columns for Competition Report DataTable ---
  const competitionReportColumns: ColumnDef<CompetitionReport>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "brandName", header: "Competitor Brand" },
    { accessorKey: "date", header: "Report Date" },
    { accessorKey: "billing", header: "Billing" },
    { accessorKey: "nod", header: "NOD" },
    { accessorKey: "retail", header: "Retail Channel" },
    { accessorKey: "schemesYesNo", header: "Schemes?" },
    { accessorKey: "avgSchemeCost", header: "Avg Scheme Cost (₹)" },
    { accessorKey: "remarks", header: "Remarks",
      cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.original.remarks}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const handleIndividualDownload = async (format: 'csv' | 'xlsx') => {
          toast.info(`Downloading report for ${row.original.brandName} as ${format.toUpperCase()}...`);
          console.log(`Simulating individual download for ${row.original.id} in ${format}`);
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
              <DropdownMenuItem onClick={() => handleIndividualDownload('csv')}>
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleIndividualDownload('xlsx')}>
                Download XLSX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // --- 4. Master Download Function for Competition Reports ---
  const handleDownloadAllCompetitionReports = async (format: 'csv' | 'xlsx') => {
    toast.info(`Preparing to download all Competition Reports as ${format.toUpperCase()}...`);
    console.log(`Simulating master download for all Competition Reports in ${format}`);
  };

  const handleCompetitionReportOrderChange = (newOrder: CompetitionReport[]) => {
    console.log("New competition report order:", newOrder.map(r => r.id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Competitor Information Reports</h2>
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <DataTableReusable
            columns={competitionReportColumns}
            data={competitionReportData}
            reportTitle="Competitor Information Reports"
            filterColumnAccessorKey="brandName" // Filter by competitor brand name
            onDownloadAll={handleDownloadAllCompetitionReports}
            enableRowDragging={false} // Competition reports typically don't need reordering
            onRowOrderChange={handleCompetitionReportOrderChange}
          />
        </div>
      </div>
    </div>
  );
}
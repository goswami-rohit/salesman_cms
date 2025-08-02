// src/app/dashboard/technicalVisitReports/page.tsx
'use client';

import * as React from 'react';
// import { getTokenClaims } from '@workos-inc/authkit-nextjs';
// import { redirect } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { UniqueIdentifier } from '@dnd-kit/core';

// Import your Shadcn UI components
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical } from '@tabler/icons-react';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Technical Visit Report Data ---
const technicalVisitReportSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>,
  salesmanName: z.string(),
  visitType: z.string(),
  siteNameConcernedPerson: z.string(),
  phoneNo: z.string(),
  date: z.string(),
  emailId: z.string().email().or(z.literal('')),
  clientsRemarks: z.string(),
  salespersonRemarks: z.string(),
  checkInTime: z.string(),
  checkOutTime: z.string(),
});

// Infer the TypeScript type from the Zod schema
type TechnicalVisitReport = z.infer<typeof technicalVisitReportSchema>;

export default function TechnicalVisitReportsPage() {
  const [technicalReports, setTechnicalReports] = React.useState<TechnicalVisitReport[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // React.useEffect(() => {
  //   async function checkAuth() {
  //     const claims = await getTokenClaims();
  //     if (!claims || !claims.sub) {
  //       redirect('/login');
  //     }
  //     if (!claims.org_id) {
  //       redirect('/dashboard');
  //     }
  //   }
  //   checkAuth();
  // }, []);

  // --- Data Fetching Function ---
  const fetchTechnicalReports = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch from the API path
      const response = await fetch('/api/dashboardPagesAPI/technical-visit-reports');
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

  const dummyDownloadFunction = async (format: 'csv' | 'xlsx') => {
    console.log(`Download for ${format} requested, but download functionality is avialbe on Download Reports page.`);
  };


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
    { accessorKey: "clientsRemarks", header: "Client Remarks",
      cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.clientsRemarks}</span>,
    },
    { accessorKey: "salespersonRemarks", header: "Salesman Remarks",
      cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.salespersonRemarks}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        // const handleIndividualDownload = async (format: 'csv' | 'xlsx') => {
        //   toast.info(`Downloading report for ${row.original.siteNameConcernedPerson} as ${format.toUpperCase()}...`);
        //   console.log(`Simulating individual download for ${row.original.id} in ${format}`);
        // };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
              {/* <DropdownMenuItem onClick={() => handleIndividualDownload('csv')}>
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleIndividualDownload('xlsx')}>
                Download XLSX
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // --- 4. Master Download Function for Technical Visit Reports ---
  // const handleDownloadAllTechnicalVisitReports = async (format: 'csv' | 'xlsx') => {
  //   toast.info(`Preparing to download all Technical Visit Reports as ${format.toUpperCase()}...`);
  //   console.log(`Simulating master download for all Technical Visit Reports in ${format}`);
  // };

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
            reportTitle="Technical Visit Reports"
            filterColumnAccessorKey="siteNameConcernedPerson" // Filter by site name
            onDownloadAll={dummyDownloadFunction}
            enableRowDragging={false} // Technical visit reports typically don't need reordering
            onRowOrderChange={handleTechnicalVisitReportOrderChange}
          />
        </div>
      </div>
    </div>
  );
}
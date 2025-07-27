// src/app/dashboard/technicalVisitReports/page.tsx
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

// --- 1. Define Zod Schema for Technical Visit Report Data ---
// This schema matches the fields observed in your "Technical Visit" screenshot
const technicalVisitReportSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>, // Unique ID for the report entry
  salesmanName: z.string(), // Assuming we'll link this to a salesman
  visitType: z.string(), // From "Select type of visit"
  siteNameConcernedPerson: z.string(), // From "Name of the site/concerned person"
  phoneNo: z.string(), // From "Phone No"
  date: z.string(), // From "Date" (Or z.date() if stored as Date objects)
  emailId: z.string().email().or(z.literal('')), // From "Email-id", optional and can be empty string
  clientsRemarks: z.string(), // From "Clients Remarks"
  salespersonRemarks: z.string(), // From "Sale's person remarks"
  checkInTime: z.string(), // Assuming a timestamp for check-in
  checkOutTime: z.string(), // Assuming a timestamp for check-out
});

// Infer the TypeScript type from the Zod schema
type TechnicalVisitReport = z.infer<typeof technicalVisitReportSchema>;

export default function TechnicalVisitReportsPage() {
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

  // --- 2. Placeholder Data for Technical Visit Reports ---
  const technicalVisitReportData: TechnicalVisitReport[] = [
    {
      id: "tech_visit_1",
      salesmanName: "John Doe",
      visitType: "Installation Support",
      siteNameConcernedPerson: "Tech Solutions Pvt Ltd / Mr. Kumar",
      phoneNo: "9988776655",
      date: "2025-07-26",
      emailId: "kumar@techsolutions.com",
      clientsRemarks: "Issue with new setup, needs expert help.",
      salespersonRemarks: "Resolved configuration error. Client satisfied.",
      checkInTime: "2025-07-26 10:00 AM",
      checkOutTime: "2025-07-26 11:30 AM",
    },
    {
      id: "tech_visit_2",
      salesmanName: "Jane Smith",
      visitType: "Troubleshooting",
      siteNameConcernedPerson: "Industrial Fab / Ms. Devi",
      phoneNo: "9123456789",
      date: "2025-07-25",
      emailId: "", // Empty email
      clientsRemarks: "Machine not starting after power fluctuation.",
      salespersonRemarks: "Identified minor wiring issue, fixed on spot. Advised on surge protector.",
      checkInTime: "2025-07-25 14:00 PM",
      checkOutTime: "2025-07-25 15:15 PM",
    },
    {
      id: "tech_visit_3",
      salesmanName: "John Doe",
      visitType: "Routine Maintenance",
      siteNameConcernedPerson: "Green Energy Co. / Mr. Singh",
      phoneNo: "9876123450",
      date: "2025-07-24",
      emailId: "singh@greenenergy.com",
      clientsRemarks: "Just a routine check, no issues reported.",
      salespersonRemarks: "All systems nominal. Performed standard checks.",
      checkInTime: "2025-07-24 09:30 AM",
      checkOutTime: "2025-07-24 10:45 AM",
    },
  ];

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
        const handleIndividualDownload = async (format: 'csv' | 'xlsx') => {
          toast.info(`Downloading report for ${row.original.siteNameConcernedPerson} as ${format.toUpperCase()}...`);
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

  // --- 4. Master Download Function for Technical Visit Reports ---
  const handleDownloadAllTechnicalVisitReports = async (format: 'csv' | 'xlsx') => {
    toast.info(`Preparing to download all Technical Visit Reports as ${format.toUpperCase()}...`);
    console.log(`Simulating master download for all Technical Visit Reports in ${format}`);
  };

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
            data={technicalVisitReportData}
            reportTitle="Technical Visit Reports"
            filterColumnAccessorKey="siteNameConcernedPerson" // Filter by site name
            onDownloadAll={handleDownloadAllTechnicalVisitReports}
            enableRowDragging={false} // Technical visit reports typically don't need reordering
            onRowOrderChange={handleTechnicalVisitReportOrderChange}
          />
        </div>
      </div>
    </div>
  );
}
// src/app/dashboard/clientReports/page.tsx
'use client'; // This page needs to be a client component because it uses DataTable which is 'use client'
import * as React from 'react';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod'; // Import zod for schema definition
import { UniqueIdentifier } from '@dnd-kit/core'; // For DataTable's TData constraint

// Import your Shadcn UI components
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconDownload } from '@tabler/icons-react'; // Example icons

// Import the refactored DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Client Report Data ---
// This schema matches the fields observed in your "Client Visit" screenshot
const clientReportSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>, // Must be UniqueIdentifier for drag-and-drop
  salesmanName: z.string(),
  dealerType: z.string(),
  dealerSubDealerName: z.string(),
  location: z.string(),
  typeBestNonBest: z.string(),
  dealerTotalPotential: z.number(),
  dealerBestPotential: z.number(),
  brandSelling: z.array(z.string()), // Array for checkboxes
  contactPerson: z.string(),
  contactPersonPhoneNo: z.string(),
  todayOrderMT: z.number(),
  todayCollection: z.number(),
  feedbacks: z.string(),
  solutionsAsPerSalesperson: z.string(),
  anyRemarks: z.string(),
  checkOutTime: z.string(), // Assuming string for simplicity, can be z.date() if Date object
});

// Infer the TypeScript type from the Zod schema
type ClientReport = z.infer<typeof clientReportSchema>;

export default function ClientReportsPage() { // Changed to client component due to DataTable usage
  // Authentication check (can remain async in page.tsx as it's a boundary)
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

  // --- 2. Placeholder Data for Client Reports ---
  // In a real application, this data would be fetched from your backend API route
  // (which in turn queries the salesman app's integrated data based on the admin's companyId)
  const clientReportData: ClientReport[] = [
    {
      id: "client_visit_1",
      salesmanName: "John Doe",
      dealerType: "Distributor",
      dealerSubDealerName: "ABC Electricals",
      location: "Guwahati, Assam",
      typeBestNonBest: "Best",
      dealerTotalPotential: 50000,
      dealerBestPotential: 40000,
      brandSelling: ["Brand A", "Brand B"],
      contactPerson: "Mr. Ramesh",
      contactPersonPhoneNo: "9876543210",
      todayOrderMT: 100,
      todayCollection: 25000,
      feedbacks: "Positive feedback on product durability. Suggested new marketing collateral for Brand A.",
      solutionsAsPerSalesperson: "Provided updated catalog and discussed bulk order discount structure.",
      anyRemarks: "Follow-up needed for new order by end of week.",
      checkOutTime: "2025-07-27 11:30 AM"
    },
    {
      id: "client_visit_2",
      salesmanName: "Jane Smith",
      dealerType: "Retailer",
      dealerSubDealerName: "City Mart",
      location: "Dispur, Guwahati",
      typeBestNonBest: "Non-Best",
      dealerTotalPotential: 10000,
      dealerBestPotential: 2000,
      brandSelling: ["Brand C"],
      contactPerson: "Ms. Sharma",
      contactPersonPhoneNo: "8765432109",
      todayOrderMT: 20,
      todayCollection: 5000,
      feedbacks: "Expressed interest in expanding product range, but space is limited.",
      solutionsAsPerSalesperson: "Offered a smaller display unit and highlighted fast-moving items.",
      anyRemarks: "Potential for growth if store layout improves.",
      checkOutTime: "2025-07-27 09:45 AM"
    },
    // Add more dummy data as needed for testing the table
  ];

  // --- 3. Define Columns for Client Report DataTable ---
  // These columns are specific to the Client Reports page
  const clientReportColumns: ColumnDef<ClientReport>[] = [
    // Drag handle column (only if enableRowDragging is true for this DataTable instance)
    // You'd typically include this *only* if you want the admin to reorder reports.
    // For most reports, you won't need drag-and-drop for sorting.
    // {
    //   id: "drag",
    //   header: () => null,
    //   cell: ({ row }) => <DragHandle id={row.original.id} />, // DragHandle is now internal to DataTable
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "dealerSubDealerName", header: "Dealer/Sub-Dealer" },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "todayOrderMT", header: "Order (MT)" },
    { accessorKey: "todayCollection", header: "Collection (₹)" },
    { accessorKey: "checkOutTime", header: "Report Time" },
    { accessorKey: "feedbacks", header: "Feedbacks",
      cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.original.feedbacks}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const handleIndividualDownload = async (format: 'csv' | 'xlsx') => {
          toast.info(`Downloading report for ${row.original.dealerSubDealerName} as ${format.toUpperCase()}...`);
          // TODO: Call your backend API here to generate and download the individual report
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
              {/* Add more actions specific to a client report here, e.g., "View Full Details" */}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // --- 4. Master Download Function for Client Reports ---
  const handleDownloadAllClientReports = async (format: 'csv' | 'xlsx') => {
    toast.info(`Preparing to download all Client Visit Reports as ${format.toUpperCase()}...`);
    // TODO: Call your backend API here to generate and download the complete report for the company
    console.log(`Simulating master download for all Client Visit Reports in ${format}`);
  };

  // Callback for row order change (if enableRowDragging is true)
  const handleClientReportOrderChange = (newOrder: ClientReport[]) => {
    console.log("New client report order:", newOrder.map(r => r.id));
    // TODO: Send this new order to your backend if you need to persist it
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Client Visit Reports</h2>
          {/* Master download button is now integrated into DataTable component's toolbar */}
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <DataTableReusable
            columns={clientReportColumns}
            data={clientReportData} // Pass the data defined above
            reportTitle="Client Visit Reports"
            filterColumnAccessorKey="dealerSubDealerName" // Or "salesmanName", based on preferred primary filter
            onDownloadAll={handleDownloadAllClientReports}
            enableRowDragging={false} // Set to true if you need to reorder client reports
            onRowOrderChange={handleClientReportOrderChange} // Only relevant if enableRowDragging is true
          />
        </div>
      </div>
    </div>
  );
}
// src/app/dashboard/dealerReports/page.tsx
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
import { IconDotsVertical } from '@tabler/icons-react'; // Only need IconDotsVertical for individual row actions
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs components

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Dealer/Sub-Dealer Report Data ---
// This schema combines fields from both "New Dealer Name" and "New Sub Dealer Name"
const dealerReportSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>, // Unique ID for the dealer/sub-dealer entry
  salesmanName: z.string(), // Assuming we'll link this to a salesman
  type: z.enum(["Dealer", "Sub Dealer"]), // To distinguish between tabs
  dealerName: z.string().optional().nullable(), // Optional for sub-dealers
  subDealerName: z.string().optional().nullable(), // Optional for dealers
  region: z.string(),
  area: z.string(),
  phoneNo: z.string(),
  address: z.string(), // Assuming this is the "Dealer Address" field
  dealerTotalPotential: z.number(),
  dealerBestPotential: z.number(),
  brandSelling: z.array(z.string()), // Array for checkboxes
  feedbacks: z.string(),
  remarks: z.string().optional().nullable(), // From "Remarks"
});

// Infer the TypeScript type from the Zod schema
type DealerReport = z.infer<typeof dealerReportSchema>;

export default function DealerReportsPage() {
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

  // --- 2. Placeholder Data for Dealers and Sub-Dealers ---
  const dealerData: DealerReport[] = [
    {
      id: "dealer_1",
      salesmanName: "John Doe",
      type: "Dealer",
      dealerName: "Maa Manisha Hardware",
      region: "Guwahati",
      area: "6R2P+X5",
      phoneNo: "9954202174",
      address: "6R2P+X5, Guwahati, Assam",
      dealerTotalPotential: 100000,
      dealerBestPotential: 80000,
      brandSelling: ["Star", "Dalmia"],
      feedbacks: "Very reliable, consistent orders.",
      remarks: null,
    },
    {
      id: "dealer_2",
      salesmanName: "Jane Smith",
      type: "Dealer",
      dealerName: "Sunil Hardware",
      region: "Guwahati",
      area: "8690729544",
      phoneNo: "8690729544",
      address: "5RQR+RVJ, Birkuchi, Guwahati, Assam",
      dealerTotalPotential: 75000,
      dealerBestPotential: 60000,
      brandSelling: ["Amrit", "SuryaGold"],
      feedbacks: "Good potential, needs more promotional support.",
      remarks: "Discussed new scheme for next quarter.",
    },
    // Add more dummy dealer data
  ];

  const subDealerData: DealerReport[] = [
    {
      id: "sub_dealer_1",
      salesmanName: "John Doe",
      type: "Sub Dealer",
      subDealerName: "Maa Kali Enterprise",
      dealerName: "Maa Manisha Hardware", // Linked to a main dealer
      region: "Guwahati",
      area: "5RQR+RW",
      phoneNo: "8638589422",
      address: "5RQR+RW, Narengi, Guwahati, Assam",
      dealerTotalPotential: 20000,
      dealerBestPotential: 15000,
      brandSelling: ["BlackTiger"],
      feedbacks: "Small but frequent orders, good relationship.",
      remarks: null,
    },
    {
      id: "sub_dealer_2",
      salesmanName: "Jane Smith",
      type: "Sub Dealer",
      subDealerName: "Homeswar Kalita",
      dealerName: "Sunil Hardware", // Linked to a main dealer
      region: "Guwahati",
      area: "73/1",
      phoneNo: "9864780479",
      address: "73/1, Kalitakuchi, Guwahati, Assam",
      dealerTotalPotential: 10000,
      dealerBestPotential: 8000,
      brandSelling: ["Taj"],
      feedbacks: "New sub-dealer, still building trust.",
      remarks: "Provided initial stock and marketing materials.",
    },
    // Add more dummy sub-dealer data
  ];

  // --- 3. Define Columns for Dealer/Sub-Dealer Report DataTable ---
  const dealerReportColumns: ColumnDef<DealerReport>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    // Conditionally display Dealer Name or Sub-Dealer Name
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.type === "Dealer" ? row.original.dealerName : row.original.subDealerName}
        </span>
      ),
    },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "region", header: "Region" },
    { accessorKey: "area", header: "Area" },
    { accessorKey: "phoneNo", header: "Phone No." },
    { accessorKey: "address", header: "Address",
      cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.original.address}</span>,
    },
    { accessorKey: "dealerTotalPotential", header: "Total Potential (₹)" },
    { accessorKey: "dealerBestPotential", header: "Best Potential (₹)" },
    { accessorKey: "brandSelling", header: "Brands Selling",
      cell: ({ row }) => (
        <span className="max-w-[150px] truncate block">
          {row.original.brandSelling.join(", ")}
        </span>
      ),
    },
    { accessorKey: "feedbacks", header: "Feedbacks",
      cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.feedbacks}</span>,
    },
    { accessorKey: "remarks", header: "Remarks",
      cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.remarks || "N/A"}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const handleIndividualDownload = async (format: 'csv' | 'xlsx') => {
          const name = row.original.type === "Dealer" ? row.original.dealerName : row.original.subDealerName;
          toast.info(`Downloading report for ${name} as ${format.toUpperCase()}...`);
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

  // --- 4. Master Download Functions for Each Tab ---
  const handleDownloadAllDealers = async (format: 'csv' | 'xlsx') => {
    toast.info(`Preparing to download all Dealer Reports as ${format.toUpperCase()}...`);
    console.log(`Simulating master download for all Dealers in ${format}`);
  };

  const handleDownloadAllSubDealers = async (format: 'csv' | 'xlsx') => {
    toast.info(`Preparing to download all Sub-Dealer Reports as ${format.toUpperCase()}...`);
    console.log(`Simulating master download for all Sub-Dealers in ${format}`);
  };

  const handleDealerReportOrderChange = (newOrder: DealerReport[]) => {
    console.log("New dealer report order:", newOrder.map(r => r.id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dealer & Sub-Dealer Reports</h2>
        </div>

        {/* Tabs for Dealers and Sub-Dealers */}
        <Tabs defaultValue="dealers" className="w-full">
          <TabsList className="grid w-fit grid-cols-2 bg-muted text-muted-foreground border-border">
            <TabsTrigger value="dealers" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">Dealers</TabsTrigger>
            <TabsTrigger value="sub-dealers" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">Sub-Dealers</TabsTrigger>
          </TabsList>

          {/* Content for Dealers Tab */}
          <TabsContent value="dealers" className="mt-4 bg-card p-6 rounded-lg border border-border">
            <DataTableReusable
              columns={dealerReportColumns}
              data={dealerData}
              reportTitle="Dealer Reports"
              filterColumnAccessorKey="dealerName" // Filter by dealer name
              onDownloadAll={handleDownloadAllDealers}
              enableRowDragging={false}
              onRowOrderChange={handleDealerReportOrderChange}
            />
          </TabsContent>

          {/* Content for Sub-Dealers Tab */}
          <TabsContent value="sub-dealers" className="mt-4 bg-card p-6 rounded-lg border border-border">
            <DataTableReusable
              columns={dealerReportColumns} // Reusing the same column definitions
              data={subDealerData}
              reportTitle="Sub-Dealer Reports"
              filterColumnAccessorKey="subDealerName" // Filter by sub-dealer name
              onDownloadAll={handleDownloadAllSubDealers}
              enableRowDragging={false}
              onRowOrderChange={handleDealerReportOrderChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
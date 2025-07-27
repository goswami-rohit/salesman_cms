// src/app/dashboard/permanentJourneyPlan/page.tsx
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

// --- 1. Define Zod Schema for Permanent Journey Plan Data ---
// This schema matches the fields observed in your "New PJP Information" screenshot
const permanentJourneyPlanSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>, // Unique ID for the PJP entry
  salesmanName: z.string(), // Assuming we'll link this to a salesman
  areaToBeVisited: z.string(), // From "Area to be visited"
  date: z.string(), // From "Date" (Or z.date() if stored as Date objects for better handling)
  description: z.string().optional().nullable(), // From "Description", optional
});

// Infer the TypeScript type from the Zod schema
type PermanentJourneyPlan = z.infer<typeof permanentJourneyPlanSchema>;

export default function PermanentJourneyPlanPage() {
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

  // --- 2. Placeholder Data for Permanent Journey Plans ---
  const permanentJourneyPlanData: PermanentJourneyPlan[] = [
    {
      id: "pjp_1",
      salesmanName: "John Doe",
      areaToBeVisited: "Sector 1, Bongaon, Guwahati",
      date: "2025-08-01",
      description: "Routine visit to all dealers in Sector 1. Focus on new product launch.",
    },
    {
      id: "pjp_2",
      salesmanName: "Jane Smith",
      areaToBeVisited: "Latasil, Guwahati",
      date: "2025-08-05",
      description: "Key account visits in Latasil area.",
    },
    {
      id: "pjp_3",
      salesmanName: "Alice Brown",
      areaToBeVisited: "Ganeshguri, Guwahati (via Google Maps link)",
      date: "2025-08-10",
      description: null, // Optional description
    },
    {
      id: "pjp_4",
      salesmanName: "John Doe",
      areaToBeVisited: "Maligaon, Guwahati",
      date: "2025-08-02",
      description: "Follow-up on pending collections and new orders.",
    },
  ];

  // --- 3. Define Columns for Permanent Journey Plan DataTable ---
  const permanentJourneyPlanColumns: ColumnDef<PermanentJourneyPlan>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "areaToBeVisited", header: "Area to Visit",
      cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.original.areaToBeVisited}</span>,
    },
    { accessorKey: "date", header: "Planned Date" },
    { accessorKey: "description", header: "Description",
      cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.original.description || "N/A"}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const handleIndividualDownload = async (format: 'csv' | 'xlsx') => {
          toast.info(`Downloading PJP for ${row.original.areaToBeVisited} on ${row.original.date} as ${format.toUpperCase()}...`);
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

  // --- 4. Master Download Function for Permanent Journey Plans ---
  const handleDownloadAllPermanentJourneyPlans = async (format: 'csv' | 'xlsx') => {
    toast.info(`Preparing to download all Permanent Journey Plans as ${format.toUpperCase()}...`);
    console.log(`Simulating master download for all Permanent Journey Plans in ${format}`);
  };

  const handlePermanentJourneyPlanOrderChange = (newOrder: PermanentJourneyPlan[]) => {
    console.log("New permanent journey plan order:", newOrder.map(r => r.id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Permanent Journey Plans</h2>
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <DataTableReusable
            columns={permanentJourneyPlanColumns}
            data={permanentJourneyPlanData}
            reportTitle="Permanent Journey Plans"
            filterColumnAccessorKey="areaToBeVisited" // Filter by area
            onDownloadAll={handleDownloadAllPermanentJourneyPlans}
            enableRowDragging={false} // PJP reports typically don't need reordering
            onRowOrderChange={handlePermanentJourneyPlanOrderChange}
          />
        </div>
      </div>
    </div>
  );
}
// src/app/dashboard/slmAttendance/page.tsx
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
import { IconDotsVertical, IconCheck, IconX } from '@tabler/icons-react';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Salesman Attendance Report Data ---
const salesmanAttendanceReportSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>,
  salesmanName: z.string(),
  date: z.string(),
  location: z.string(),
  inTime: z.string().nullable(),
  outTime: z.string().nullable(),
  inTimeImageCaptured: z.boolean(),
  outTimeImageCaptured: z.boolean(),
  // Removed image URL fields as they are not needed for display logic now
  // inTimeImageUrl: z.string().optional().nullable(),
  // outTimeImageUrl: z.string().optional().nullable(),
});

// Infer the TypeScript type from the Zod schema
type SalesmanAttendanceReport = z.infer<typeof salesmanAttendanceReportSchema>;

export default function SlmAttendancePage() {
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

  // --- 2. Placeholder Data for Salesman Attendance Reports ---
  const salesmanAttendanceData: SalesmanAttendanceReport[] = [
    {
      id: "slm_att_1",
      salesmanName: "John Doe",
      date: "2025-07-27",
      location: "9, Bonbonani Path, Bongaon, Guwahati, Assam 781028, India",
      inTime: "09:00 AM",
      outTime: "06:00 PM",
      inTimeImageCaptured: true,
      outTimeImageCaptured: true,
      // Removed image URL from placeholder data
    },
    {
      id: "slm_att_2",
      salesmanName: "Jane Smith",
      date: "2025-07-27",
      location: "ABC Market, Dispur, Guwahati, Assam, India",
      inTime: "09:15 AM",
      outTime: null,
      inTimeImageCaptured: true,
      outTimeImageCaptured: false,
      // Removed image URL from placeholder data
    },
    {
      id: "slm_att_3",
      salesmanName: "Alice Brown",
      date: "2025-07-26",
      location: "XYZ Complex, Ganeshguri, Guwahati, Assam, India",
      inTime: "09:30 AM",
      outTime: "05:30 PM",
      inTimeImageCaptured: false,
      outTimeImageCaptured: true,
      // Removed image URL from placeholder data
    },
    {
      id: "slm_att_4",
      salesmanName: "John Doe",
      date: "2025-07-26",
      location: "10, GS Road, Guwahati, Assam, India",
      inTime: "08:50 AM",
      outTime: "06:10 PM",
      inTimeImageCaptured: true,
      outTimeImageCaptured: true,
      // Removed image URL from placeholder data
    },
  ];

  // --- 3. Define Columns for Salesman Attendance DataTable ---
  const salesmanAttendanceColumns: ColumnDef<SalesmanAttendanceReport>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "location", header: "Location",
      cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.original.location}</span>,
    },
    { accessorKey: "inTime", header: "In Time" },
    { accessorKey: "outTime", header: "Out Time",
      cell: ({ row }) => (
        <span>{row.original.outTime || "N/A (Still In)"}</span>
      ),
    },
    {
      id: "inTimeImage",
      header: "In Time Image",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.inTimeImageCaptured ? (
            <>
              <IconCheck className="h-4 w-4 text-green-500" /> Yes
            </>
          ) : (
            <>
              <IconX className="h-4 w-4 text-red-500" /> No
            </>
          )}
        </div>
      ),
    },
    {
      id: "outTimeImage",
      header: "Out Time Image",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.outTimeImageCaptured ? (
            <>
              <IconCheck className="h-4 w-4 text-green-500" /> Yes
            </>
          ) : (
            <>
              <IconX className="h-4 w-4 text-red-500" /> No
            </>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const handleIndividualDownload = async (format: 'csv' | 'xlsx') => {
          toast.info(`Downloading attendance report for ${row.original.salesmanName} on ${row.original.date} as ${format.toUpperCase()}...`);
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

  // --- 4. Master Download Function for Salesman Attendance Reports ---
  const handleDownloadAllSalesmanAttendance = async (format: 'csv' | 'xlsx') => {
    toast.info(`Preparing to download all Salesman Attendance Reports as ${format.toUpperCase()}...`);
    console.log(`Simulating master download for all Salesman Attendance Reports in ${format}`);
  };

  const handleSalesmanAttendanceOrderChange = (newOrder: SalesmanAttendanceReport[]) => {
    console.log("New salesman attendance report order:", newOrder.map(r => r.id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Salesman Attendance Reports</h2>
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <DataTableReusable
            columns={salesmanAttendanceColumns}
            data={salesmanAttendanceData}
            reportTitle="Salesman Attendance Reports"
            filterColumnAccessorKey="salesmanName"
            onDownloadAll={handleDownloadAllSalesmanAttendance}
            enableRowDragging={false}
            onRowOrderChange={handleSalesmanAttendanceOrderChange}
          />
        </div>
      </div>
    </div>
  );
}
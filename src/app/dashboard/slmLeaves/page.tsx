// src/app/dashboard/slmLeaves/page.tsx
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
import { Badge } from '@/components/ui/badge'; // For status badges
import { IconDotsVertical } from '@tabler/icons-react';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Salesman Leave Application Data ---
const salesmanLeaveApplicationSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>, // Unique ID for the leave entry
  salesmanName: z.string(),
  leaveType: z.string(), // e.g., "Sick Leave", "Casual Leave", "Annual Leave"
  startDate: z.string(), // e.g., "2025-08-01"
  endDate: z.string(),   // e.g., "2025-08-03"
  reason: z.string(),
  status: z.enum(["Pending", "Approved", "Rejected"]), // Key status field
  adminRemarks: z.string().optional().nullable(), // For admin's notes on approval/rejection
});

// Infer the TypeScript type from the Zod schema
type SalesmanLeaveApplication = z.infer<typeof salesmanLeaveApplicationSchema>;

export default function SlmLeavesPage() {
  const [leaveApplications, setLeaveApplications] = React.useState<SalesmanLeaveApplication[]>(() => [
    {
      id: "leave_app_1",
      salesmanName: "John Doe",
      leaveType: "Sick Leave",
      startDate: "2025-08-01",
      endDate: "2025-08-01",
      reason: "Feeling unwell, need to see a doctor.",
      status: "Pending",
      adminRemarks: null,
    },
    {
      id: "leave_app_2",
      salesmanName: "Jane Smith",
      leaveType: "Casual Leave",
      startDate: "2025-08-05",
      endDate: "2025-08-07",
      reason: "Family event in native village.",
      status: "Pending",
      adminRemarks: null,
    },
    {
      id: "leave_app_3",
      salesmanName: "Alice Brown",
      leaveType: "Annual Leave",
      startDate: "2025-07-20",
      endDate: "2025-07-27",
      reason: "Vacation trip planned.",
      status: "Approved",
      adminRemarks: "Approved as per annual leave policy. Enjoy!",
    },
    {
      id: "leave_app_4",
      salesmanName: "John Doe",
      leaveType: "Casual Leave",
      startDate: "2025-07-15",
      endDate: "2025-07-15",
      reason: "Personal urgent work.",
      status: "Rejected",
      adminRemarks: "Rejected due to critical project deadline. Please reschedule.",
    },
  ]);

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

  // --- Handle Leave Approval/Rejection ---
  const handleLeaveAction = (id: UniqueIdentifier, newStatus: "Approved" | "Rejected", remarks: string | null = null) => {
    setLeaveApplications((prevApplications) =>
      prevApplications.map((app) =>
        app.id === id
          ? { ...app, status: newStatus, adminRemarks: remarks || app.adminRemarks }
          : app
      )
    );
    toast.success(`Leave for ${id} ${newStatus.toLowerCase()}!`);
    // In a real app, this would be an API call to your backend:
    // await fetch('/api/leaves/update', { method: 'POST', body: JSON.stringify({ id, newStatus, remarks }) });
  };

  // --- Define Columns for Salesman Leave Applications DataTable ---
  const salesmanLeaveColumns: ColumnDef<SalesmanLeaveApplication>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "leaveType", header: "Leave Type" },
    { accessorKey: "startDate", header: "Start Date" },
    { accessorKey: "endDate", header: "End Date" },
    { accessorKey: "reason", header: "Reason",
      cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.original.reason}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
        let className = "";
        switch (status) {
          case "Approved":
            variant = "default";
            className = "bg-green-500 hover:bg-green-600 text-white"; // Tailwind classes
            break;
          case "Rejected":
            variant = "destructive";
            className = "bg-red-500 hover:bg-red-600 text-white";
            break;
          case "Pending":
            variant = "outline";
            className = "bg-yellow-500 hover:bg-yellow-600 text-black"; // Pending is usually yellow/orange
            break;
        }
        return (
          <Badge variant={variant} className={className}>
            {status}
          </Badge>
        );
      },
    },
    { accessorKey: "adminRemarks", header: "Admin Remarks",
      cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.adminRemarks || "N/A"}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const leave = row.original;
        const isPending = leave.status === "Pending";

        const handleIndividualDownload = async (format: 'csv' | 'xlsx') => {
          toast.info(`Downloading leave report for ${leave.salesmanName} (${leave.startDate} to ${leave.endDate}) as ${format.toUpperCase()}...`);
          console.log(`Simulating individual download for ${leave.id} in ${format}`);
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
              {isPending && ( // Show Approve/Reject only if status is Pending
                <>
                  <DropdownMenuItem onClick={() => handleLeaveAction(leave.id, "Approved", "Approved by admin.")}>
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLeaveAction(leave.id, "Rejected", "Rejected by admin.")}>
                    Reject
                  </DropdownMenuItem>
                  <DropdownMenuItem className="opacity-50 cursor-not-allowed">
                    {/* Placeholder for future "Add Remarks" modal if needed */}
                    Add Remarks (Not active)
                  </DropdownMenuItem>
                </>
              )}
              {!isPending && ( // Show status if not pending
                <DropdownMenuItem className="text-muted-foreground" disabled>
                  {leave.status}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="border-t border-border mt-1 pt-2" onClick={() => handleIndividualDownload('csv')}>
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

  // --- Master Download Function for Salesman Leave Applications ---
  const handleDownloadAllSalesmanLeaves = async (format: 'csv' | 'xlsx') => {
    toast.info(`Preparing to download all Salesman Leave Applications as ${format.toUpperCase()}...`);
    console.log(`Simulating master download for all Salesman Leave Applications in ${format}`);
  };

  const handleSalesmanLeaveOrderChange = (newOrder: SalesmanLeaveApplication[]) => {
    console.log("New salesman leave report order:", newOrder.map(r => r.id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Salesman Leave Applications</h2>
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <DataTableReusable
            columns={salesmanLeaveColumns}
            data={leaveApplications} // Use state for data
            reportTitle="Salesman Leave Applications"
            filterColumnAccessorKey="salesmanName" // Filter by salesman name
            onDownloadAll={handleDownloadAllSalesmanLeaves}
            enableRowDragging={false} // Leave applications typically don't need reordering
            onRowOrderChange={handleSalesmanLeaveOrderChange}
          />
        </div>
      </div>
    </div>
  );
}
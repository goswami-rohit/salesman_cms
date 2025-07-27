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
import { Input } from '@/components/ui/input'; // For search input
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination"; // For pagination
import { IconDotsVertical, IconDownload } from '@tabler/icons-react';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Salesman Leave Application Data ---
const salesmanLeaveApplicationSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>, // Unique ID for the leave entry
  salesmanName: z.string(),
  leaveType: z.string(), // e.g., "Sick Leave", "Casual Leave", "Annual Leave"
  startDate: z.string(), // e.g., "2025-08-01" (ISO string or YYYY-MM-DD)
  endDate: z.string(),   // e.g., "2025-08-03" (ISO string or YYYY-MM-DD)
  reason: z.string(),
  status: z.enum(["Pending", "Approved", "Rejected"]), // Key status field
  adminRemarks: z.string().optional().nullable(), // For admin's notes on approval/rejection
});

// Infer the TypeScript type from the Zod schema
type SalesmanLeaveApplication = z.infer<typeof salesmanLeaveApplicationSchema>;

const ITEMS_PER_PAGE = 10; // Define items per page for pagination

export default function SlmLeavesPage() {
  const [leaveApplications, setLeaveApplications] = React.useState<SalesmanLeaveApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Auth check remains the same
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

  // --- Data Fetching Logic ---
  const fetchLeaveApplications = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboardPagesAPI/slm-leaves");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SalesmanLeaveApplication[] = await response.json();
      const validatedData = data.map((item) => {
        try {
          // Validate each item against the schema
          return salesmanLeaveApplicationSchema.parse(item);
        } catch (e) {
          console.error("Validation error for item:", item, e);
          toast.error("Invalid salesman leave application data received from server.");
          return null;
        }
      }).filter(Boolean) as SalesmanLeaveApplication[]; // Filter out any items that failed validation

      setLeaveApplications(validatedData);
      toast.success("Salesman leave applications loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch salesman leave applications:", e);
      setError(e.message || "Failed to fetch leave applications.");
      toast.error(e.message || "Failed to load salesman leave applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLeaveApplications();
  }, [fetchLeaveApplications]);

  // --- Handle Leave Approval/Rejection ---
  const handleLeaveAction = async (id: UniqueIdentifier, newStatus: "Approved" | "Rejected", remarks: string | null = null) => {
    try {
      setLoading(true); // Indicate loading for the action
      const response = await fetch('/api/dashboardPagesAPI/slm-leaves', {
        method: 'PATCH', // Use PATCH for partial updates
        headers: {
          'Content-Type': 'application/json',
        },
        // Explicitly pass adminRemarks: remarks to avoid shorthand property error if linter is strict
        body: JSON.stringify({ id, status: newStatus, adminRemarks: remarks }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const updatedApplication: SalesmanLeaveApplication = await response.json();
      
      // Update the local state with the returned updated application
      setLeaveApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === id
            // The updatedApplication.adminRemarks will be string | null from the server
            ? { ...app, status: updatedApplication.status, adminRemarks: updatedApplication.adminRemarks }
            : app
        )
      );
      toast.success(`Leave for ${updatedApplication.salesmanName} ${newStatus.toLowerCase()}!`);
    } catch (e: any) {
      console.error("Failed to update leave application:", e);
      toast.error(e.message || "Failed to update leave application.");
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering and Pagination Logic ---
  const filteredApplications = leaveApplications.filter((app) => {
    const matchesSearch =
      app.salesmanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.status.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedApplications = filteredApplications.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  React.useEffect(() => {
    setCurrentPage(1); // Reset page to 1 when search query changes
  }, [searchQuery]);

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
        let className = "";
        switch (status) {
          case "Approved":
            className = "bg-green-500 hover:bg-green-600 text-white"; // Tailwind classes
            break;
          case "Rejected":
            className = "bg-red-500 hover:bg-red-600 text-white";
            break;
          case "Pending":
            className = "bg-yellow-500 hover:bg-yellow-600 text-black"; // Pending is usually yellow/orange
            break;
        }
        return (
          <Badge className={className}>
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
          // In a real scenario, you'd call an API endpoint here to generate and download the file.
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

  // --- Loading and Error States ---
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading salesman leave applications...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 min-h-screen pt-10">
        Error: {error}
        <Button onClick={fetchLeaveApplications} className="ml-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Salesman Leave Applications</h2>
          <Button onClick={() => handleDownloadAllSalesmanLeaves('xlsx')} className="flex items-center gap-2">
            <IconDownload size={20} /> Download All
          </Button>
        </div>

        {/* Search Input */}
        <div className="flex justify-end mb-4">
          <Input
            placeholder="Search leaves..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          {paginatedApplications.length === 0 && !loading && !error ? (
            <div className="text-center text-gray-500 py-8">No salesman leave applications found.</div>
          ) : (
            <>
              <DataTableReusable
                columns={salesmanLeaveColumns}
                data={paginatedApplications}
                reportTitle="Salesman Leave Applications"
                filterColumnAccessorKey="salesmanName" // Filter by salesman name
                onDownloadAll={handleDownloadAllSalesmanLeaves}
                enableRowDragging={false} // Leave applications typically don't need reordering
                onRowOrderChange={handleSalesmanLeaveOrderChange}
              />
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      aria-disabled={currentPage === 1}
                      tabIndex={currentPage === 1 ? -1 : undefined}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        onClick={() => handlePageChange(index + 1)}
                        isActive={currentPage === index + 1}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      aria-disabled={currentPage === totalPages}
                      tabIndex={currentPage === totalPages ? -1 : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// src/app/dashboard/slmLeaves/page.tsx
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

  // --- Data Fetching Logic ---
  const apiURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/slm-leaves`
  const fetchLeaveApplications = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiURI);
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
      const response = await fetch(apiURI, {
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
    {
      accessorKey: "reason", header: "Reason",
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
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const app = row.original;
        const isPending = app.status === 'Pending';

        // Show buttons only when Pending, otherwise show a subtle dash
        if (!isPending) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }

        const onAccept = async () => {
          // call your handler
          await handleLeaveAction(app.id, 'Approved');
        };

        const onReject = async () => {
          // Ask for reason (often required)
          const remark = window.prompt(`Reason for rejecting ${app.salesmanName}'s leave (optional):`, '');
          await handleLeaveAction(app.id, 'Rejected', remark === null ? null : remark);
        };

        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={onAccept} className="bg-green-600 hover:bg-green-700 text-white">
              Accept
            </Button>
            <Button size="sm" variant="outline" onClick={onReject} className="border-red-500 text-red-600 hover:bg-red-50">
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

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
                //filterColumnAccessorKey="salesmanName" // Filter by salesman name
                enableRowDragging={false}
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
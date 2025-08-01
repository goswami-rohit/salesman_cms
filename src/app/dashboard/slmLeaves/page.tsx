// src/app/dashboard/slmLeaves/page.tsx
'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { UniqueIdentifier } from '@dnd-kit/core';

// Import your Shadcn UI components
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { IconDotsVertical, IconDownload, IconLoader2 } from '@tabler/icons-react';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Salesman Leave Application Data ---
const salesmanLeaveApplicationSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>,
  salesmanName: z.string(),
  leaveType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string(),
  status: z.enum(["Pending", "Approved", "Rejected"]),
  adminRemarks: z.string().optional().nullable(),
});

type SalesmanLeaveApplication = z.infer<typeof salesmanLeaveApplicationSchema>;

const ITEMS_PER_PAGE = 10;

export default function SlmLeavesPage() {
  const [leaveApplications, setLeaveApplications] = React.useState<SalesmanLeaveApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

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
          return salesmanLeaveApplicationSchema.parse(item);
        } catch (e) {
          console.error("Validation error for item:", item, e);
          toast.error("Invalid salesman leave application data received from server.");
          return null;
        }
      }).filter(Boolean) as SalesmanLeaveApplication[];

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
      setLoading(true);
      const response = await fetch('/api/dashboardPagesAPI/slm-leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, adminRemarks: remarks }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const updatedApplication: SalesmanLeaveApplication = await response.json();
      
      setLeaveApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === id
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
    setCurrentPage(1);
  }, [searchQuery]);

  // --- Download Functionality (New) ---
  const handleDownload = async (format: 'csv', ids?: UniqueIdentifier[]) => {
    setDownloading(true);
    const idString = ids?.join(',') || '';
    const query = `?format=${format}${ids ? `&ids=${idString}` : ''}`;
    
    const downloadUrl = `/api/dashboardPagesAPI/slm-leaves${query}`;
    
    window.open(downloadUrl, '_blank');
    
    setDownloading(false);
    toast.success(`Download started for ${format.toUpperCase()} file!`);
  };

  // Corrected function to be async to match the DataTableReusable prop
  const handleDownloadAllSalesmanLeaves = async (format: 'csv' | 'xlsx') => {
    if (format === 'csv') {
      await handleDownload(format);
    } else {
      toast.info("XLSX downloading is not yet implemented.");
    }
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
        let className = "";
        switch (status) {
          case "Approved":
            className = "bg-green-500 hover:bg-green-600 text-white";
            break;
          case "Rejected":
            className = "bg-red-500 hover:bg-red-600 text-white";
            break;
          case "Pending":
            className = "bg-yellow-500 hover:bg-yellow-600 text-black";
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

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
              {isPending && (
                <>
                  <DropdownMenuItem onClick={() => handleLeaveAction(leave.id, "Approved", "Approved by admin.")}>
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLeaveAction(leave.id, "Rejected", "Rejected by admin.")}>
                    Reject
                  </DropdownMenuItem>
                </>
              )}
              {!isPending && (
                <DropdownMenuItem className="text-muted-foreground" disabled>
                  {leave.status}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="border-t border-border mt-1 pt-2" onClick={() => handleDownload('csv', [leave.id])}>
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("XLSX downloading is not yet implemented.")}>
                Download XLSX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <Button onClick={() => handleDownloadAllSalesmanLeaves('csv')} disabled={downloading} className="flex items-center gap-2">
            {downloading ? <IconLoader2 className="animate-spin" size={20} /> : <IconDownload size={20} />}
            Download All
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
                filterColumnAccessorKey="salesmanName"
                onDownloadAll={handleDownloadAllSalesmanLeaves}
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
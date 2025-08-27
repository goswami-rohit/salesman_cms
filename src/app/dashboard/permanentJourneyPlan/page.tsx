// src/app/dashboard/permanentJourneyPlan/page.tsx
'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { UniqueIdentifier } from '@dnd-kit/core';
// Import your Shadcn UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Permanent Journey Plan Data with new fields ---
const permanentJourneyPlanSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>,
  salesmanName: z.string(),
  userId: z.number().int(), // Added userId
  createdByName: z.string(), // Added createdByName
  createdByRole: z.string(), // Added createdByRole
  areaToBeVisited: z.string(),
  planDate: z.string(), // Renamed to planDate to match backend
  description: z.string().optional().nullable(),
  status: z.string(), // Added status
  taskIds: z.array(z.string()), // Added taskIds
});

// Infer the TypeScript type from the Zod schema
type PermanentJourneyPlan = z.infer<typeof permanentJourneyPlanSchema>;

const ITEMS_PER_PAGE = 10; // Define items per page for pagination

export default function PermanentJourneyPlanPage() {
  const [pjps, setPjps] = React.useState<PermanentJourneyPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  // --- Data Fetching Logic ---
  const fetchPjps = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the new, correct API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/permanent-journey-plan`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: PermanentJourneyPlan[] = await response.json();
      const validatedData = data.map((item) => {
        try {
          return permanentJourneyPlanSchema.parse(item);
        } catch (e) {
          console.error("Validation error for item:", item, e);
          toast.error("Invalid PJP data received from server.");
          return null;
        }
      }).filter(Boolean) as PermanentJourneyPlan[];
      setPjps(validatedData);
      toast.success("Permanent Journey Plans loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch PJPs:", e);
      setError(e.message || "Failed to fetch PJPs.");
      toast.error(e.message || "Failed to load Permanent Journey Plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPjps();
  }, [fetchPjps]);

  // --- Filtering and Pagination Logic ---
  const filteredPjps = pjps.filter((pjp) => {
    const matchesSearch =
      pjp.salesmanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pjp.areaToBeVisited.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pjp.description && pjp.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      pjp.planDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pjp.createdByName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredPjps.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPjps = filteredPjps.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  React.useEffect(() => {
    // Reset page to 1 when search query changes
    setCurrentPage(1);
  }, [searchQuery]);

  // --- 3. Define Columns for Permanent Journey Plan DataTable ---
  const permanentJourneyPlanColumns: ColumnDef<PermanentJourneyPlan>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "createdByName", header: "Created By" },
    { accessorKey: "createdByRole", header: "Creator Role" },
    { accessorKey: "areaToBeVisited", header: "Area to Visit",
      cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.original.areaToBeVisited}</span>,
    },
    { accessorKey: "planDate", header: "Planned Date" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "description", header: "Description",
      cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.original.description || "N/A"}</span>,
    },
    { accessorKey: "taskIds", header: "Task IDs",
      cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.original.taskIds.join(', ')}</span>,
    },
  ];

  const handlePermanentJourneyPlanOrderChange = (newOrder: PermanentJourneyPlan[]) => {
    console.log("New permanent journey plan order:", newOrder.map(r => r.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading Permanent Journey Plans...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 min-h-screen pt-10">
        Error: {error}
        <Button onClick={fetchPjps} className="ml-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Permanent Journey Plans</h2>
        </div>

        {/* Search Input */}
        <div className="flex justify-end mb-4">
          <Input
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          {filteredPjps.length === 0 && !loading && !error ? (
            <div className="text-center text-gray-500 py-8">No permanent journey plans found.</div>
          ) : (
            <>
              <DataTableReusable
                columns={permanentJourneyPlanColumns}
                data={currentPjps}
                //filterColumnAccessorKey="areaToBeVisited"
                enableRowDragging={false}
                onRowOrderChange={handlePermanentJourneyPlanOrderChange}
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

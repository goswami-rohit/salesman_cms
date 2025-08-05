// src/app/dashboard/permanentJourneyPlan/page.tsx
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconDownload } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
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

// --- 1. Define Zod Schema for Permanent Journey Plan Data ---
const permanentJourneyPlanSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>,
  salesmanName: z.string(),
  areaToBeVisited: z.string(),
  date: z.string(), // YYYY-MM-DD string from backend
  description: z.string().optional().nullable(),
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
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [selectedPjp, setSelectedPjp] = React.useState<PermanentJourneyPlan | null>(null);

  // React.useEffect(() => {
  //   async function checkAuth() {
  //     const claims = await getTokenClaims();
  //     if (!claims || !claims.sub) {
  //       redirect('/login');
  //     }
  //     if (!claims.org_id) {
  //       redirect('/dashboard');
  //     }
  //   }
  //   checkAuth();
  // }, []);

  // --- Data Fetching Logic ---
  const fetchPjps = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the new, correct API endpoint
      const response = await fetch("/api/dashboardPagesAPI/permanent-journey-plan");
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
      pjp.date.toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleViewPjp = (pjp: PermanentJourneyPlan) => {
    setSelectedPjp(pjp);
    setIsViewModalOpen(true);
  };

  // const dummyDownloadFunction = async (format: 'csv' | 'xlsx') => {
  //   console.log(`Download for ${format} requested, but download functionality is avialbe on Download Reports page.`);
  // };


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
        // const handleIndividualDownload = async (format: 'csv' | 'xlsx') => {
        //   toast.info(`Downloading PJP for ${row.original.areaToBeVisited} on ${row.original.date} as ${format.toUpperCase()}...`);
        //   console.log(`Simulating individual download for ${row.original.id} in ${format}`);
        //   // In a real scenario, you'd call an API endpoint here to generate and download the file.
        // };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
              <DropdownMenuItem onClick={() => handleViewPjp(row.original)}>
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // --- 4. Master Download Function for Permanent Journey Plans ---
  // const handleDownloadAllPermanentJourneyPlans = async (format: 'csv' | 'xlsx') => {
  //   toast.info(`Preparing to download all Permanent Journey Plans as ${format.toUpperCase()}...`);
  //   console.log(`Simulating master download for all Permanent Journey Plans in ${format}`);
  // };

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
          {/* <Button onClick={() => handleDownloadAllPermanentJourneyPlans('xlsx')} className="flex items-center gap-2">
            <IconDownload size={20} /> Download All
          </Button> */}
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
                //reportTitle="Permanent Journey Plans"
                //filterColumnAccessorKey="areaToBeVisited"
                //onDownloadAll={dummyDownloadFunction}
                enableRowDragging={false}
                onRowOrderChange={handlePermanentJourneyPlanOrderChange}
                // Removed: hideToolbar={true}
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

      {selectedPjp && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Permanent Journey Plan Details</DialogTitle>
              <DialogDescription>
                Detailed information about the permanent journey plan.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              <div>
                <Label htmlFor="salesmanName">Salesman Name</Label>
                <Input id="salesmanName" value={selectedPjp.salesmanName} readOnly />
              </div>
              <div>
                <Label htmlFor="areaToBeVisited">Area to Visit</Label>
                <Input id="areaToBeVisited" value={selectedPjp.areaToBeVisited} readOnly />
              </div>
              <div>
                <Label htmlFor="date">Planned Date</Label>
                <Input id="date" value={selectedPjp.date} readOnly />
              </div>
              <div className="col-span-1">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={selectedPjp.description || 'N/A'} readOnly className="h-24" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
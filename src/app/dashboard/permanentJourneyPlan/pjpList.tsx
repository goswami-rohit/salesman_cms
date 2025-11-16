// src/app/dashboard/permanentJourneyPlan/pjpList.tsx
'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { DataTableReusable } from '@/components/data-table-reusable';
import { permanentJourneyPlanSchema } from '@/lib/shared-zod-schema';
import { BASE_URL } from '@/lib/Reusable-constants';

// Infer the TypeScript type from the Zod schema
type PermanentJourneyPlan = z.infer<typeof permanentJourneyPlanSchema>;

const ITEMS_PER_PAGE = 10; // Define items per page for pagination

export default function PJPListPage() {
  const [pjps, setPjps] = React.useState<PermanentJourneyPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  // NEW: filters for role and status
  // filters
  const [selectedRoleFilter, setSelectedRoleFilter] = React.useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<string>('all');
  const [selectedSalesmanFilter, setSelectedSalesmanFilter] = React.useState<string>('all');

  // --- NEW STATE FOR IN-BUTTON LOADING ---
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Derived lists for filter dropdowns
  const roleOptions = React.useMemo(() => {
    const setRoles = new Set<string>();
    pjps.forEach(p => {
      if (p.createdByRole) setRoles.add(p.createdByRole);
    });
    return ['all', ...Array.from(setRoles).sort()];
  }, [pjps]);

  const statusOptions = React.useMemo(() => {
    const setStatus = new Set<string>();
    pjps.forEach(p => {
      if (p.status) setStatus.add(p.status);
    });
    return ['all', ...Array.from(setStatus).sort()];
  }, [pjps]);

  const salesmanOptions = React.useMemo(() => {
    const setSalesmen = new Set<string>();
    pjps.forEach((p) => {
      if (p.salesmanName) setSalesmen.add(p.salesmanName);
    });
    return ['all', ...Array.from(setSalesmen).sort()];
  }, [pjps]);

  // --- Data Fetching Logic ---
  const fetchPjps = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the new, correct API endpoint
      const response = await fetch(`/api/dashboardPagesAPI/permanent-journey-plan?verificationStatus=VERIFIED`);
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

  // --- DELETE HANDLER ---
  const handleDeletePjp = async (id: string) => {
    setDeletingId(id); // Set loading state for this specific button
    try {
      const response = await fetch(
        `/api/dashboardPagesAPI/permanent-journey-plan?id=${id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete PJP');
      }

      toast.success('PJP deleted successfully');
      fetchPjps(); // Refresh the list
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeletingId(null); // Clear loading state
    }
  };

  // --- Filtering and Pagination Logic ---
  const filteredPjps = React.useMemo(() => {
    return pjps.filter((pjp) => {
      const matchesSearch =
        (pjp.salesmanName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pjp.areaToBeVisited || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pjp.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pjp.planDate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pjp.createdByName || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = selectedRoleFilter === 'all' ? true : (pjp.createdByRole === selectedRoleFilter);
      const matchesStatus = selectedStatusFilter === 'all' ? true : (pjp.status === selectedStatusFilter);
      const matchesSalesman = selectedSalesmanFilter === 'all' ? true : pjp.salesmanName === selectedSalesmanFilter;
      return matchesSearch && matchesRole && matchesStatus && matchesSalesman;
    });
  }, [pjps, searchQuery, selectedRoleFilter, selectedStatusFilter, selectedSalesmanFilter,]);

  const totalPages = Math.max(1, Math.ceil(filteredPjps.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPjps = filteredPjps.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  React.useEffect(() => {
    // Reset page to 1 when filters/search change
    setCurrentPage(1);
  }, [searchQuery, selectedRoleFilter, selectedStatusFilter, selectedSalesmanFilter,]);

  // --- 3. Define Columns for Permanent Journey Plan DataTable ---
  const permanentJourneyPlanColumns: ColumnDef<PermanentJourneyPlan>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "createdByName", header: "Created By" },
    { accessorKey: "createdByRole", header: "Creator Role" },
    {
      accessorKey: "areaToBeVisited", header: "Area to Visit",
      cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.original.areaToBeVisited}</span>,
    },
    { accessorKey: "visitDealerName", header: "Dealer Name" },
    { accessorKey: "planDate", header: "Planned Date" },
    { accessorKey: "status", header: "Status" },
    {
      accessorKey: "description", header: "Description",
      cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.original.description || "N/A"}</span>,
    },
    {
      accessorKey: "taskIds", header: "Task IDs",
      cell: ({ row }) => <span className="max-w-[300px] truncate block">{(row.original.taskIds || []).join(', ')}</span>,
    },
    { accessorKey: "verificationStatus", header: "Verification Status" },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const pjp = row.original;
        const isDeleting = deletingId === pjp.id;
        return (
          <Button
            className="bg-red-800 hover:bg-red-900 text-white"
            size="sm"
            onClick={() => handleDeletePjp(pjp.id)}
            disabled={isDeleting || loading} // Disable if this row is deleting or table is refreshing
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        );
      },
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

        {/* Controls: Search + Filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Input
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Salesman filter */}
            <Select
              value={selectedSalesmanFilter}
              onValueChange={(v) => setSelectedSalesmanFilter(v)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by Salesman" />
              </SelectTrigger>
              <SelectContent>
                {salesmanOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name === 'all' ? 'All Salesmen' : name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Role filter */}
            <Select
              value={selectedRoleFilter}
              onValueChange={(v) => setSelectedRoleFilter(v)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role === 'all' ? 'All Roles' : role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select
              value={selectedStatusFilter}
              onValueChange={(v) => setSelectedStatusFilter(v)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status}
                  </SelectItem >
                ))}
              </SelectContent>
            </Select>
          </div>
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

// src/app/dashboard/masonpcSide/schemesOffers.tsx
'use client';

import React, { useState, useMemo } from 'react';
// Removed: import { useRouter } from 'next/navigation'; - Replaced with window.location
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';
// Import the schema for this page
import { schemesOffersSchema } from '@/lib/shared-zod-schema';

// UI Components for Filtering/Pagination
// Changed paths from alias to relative
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import { Search, Loader2 } from 'lucide-react';
import { BASE_URL } from '@/lib/Reusable-constants';

// --- CONSTANTS AND TYPES ---
const ITEMS_PER_PAGE = 10;
// API Endpoints
const SCHEMES_OFFERS_API_ENDPOINT = `/api/dashboardPagesAPI/masonpc-side/schemes-offers`;
// Note: Location and Role endpoints are not needed for this page.

// The Zod schema provides the full type definition needed.
type SchemeOffer = z.infer<typeof schemesOffersSchema>;

// --- HELPER FUNCTIONS ---

/**
 * Formats an ISO date string to a more readable format (e.g., "Jan 1, 2024")
 */
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return 'Invalid Date';
  }
};

// --- MAIN COMPONENT ---

export default function SchemesOffersPage() {
  // Removed: const router = useRouter();
  const [schemesOffers, setSchemesOffers] = React.useState<SchemeOffer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState(''); // Scheme Name
  const [currentPage, setCurrentPage] = useState(1);
  // Note: Role, Area, and Region filters are not applicable to this model.

  // --- Data Fetching Functions ---

  /**
   * Fetches the main schemes/offers data.
   */
  const fetchSchemesOffers = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(SCHEMES_OFFERS_API_ENDPOINT);
      if (!response.ok) {
         if (response.status === 401) {
          toast.error('You are not authenticated. Redirecting to login.');
          // Replaced router.push with window.location.href
          window.location.href = '/login';
          return;
        }
        if (response.status === 403) {
          toast.error('You do not have permission to access this page. Redirecting.');
          // Replaced router.push with window.location.href
          window.location.href = '/dashboard';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SchemeOffer[] = await response.json();
      setSchemesOffers(data);
      toast.success("Schemes & offers loaded successfully!");
    } catch (error: any) {
      console.error("Failed to fetch schemes/offers:", error);
      toast.error(`Failed to fetch schemes/offers: ${error.message}`);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed router from dependency array


  // Initial data loads
  React.useEffect(() => {
    fetchSchemesOffers();
    // No need to fetch locations or roles
  }, [fetchSchemesOffers]);


  // --- Filtering and Pagination Logic ---
  const filteredSchemes = useMemo(() => {
    // Recalculate filtered data whenever schemes or filter states change
    setCurrentPage(1); // Reset page on filter change
    
    return schemesOffers.filter((scheme) => {
      // 1. Scheme Name Search (fuzzy match)
      const nameMatch = !searchQuery ||
        scheme.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Combine all conditions (only one in this case)
      return nameMatch;
    });
  }, [schemesOffers, searchQuery]);


  const totalPages = Math.ceil(filteredSchemes.length / ITEMS_PER_PAGE);
  // Slice the filtered data for the current page
  const currentSchemes = filteredSchemes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  

  // --- 3. Define Columns for Schemes & Offers DataTable ---
  const schemesOffersColumns: ColumnDef<SchemeOffer>[] = [
    { accessorKey: "name", header: "Scheme Name" },
    { 
      accessorKey: "description", 
      header: "Description",
      cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.original.description ?? 'N/A'}</span>,
    },
    { 
      accessorKey: "startDate", 
      header: "Start Date",
      cell: ({ row }) => formatDate(row.original.startDate) 
    },
    { 
      accessorKey: "endDate", 
      header: "End Date",
      cell: ({ row }) => formatDate(row.original.endDate) 
    },
  ];

  const handleSchemeOfferOrderChange = (newOrder: SchemeOffer[]) => {
    console.log("New scheme/offer order:", newOrder.map(r => r.id));
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-screen">Loading schemes & offers...</div>;

  if (error) return (
    <div className="text-center text-red-500 min-h-screen pt-10">
      Error: {error}
      <Button onClick={fetchSchemesOffers} className="ml-4">Retry</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Schemes & Offers</h2>
        </div>

        {/* --- Filter Components --- */}
        <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-card border">
          {/* 1. Scheme Name Search Input */}
          <div className="flex flex-col space-y-1 w-full sm:w-[250px] min-w-[150px]">
            <label className="text-sm font-medium text-muted-foreground">Scheme Name</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          {/* Role, Area, and Region filters are not applicable here */}
        </div>
        {/* --- End Filter Components --- */}

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          {filteredSchemes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No schemes or offers found matching the selected filters.</div>
          ) : (
            <>
              <DataTableReusable
                columns={schemesOffersColumns}
                data={currentSchemes} // Use filtered and paginated data
                enableRowDragging={false} 
                onRowOrderChange={handleSchemeOfferOrderChange}
              />
              
              {/* --- Pagination --- */}
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
                    <PaginationItem key={index} aria-current={currentPage === index + 1 ? "page" : undefined}>
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
              {/* --- End Pagination --- */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
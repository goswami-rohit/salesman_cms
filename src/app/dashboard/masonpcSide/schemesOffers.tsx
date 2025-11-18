// src/app/dashboard/masonpcSide/schemesOffers.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { Search, Loader2 } from 'lucide-react';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';
// Import the schema for this page
import { schemesOffersSchema } from '@/lib/shared-zod-schema';

// UI Components for Filtering
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// import { BASE_URL } from '@/lib/Reusable-constants'; // Keep if needed elsewhere

// API Endpoints
const SCHEMES_OFFERS_API_ENDPOINT = `/api/dashboardPagesAPI/masonpc-side/schemes-offers`;

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
  const [schemesOffers, setSchemesOffers] = useState<SchemeOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState(''); // Scheme Name

  // --- Data Fetching Functions ---

  /**
   * Fetches the main schemes/offers data.
   */
  const fetchSchemesOffers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(SCHEMES_OFFERS_API_ENDPOINT);
      if (!response.ok) {
         if (response.status === 401) {
          toast.error('You are not authenticated. Redirecting to login.');
          window.location.href = '/login';
          return;
        }
        if (response.status === 403) {
          toast.error('You do not have permission to access this page. Redirecting.');
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
  }, []); 

  // Initial data loads
  useEffect(() => {
    fetchSchemesOffers();
  }, [fetchSchemesOffers]);


  // --- Filtering Logic ---
  const filteredSchemes = useMemo(() => {
    // ⚠️ Removed manual reset of currentPage state
    
    return schemesOffers.filter((scheme) => {
      // 1. Scheme Name Search (fuzzy match)
      const nameMatch = !searchQuery ||
        scheme.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return nameMatch;
    });
  }, [schemesOffers, searchQuery]);

  // --- Define Columns for Schemes & Offers DataTable (unchanged) ---
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

  // --- Loading / Error Gates ---
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
        </div>
        {/* --- End Filter Components --- */}

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          {filteredSchemes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No schemes or offers found matching the selected filters.</div>
          ) : (
            <DataTableReusable
              columns={schemesOffersColumns}
              data={filteredSchemes}
              enableRowDragging={false} 
              onRowOrderChange={handleSchemeOfferOrderChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
// src/app/dashboard/masonpcSide/masonOnSchemes.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
// Removed: import { useRouter } from 'next/navigation'; - Replaced with window.location
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';

// Import the reusable DataTable (using aliased path as requested)
import { DataTableReusable } from '@/components/data-table-reusable';
// Import the schema for this page (using aliased path as requested)
import { masonOnSchemeSchema } from '@/lib/shared-zod-schema';

// UI Components for Filtering/Pagination (using aliased paths as requested)
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
const MASON_ON_SCHEMES_API_ENDPOINT = `/api/dashboardPagesAPI/masonpc-side/masonOnSchemes`;
const LOCATION_API_ENDPOINT = `/api/users/user-locations`; 
const ROLES_API_ENDPOINT = `/api/users/user-roles`; 

interface LocationsResponse {
  areas: string[];
  regions: string[];
}
interface RolesResponse {
    roles: string[]; 
}

// Type for data coming from the API (based on schema + assumed joins)
type ApiMasonOnScheme = z.infer<typeof masonOnSchemeSchema> & {
    masonName: string;    // Assuming API provides this (from masonId)
    schemeName: string;   // Assuming API provides this (from schemeId)
    salesmanName: string; // Assuming API provides this (from mason's user)
    role: string;         // Assuming API provides this (from mason's user)
    area: string;         // Assuming API provides this (from mason's user)
    region: string;       // Assuming API provides this (from mason's user)
};

// **FIX:** Type for data used in the table (must include a unique `id`)
type TableMasonOnScheme = ApiMasonOnScheme & {
  id: string; // Add composite ID for the table
};


// --- HELPER FUNCTIONS ---

/**
 * Helper function to render the Select filter component
 */
const renderSelectFilter = (
  label: string,
  value: string,
  onValueChange: (v: string) => void,
  options: string[],
  isLoading: boolean = false
) => (
  <div className="flex flex-col space-y-1 w-full sm:w-[150px] min-w-[120px]">
    <label className="text-sm font-medium text-muted-foreground">{label}</label>
    <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
      <SelectTrigger className="h-9">
        {isLoading ? (
          <div className="flex flex-row items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <SelectValue placeholder={`Select ${label}`} />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}s</SelectItem>
        {options.map(option => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

/**
 * Formats an ISO date string to a more readable format (e.g., "Jan 1, 2024")
 * (Copied from tsoMeetings.tsx template)
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

export default function MasonOnSchemesPage() {
  // Removed: const router = useRouter();
  // **FIX:** Use the new TableMasonOnScheme type for state
  const [masonOnSchemes, setMasonOnSchemes] = React.useState<TableMasonOnScheme[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState(''); // Mason Name
  const [roleFilter, setRoleFilter] = useState('all'); // User Role
  const [areaFilter, setAreaFilter] = useState('all'); // User Area
  const [regionFilter, setRegionFilter] = useState('all'); // User Region
  const [currentPage, setCurrentPage] = useState(1);

  // --- Filter Options States ---
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  
  const [locationError, setLocationError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);


  // --- Data Fetching Functions ---

  /**
   * Fetches the main Mason on Schemes data.
   */
  const fetchMasonOnSchemes = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(MASON_ON_SCHEMES_API_ENDPOINT);
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
      // **FIX:** Data from API matches ApiMasonOnScheme
      const data: ApiMasonOnScheme[] = await response.json();
      
      // **FIX:** Map data to create a unique `id` for the table
      const tableData = data.map(record => ({
        ...record,
        id: `${record.masonId}-${record.schemeId}` // Create a unique composite ID
      }));

      setMasonOnSchemes(tableData); // Set state with table-ready data
      toast.success("Mason scheme enrollments loaded successfully!");
    } catch (error: any) { // This brace was fixed in the previous turn
      console.error("Failed to fetch mason scheme enrollments:", error);
      toast.error(`Failed to fetch mason scheme enrollments: ${error.message}`);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []); 


  /**
   * Fetches unique areas and regions for the filter dropdowns.
   */
  const fetchLocations = useCallback(async () => {
    setIsLoadingLocations(true);
    setLocationError(null);
    try {
      const response = await fetch(LOCATION_API_ENDPOINT);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: LocationsResponse = await response.json();
      setAvailableAreas(Array.isArray(data.areas) ? data.areas.filter(Boolean) : []);
      setAvailableRegions(Array.isArray(data.regions) ? data.regions.filter(Boolean) : []);
    } catch (err: any) {
      console.error('Failed to fetch filter locations:', err);
      setLocationError('Failed to load Area/Region filters.');
      toast.error('Failed to load location filters.');
    } finally {
      setIsLoadingLocations(false);
    }
  }, []);

  /**
   * Fetches unique roles for the filter dropdowns.
   */
  const fetchRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    setRoleError(null);
    try {
      const response = await fetch(ROLES_API_ENDPOINT);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: RolesResponse = await response.json(); 
      const roles = data.roles && Array.isArray(data.roles) ? data.roles : [];
      setAvailableRoles(roles.filter(Boolean));
    } catch (err: any) {
      console.error('Failed to fetch filter roles:', err);
      setRoleError('Failed to load Role filters.');
      toast.error('Failed to load role filters.');
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  // Initial data loads for reports and filter options
  React.useEffect(() => {
    fetchMasonOnSchemes();
    fetchLocations();
    fetchRoles();
  }, [fetchMasonOnSchemes, fetchLocations, fetchRoles]);


  // --- Filtering and Pagination Logic ---
  const filteredEnrollments = useMemo(() => {
    setCurrentPage(1); // Reset page on filter change
    
    return masonOnSchemes.filter((record) => {
      // 1. Mason Name Search (from assumed joined `masonName` field)
      const nameMatch = !searchQuery ||
        record.masonName.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Role Filter (from assumed joined `role` field)
      const roleMatch = roleFilter === 'all' || 
        record.role?.toLowerCase() === roleFilter.toLowerCase(); 

      // 3. Area Filter (from assumed joined `area` field)
      const areaMatch = areaFilter === 'all' || 
        record.area?.toLowerCase() === areaFilter.toLowerCase(); 

      // 4. Region Filter (from assumed joined `region` field)
      const regionMatch = regionFilter === 'all' || 
        record.region?.toLowerCase() === regionFilter.toLowerCase();
      
      // Combine all conditions
      return nameMatch && roleMatch && areaMatch && regionMatch;
    });
  }, [masonOnSchemes, searchQuery, roleFilter, areaFilter, regionFilter]);


  const totalPages = Math.ceil(filteredEnrollments.length / ITEMS_PER_PAGE);
  // Slice the filtered data for the current page
  const currentEnrollments = filteredEnrollments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  

  // --- 3. Define Columns for Mason/PC DataTable ---
  // **FIX:** Use the new TableMasonOnScheme type for ColumnDef
  const masonOnSchemeColumns: ColumnDef<TableMasonOnScheme>[] = [
    { accessorKey: "masonName", header: "Mason Name" },
    { accessorKey: "schemeName", header: "Scheme Name" },
    { accessorKey: "status", header: "Status" },
    { 
      accessorKey: "enrolledAt", 
      header: "Enrolled At",
      cell: ({ row }) => formatDate(row.original.enrolledAt)
    },
    { accessorKey: "salesmanName", header: "Associated User" },
    { accessorKey: "role", header: "User Role" },
    { accessorKey: "area", header: "Area" },
    { accessorKey: "region", header: "Region" },
  ];

  // **FIX:** Use the new TableMasonOnScheme type for the handler
  const handleMasonOnSchemeOrderChange = (newOrder: TableMasonOnScheme[]) => {
    console.log("New mason-on-scheme order:", newOrder.map(r => r.id)); // Use the new composite id
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-screen">Loading mason scheme enrollments...</div>;

  if (error) return (
    <div className="text-center text-red-500 min-h-screen pt-10">
      Error: {error}
      <Button onClick={fetchMasonOnSchemes} className="ml-4">Retry</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Mason Scheme Enrollments</h2>
        </div>

        {/* --- Filter Components --- */}
        <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-card border">
          {/* 1. Mason Name Search Input */}
          <div className="flex flex-col space-y-1 w-full sm:w-[250px] min-w-[150px]">
            <label className="text-sm font-medium text-muted-foreground">Mason Name</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by mason name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* 2. Role Filter */}
          {renderSelectFilter(
            'Role', 
            roleFilter, 
            (v) => { setRoleFilter(v); }, 
            availableRoles, 
            isLoadingRoles
          )}

          {/* 3. Area Filter (Commented out to match sample) */}
          {/* {renderSelectFilter(
            'Area', 
            areaFilter, 
            (v) => { setAreaFilter(v); }, 
            availableAreas, 
            isLoadingLocations
          )} */}

          {/* 4. Region Filter (Commented out to match sample) */}
          {/* {renderSelectFilter(
            'Region', 
            regionFilter, 
            (v) => { setRegionFilter(v); }, 
            availableRegions, 
            isLoadingLocations
          )} */}
          
          {/* Display filter option errors if any */}
          {locationError && <p className="text-xs text-red-500 w-full">Location Filter Error: {locationError}</p>}
          {roleError && <p className="text-xs text-red-500 w-full">Role Filter Error: {roleError}</p>}
        </div>
        {/* --- End Filter Components --- */}

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          {filteredEnrollments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No mason scheme enrollments found matching the selected filters.</div>
          ) : (
            <>
              <DataTableReusable
                columns={masonOnSchemeColumns}
                data={currentEnrollments} // Use filtered and paginated data
                enableRowDragging={false} 
                onRowOrderChange={handleMasonOnSchemeOrderChange}
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
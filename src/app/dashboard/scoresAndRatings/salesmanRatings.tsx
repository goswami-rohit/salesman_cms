// app/dashboard/scoresAndRatings/salesmanRatings.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import { DataTableReusable } from '@/components/data-table-reusable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { salesmanRatingSchema } from '@/app/api/dashboardPagesAPI/scores-ratings/route';

// UI Components for Filtering
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Added Button for Retry

// --- CONSTANTS AND TYPES ---
const ITEMS_PER_PAGE = 10;
const LOCATION_API_ENDPOINT = `${process.env.NEXT_PUBLIC_APP_URL}/api/users/user-locations`; 
const ROLES_API_ENDPOINT = `${process.env.NEXT_PUBLIC_APP_URL}/api/users/user-roles`; 

interface LocationsResponse {
  areas: string[];
  regions: string[];
}
interface RolesResponse {
    roles: string[]; 
}

// Infer the TypeScript type from the Zod schema and extend it
// We assume the API provides the salesman's role for filtering purposes, 
// even though it's not explicitly in the displayed columns.
type SalesmanRating = z.infer<typeof salesmanRatingSchema> & {
    salesmanRole: string; // Assumed key for role filtering
};


// Column helper to define the columns for the data table
const columnHelper = createColumnHelper<SalesmanRating>();

// --- COLUMN DEFINITIONS (PRESERVED AS IS) ---
const columns: ColumnDef<SalesmanRating, any>[] = [
  // Define columns for the table, including headers and cell rendering
  columnHelper.accessor('salesPersonName', {
    header: 'Sales Person Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('area', {
    header: 'Area',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('region', {
    header: 'Region',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('rating', {
    header: 'Rating',
    cell: (info) => {
      const rating = info.getValue();
      // Ensure rating is treated as a number for comparison
      const numRating = Number(rating); 
      const ratingClass = numRating >= 4 ? 'bg-green-500' : numRating >= 3 ? 'bg-yellow-500' : 'bg-red-500';
      const ratingText = numRating >= 4 ? 'BEST' : numRating >= 3 ? 'FAIR' : 'ALARMING';
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${ratingClass}`}>
          {ratingText}
        </span>
      );
    },
  }),
];

// Helper function to render the Select filter component
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


export default function SalesmanRatings() {
  const router = useRouter();
  const [data, setData] = useState<SalesmanRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState(''); // Salesman Name search
  const [roleFilter, setRoleFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = ITEMS_PER_PAGE;
  
  // --- Filter Options States ---
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  
  const [locationError, setLocationError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);


  // --- Data Fetching Functions ---

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/scores-ratings?type=salesman`);
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('You are not authenticated. Redirecting to login.');
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          toast.error('You do not have permission to access this page. Redirecting.');
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to fetch salesman ratings');
      }
      const rawData = await response.json();
      // Validate the fetched data using the Zod schema
      const validatedData = z.array(salesmanRatingSchema).parse(rawData) as SalesmanRating[];
      setData(validatedData);
      toast.success("Salesman ratings loaded successfully!");
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to load salesman ratings: ${err.message}`);
      console.error('Fetching error:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchLocations = useCallback(async () => {
    setIsLoadingLocations(true);
    setLocationError(null);
    try {
      const response = await fetch(LOCATION_API_ENDPOINT);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data: LocationsResponse = await response.json();
      setAvailableAreas(Array.isArray(data.areas) ? data.areas.filter(Boolean) : []);
      setAvailableRegions(Array.isArray(data.regions) ? data.regions.filter(Boolean) : []);
    } catch (err: any) {
      console.error('Failed to fetch filter locations:', err);
      setLocationError('Failed to load Area/Region filters.');
    } finally {
      setIsLoadingLocations(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    setRoleError(null);
    try {
      const response = await fetch(ROLES_API_ENDPOINT);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data: RolesResponse = await response.json(); 
      setAvailableRoles(data.roles && Array.isArray(data.roles) ? data.roles.filter(Boolean) : []);
    } catch (err: any) {
      console.error('Failed to fetch filter roles:', err);
      setRoleError('Failed to load Role filters.');
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);


  // Initial data loads
  useEffect(() => {
    fetchData();
    fetchLocations();
    fetchRoles();
  }, [fetchData, fetchLocations, fetchRoles]);


  // --- Filtering and Pagination Logic ---
  const filteredRatings = useMemo(() => {
    // Reset page to 1 on filter change
    setCurrentPage(1); 
    const lowerCaseSearch = searchQuery.toLowerCase();

    return data.filter((rating) => {
      // 1. Salesman Name Search
      const searchMatch = !lowerCaseSearch || 
        rating.salesPersonName?.toLowerCase().includes(lowerCaseSearch);

      // 2. Role Filter (assumes 'salesmanRole' field exists in the data)
      const roleMatch = roleFilter === 'all' || 
        rating.salesmanRole?.toLowerCase() === roleFilter.toLowerCase(); 

      // 3. Area Filter 
      const areaMatch = areaFilter === 'all' || 
        rating.area?.toLowerCase() === areaFilter.toLowerCase(); 

      // 4. Region Filter 
      const regionMatch = regionFilter === 'all' || 
        rating.region?.toLowerCase() === regionFilter.toLowerCase();
      
      // Combine all conditions
      return searchMatch && roleMatch && areaMatch && regionMatch;
    });
  }, [data, searchQuery, roleFilter, areaFilter, regionFilter]);


  // Pagination logic applied to filtered data
  const totalPages = Math.ceil(filteredRatings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRatings = filteredRatings.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Salesman Ratings</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            Loading salesman ratings...
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-8">
            <p>Error: {error}</p>
            <Button onClick={fetchData} className="ml-4 mt-2">Retry</Button>
          </div>
        ) : (
          <>
            {/* --- Filter Components --- */}
            <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-secondary border mb-6">
                {/* 1. Salesman Name Search Input */}
                <div className="flex flex-col space-y-1 w-full sm:w-[250px] min-w-[150px]">
                    <label className="text-sm font-medium text-muted-foreground">Salesman Name Search</label>
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

                {/* 2. Role Filter */}
                {renderSelectFilter(
                    'Role', 
                    roleFilter, 
                    (v) => { setRoleFilter(v); }, 
                    availableRoles, 
                    isLoadingRoles
                )}

                {/* 3. Area Filter */}
                {renderSelectFilter(
                    'Area', 
                    areaFilter, 
                    (v) => { setAreaFilter(v); }, 
                    availableAreas, 
                    isLoadingLocations
                )}

                {/* 4. Region Filter */}
                {renderSelectFilter(
                    'Region', 
                    regionFilter, 
                    (v) => { setRegionFilter(v); }, 
                    availableRegions, 
                    isLoadingLocations
                )}
                
                {locationError && <p className="text-xs text-red-500 w-full">Location Filter Error: {locationError}</p>}
                {roleError && <p className="text-xs text-red-500 w-full">Role Filter Error: {roleError}</p>}
            </div>
            {/* --- End Filter Components --- */}

            {filteredRatings.length === 0 ? (
                <div className="text-center text-gray-500 p-8">
                    No salesman ratings found matching the selected filters.
                </div>
            ) : (
                <>
                    <DataTableReusable
                        columns={columns}
                        data={currentRatings} // Use filtered and paginated data
                        enableRowDragging={false}
                        onRowOrderChange={() => {}}
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
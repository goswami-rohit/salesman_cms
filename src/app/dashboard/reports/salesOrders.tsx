// app/dashboard/salesOrders.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import { DataTableReusable } from '@/components/data-table-reusable';
import { salesOrderSchema } from '@/app/api/dashboardPagesAPI/reports/sales-orders/route'

// UI Components for Filtering
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';

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

// SalesOrder type is extended from the schema inference
type SalesOrder = z.infer<typeof salesOrderSchema>;

// Column definitions for the sales order table
const columnHelper = createColumnHelper<SalesOrder>();

const salesOrderColumns: ColumnDef<SalesOrder, any>[] = [
  columnHelper.accessor('salesmanName', {
    header: 'Salesman',
    cell: (info) => info.getValue(),
    meta: { filterType: 'search' },
  }),
  columnHelper.accessor('salesmanRole', {
    header: 'Role',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('dealerName', {
    header: 'Dealer',
    cell: (info) => info.getValue(),
    meta: { filterType: 'search' },
  }),
  columnHelper.accessor('dealerType', {
    header: 'Dealer Type',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('dealerPhone', {
    header: 'Phone',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('dealerAddress', {
    header: 'Address',
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
  columnHelper.accessor('quantity', {
    header: 'Quantity',
    cell: (info) => `${info.getValue()} ${info.row.original.unit}`,
  }),
  columnHelper.accessor('orderTotal', {
    header: 'Order Total (₹)',
    cell: (info) => new Intl.NumberFormat('en-IN').format(info.getValue()),
  }),
  columnHelper.accessor('advancePayment', {
    header: 'Advance (₹)',
    cell: (info) => new Intl.NumberFormat('en-IN').format(info.getValue()),
  }),
  columnHelper.accessor('pendingPayment', {
    header: 'Pending (₹)',
    cell: (info) => new Intl.NumberFormat('en-IN').format(info.getValue()),
  }),
  columnHelper.accessor('estimatedDelivery', {
    header: 'Delivery ETA',
    cell: (info) => info.getValue(),
    meta: { filterType: 'date' },
  }),
  columnHelper.accessor('remarks', {
    header: 'Remarks',
    cell: (info) => info.getValue() || '-',
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created On',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

// Helper function to render the Select filter component (reused from previous implementation)
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


// Component
const SalesOrdersTable = () => {
  const router = useRouter();
  const [data, setData] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState(''); // Salesman or Dealer Name search
  const [roleFilter, setRoleFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
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

  const fetchSalesOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/reports/sales-orders`);
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
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const orders: SalesOrder[] = await response.json();
      // Ensure data structure matches expected SalesOrder type for filtering
      const validatedOrders = z.array(salesOrderSchema).parse(orders);
      setData(validatedOrders);
      toast.success("Sales orders loaded successfully!");
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error((error as Error).message);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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
      
      const safeAreas = Array.isArray(data.areas) ? data.areas.filter(Boolean) : [];
      const safeRegions = Array.isArray(data.regions) ? data.regions.filter(Boolean) : [];
      
      setAvailableAreas(safeAreas);
      setAvailableRegions(safeRegions);
      
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
      
      const safeRoles = roles.filter(Boolean);
      
      setAvailableRoles(safeRoles);
    } catch (err: any) {
      console.error('Failed to fetch filter roles:', err);
      setRoleError('Failed to load Role filters.');
      toast.error('Failed to load role filters.');
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  // Initial data loads
  useEffect(() => {
    fetchSalesOrders();
    fetchLocations();
    fetchRoles();
  }, [fetchSalesOrders, fetchLocations, fetchRoles]);


  // --- Filtering and Pagination Logic ---
  const filteredOrders = useMemo(() => {
    // Note: We deliberately reset the page here, but the state update
    // should happen outside of useMemo if possible. However, setting the page 
    // to 1 here ensures correct pagination when filters change.
    setCurrentPage(1); 
    
    const lowerCaseSearch = searchQuery.toLowerCase();

    return data.filter((order) => {
      // 1. Search Filter (Salesman Name OR Dealer Name)
      const salesmanMatch = order.salesmanName?.toLowerCase().includes(lowerCaseSearch);
      const dealerMatch = order.dealerName?.toLowerCase().includes(lowerCaseSearch);
      const searchMatch = !lowerCaseSearch || salesmanMatch || dealerMatch;

      // 2. Role Filter 
      const roleMatch = roleFilter === 'all' || 
        order.salesmanRole?.toLowerCase() === roleFilter.toLowerCase(); 

      // 3. Area Filter 
      const areaMatch = areaFilter === 'all' || 
        order.area?.toLowerCase() === areaFilter.toLowerCase(); 

      // 4. Region Filter 
      const regionMatch = regionFilter === 'all' || 
        order.region?.toLowerCase() === regionFilter.toLowerCase();
      
      // Combine all conditions
      return searchMatch && roleMatch && areaMatch && regionMatch;
    });
  }, [data, searchQuery, roleFilter, areaFilter, regionFilter]);


  // Pagination logic applied to filtered data
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <p className="text-gray-500">Loading sales orders...</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="text-center text-red-500 py-8">
            Error loading sales orders: {error}
            <Button onClick={fetchSalesOrders} className="ml-4">Retry</Button>
        </div>
    );
  }

  return (
    <>
      {/* --- Filter Components --- */}
      <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-card border mb-6">
        {/* 1. Username/Dealer Search Input */}
        <div className="flex flex-col space-y-1 w-full sm:w-[250px] min-w-[150px]">
          <label className="text-sm font-medium text-muted-foreground">Salesman/Dealer Search</label>
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
        
        {/* Display filter option errors if any */}
        {locationError && <p className="text-xs text-red-500 w-full">Location Filter Error: {locationError}</p>}
        {roleError && <p className="text-xs text-red-500 w-full">Role Filter Error: {roleError}</p>}
      </div>
      {/* --- End Filter Components --- */}

      {/* Data Table */}
      {filteredOrders.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No sales orders found matching the selected filters.
          </div>
      ) : (
        <>
          <DataTableReusable
            columns={salesOrderColumns}
            data={currentOrders} // Use filtered and paginated data
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
  );
};

export default SalesOrdersTable;
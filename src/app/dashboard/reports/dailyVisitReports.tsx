// app/dashboard/reports/dailyVisitReports.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';

// UI Components
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
import { DataTableReusable } from '@/components/data-table-reusable';
import { dailyVisitReportSchema } from '@/lib/shared-zod-schema';
import { Search, Loader2 } from 'lucide-react';

type DailyVisitReport = z.infer<typeof dailyVisitReportSchema> & {
  // Manually adding fields expected by the filter logic and table columns, 
  // assuming they are present in the actual API data.
  role: string;
  area: string;
  region: string;
};
const columnHelper = createColumnHelper<DailyVisitReport>();
const ITEMS_PER_PAGE = 10;

// API Endpoints for filter options
const LOCATION_API_ENDPOINT = `${process.env.NEXT_PUBLIC_APP_URL}/api/users/user-locations`;
const ROLES_API_ENDPOINT = `${process.env.NEXT_PUBLIC_APP_URL}/api/users/user-roles`;

// Type definitions for API responses
interface LocationsResponse {
  areas: string[];
  regions: string[];
}
interface RolesResponse {
  // FIX: Expecting roles under the 'roles' key
  roles: string[];
}

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


export default function DailyVisitReportsPage() {
  const [reports, setReports] = useState<DailyVisitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  // --- Individual Filter States ---
  const [searchQuery, setSearchQuery] = useState(''); // Salesman/Username
  const [roleFilter, setRoleFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  // --- Filter Options States ---
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);

  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const [locationError, setLocationError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  /**
   * Fetches the main daily visit report data.
   */
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/reports/daily-visit-reports`);
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DailyVisitReport[] = await response.json();
      const validated = data.map((item) => {
        try {
          // Assuming DailyVisitReport now includes salesmanRole, area, and region for filtering
          return dailyVisitReportSchema.parse(item) as DailyVisitReport;
        } catch (e) {
          console.error('Validation error on report item:', e);
          return null;
        }
      }).filter(Boolean) as DailyVisitReport[];

      setReports(validated);
      toast.success('Daily Visit Reports loaded successfully!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to load daily visit reports.');
      setError(e.message);
    } finally {
      setLoading(false);
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
      // FIX: Now expecting roles under the 'roles' key
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
    fetchReports();
    fetchLocations();
    fetchRoles();
  }, [fetchReports, fetchLocations, fetchRoles]);


  // Memoized function for comprehensive filtering
  const filteredReports = useMemo(() => {
    // Reset page on filter change
    setCurrentPage(1);

    const q = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      // 1) Search across salesman + dealer names
      const nameHaystack = [
        report.salesmanName,
        report.dealerName ?? '',
        report.subDealerName ?? ''
      ]
        .join(' ')
        .toLowerCase();

      const usernameMatch = !q || nameHaystack.includes(q);

      // 2. Role Filter (Uses the 'role' field)
      const roleMatch = roleFilter === 'all' ||
        report.role?.toLowerCase() === roleFilter.toLowerCase();

      // 3. Area Filter (Uses the 'area' field)
      const areaMatch = areaFilter === 'all' ||
        report.area?.toLowerCase() === areaFilter.toLowerCase();

      // 4. Region Filter (Uses the 'region' field)
      const regionMatch = regionFilter === 'all' ||
        report.region?.toLowerCase() === regionFilter.toLowerCase();

      // Combine all conditions
      return usernameMatch && roleMatch && areaMatch && regionMatch;
    });
  }, [reports, searchQuery, roleFilter, areaFilter, regionFilter]);


  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const currentReports = filteredReports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Define columns (Including the fixed Role, Area, Region accessors)
  const dailyVisitReportColumns: ColumnDef<DailyVisitReport, any>[] = [
    columnHelper.accessor('salesmanName', { header: 'Salesman' }),
    columnHelper.accessor('role', { header: 'Role' }), // Uses 'role' accessor
    columnHelper.accessor('area', { header: 'Area' }),
    columnHelper.accessor('region', { header: 'Region' }),
    columnHelper.accessor('reportDate', { header: 'Date' }),
    columnHelper.accessor('dealerType', { header: 'Dealer Type' }),
    columnHelper.accessor('dealerName', { header: 'Dealer Name', cell: info => info.getValue() || 'N/A' }),
    columnHelper.accessor('subDealerName', { header: 'Sub Dealer Name', cell: info => info.getValue() || 'N/A' }),
    columnHelper.accessor('location', { header: 'Location' }),
    columnHelper.accessor('visitType', { header: 'Visit Type' }),
    columnHelper.accessor('todayOrderMt', { header: 'Order (MT)', cell: info => info.getValue().toFixed(2) }),
    columnHelper.accessor('todayCollectionRupees', { header: 'Collection (₹)', cell: info => info.getValue().toFixed(2) }),
    columnHelper.accessor('overdueAmount', {
      header: 'Overdue (₹)',
      cell: info => info.getValue() ? info.getValue().toFixed(2) : '0.00'
    }),
    columnHelper.accessor('feedbacks', {
      header: 'Feedbacks',
      cell: info => <span className="max-w-[250px] truncate block">{info.getValue()}</span>
    })
  ];

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading daily visit reports...</div>;

  if (error) return (
    <div className="text-center text-red-500 min-h-screen pt-10">
      Error: {error}
      <Button onClick={fetchReports} className="ml-4">Retry</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Daily Visit Reports</h2>
        </div>

        {/* --- Individual Filter Components --- */}
        <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-card border">
          {/* 1. Username/Salesman Search Input */}
          <div className="flex flex-col space-y-1 w-full sm:w-[250px] min-w-[150px]">
            <label className="text-sm font-medium text-muted-foreground">Salesman / Username</label>
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

          {/* 2. Role Filter (Now displays dynamically fetched roles from the 'roles' key) */}
          {renderSelectFilter(
            'Role',
            roleFilter,
            (v) => { setRoleFilter(v); },
            availableRoles,
            isLoadingRoles
          )}

          {/* 3. Area Filter */}
          {/* {renderSelectFilter(
            'Area', 
            areaFilter, 
            (v) => { setAreaFilter(v); }, 
            availableAreas, 
            isLoadingLocations
          )} */}

          {/* 4. Region Filter */}
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
        {/* --- End Individual Filter Components --- */}

        <div className="bg-card p-6 rounded-lg border border-border">
          {filteredReports.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No daily visit reports found matching the selected filters.</div>
          ) : (
            <>
              <DataTableReusable
                columns={dailyVisitReportColumns} 
                data={currentReports}
                enableRowDragging={false}
                onRowOrderChange={() => { }}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
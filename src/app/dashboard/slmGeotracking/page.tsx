// src/app/dashboard/slmGeotracking/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Loader2 } from 'lucide-react';
import { IconCalendar } from '@tabler/icons-react';

// Utilities
import { DataTableReusable } from '@/components/data-table-reusable';
import { geoTrackingSchema } from '@/app/api/dashboardPagesAPI/slm-geotracking/route';
import { format, addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from '@/lib/utils';

// --- CONSTANTS AND TYPES ---
type GeoTrack = z.infer<typeof geoTrackingSchema> & {
  salesmanRole?: string;
  role?: string;
  area?: string;
  region?: string;
};
type DisplayGeoTrack = GeoTrack & { displayDate: string; displayCheckInTime: string; displayCheckOutTime: string };

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

export default function SalesmanGeoTrackingPage() {
  const [tracks, setTracks] = useState<DisplayGeoTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  // --- Filter Options Fetching ---
  const fetchLocations = useCallback(async () => {
    setIsLoadingLocations(true);
    setLocationError(null);
    try {
      const response = await fetch(LOCATION_API_ENDPOINT);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data: LocationsResponse = await response.json();

      const safeAreas = Array.isArray(data.areas) ? data.areas.filter(Boolean) : [];
      const safeRegions = Array.isArray(data.regions) ? data.regions.filter(Boolean) : [];

      setAvailableAreas(safeAreas);
      setAvailableRegions(safeRegions);

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

  // --- Main Data Fetching ---
  const apiURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/slm-geotracking`;
  const fetchTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(apiURI);
      if (dateRange?.from) {
        url.searchParams.append('startDate', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        url.searchParams.append('endDate', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('You are not authenticated.');
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const rawData = await res.json();

      const validatedData = rawData
        .map((item: unknown) => {
          try {
            return geoTrackingSchema.parse(item) as GeoTrack;
          } catch (e) {
            console.error('Data validation failed for item:', item, 'ZodError', e);
            return null;
          }
        })
        .filter((item: GeoTrack | null): item is GeoTrack => item !== null)
        .map((item: GeoTrack) => ({
          ...item,
          displayDate: formatDate(item.recordedAt),
          displayCheckInTime: formatTime(item.checkInTime),
          displayCheckOutTime: formatTime(item.checkOutTime),
        }));

      setTracks(validatedData);
      toast.success('Geo-tracking reports loaded successfully.');
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`Failed to fetch geo-tracking reports: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  useEffect(() => {
    fetchLocations();
    fetchRoles();
  }, [fetchLocations, fetchRoles]);

  // --- Filtering and Pagination Logic ---
  const filteredAndPaginatedData = useMemo(() => {
    const lowerCaseSearch = (searchQuery || '').toLowerCase();

    const filteredTracks = tracks.filter(track => {
      const salesmanName = (track.salesmanName || '').toString();
      const journeyId = (track.journeyId || '').toString();
      const siteName = (track.siteName || '').toString();
      const displayDate = (track.displayDate || '').toString();
      const checkIn = (track.displayCheckInTime || '').toString();
      const checkOut = (track.displayCheckOutTime || '').toString();
      const locationType = (track.locationType || '').toString();

      // 1. Search Filter (Salesman Name, Journey ID, Site Name, Date, CheckIn/Out, Location Type)
      const matchesSearch =
        !lowerCaseSearch ||
        salesmanName.toLowerCase().includes(lowerCaseSearch) ||
        journeyId.toLowerCase().includes(lowerCaseSearch) ||
        siteName.toLowerCase().includes(lowerCaseSearch) ||
        displayDate.toLowerCase().includes(lowerCaseSearch) ||
        checkIn.toLowerCase().includes(lowerCaseSearch) ||
        checkOut.toLowerCase().includes(lowerCaseSearch) ||
        locationType.toLowerCase().includes(lowerCaseSearch);

      // 2. Role Filter (support both 'salesmanRole' and 'role')
      const reportRole = (track.salesmanRole || track.role || '').toString();
      const roleMatch = roleFilter === 'all' || reportRole.toLowerCase() === roleFilter.toLowerCase();

      // 3. Area Filter
      const reportArea = (track.area || '').toString();
      const areaMatch = areaFilter === 'all' || reportArea.toLowerCase() === areaFilter.toLowerCase();

      // 4. Region Filter
      const reportRegion = (track.region || '').toString();
      const regionMatch = regionFilter === 'all' || reportRegion.toLowerCase() === regionFilter.toLowerCase();

      return matchesSearch && roleMatch && areaMatch && regionMatch;
    });

    const totalPages = Math.max(1, Math.ceil(filteredTracks.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentTracks = filteredTracks.slice(startIndex, endIndex);

    return { filteredTracks, totalPages, currentTracks };
  }, [tracks, searchQuery, roleFilter, areaFilter, regionFilter, currentPage]);

  const { filteredTracks: allFilteredTracks, totalPages, currentTracks } = filteredAndPaginatedData;

  // Reset page to 1 when filters/search/dateRange change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, areaFilter, regionFilter, dateRange]);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const columns: ColumnDef<DisplayGeoTrack>[] = [
    {
      accessorKey: 'salesmanName',
      header: 'Salesman',
      cell: ({ row }) => row.original.salesmanName ?? 'N/A',
    },
    {
      accessorKey: 'displayDate',
      header: 'Date',
    },
    {
      accessorKey: 'siteName',
      header: 'Site Name',
      cell: ({ row }) => row.original.siteName ?? 'N/A',
    },
    {
      accessorKey: 'checkInTime',
      header: 'Check-in Time',
      cell: ({ row }) => row.original.displayCheckInTime,
    },
    {
      accessorKey: 'checkOutTime',
      header: 'Check-out Time',
      cell: ({ row }) => row.original.displayCheckOutTime,
    },
    {
      accessorKey: 'totalDistanceTravelled',
      header: 'Distance (km)',
      cell: ({ row }) => (row.original.totalDistanceTravelled ? `${row.original.totalDistanceTravelled.toFixed(2)} km` : 'N/A'),
    },
    {
      accessorKey: 'locationType',
      header: 'Location Type',
      cell: ({ row }) => row.original.locationType ?? 'N/A',
    },
    {
      accessorKey: 'appState',
      header: 'App State',
      cell: ({ row }) => row.original.appState ?? 'N/A'
    },
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ row }) => (row.original.isActive ? 'Yes' : 'No'),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Salesman Geo-Tracking</h2>
        </div>

        {/* Main Content Card */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-lg">

          {/* --- Filters Section --- */}
          <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-secondary border mb-6">
            {/* 1. Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[300px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <IconCalendar className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Filter by Date Range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from || addDays(new Date(), -7)}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {dateRange && (
              <Button variant="ghost" onClick={() => setDateRange(undefined)} className='min-w-[100px]'>
                Clear Date
              </Button>
            )}

            {/* 2. Search Input */}
            <div className="flex flex-col space-y-1 w-full sm:w-[250px] min-w-[150px]">
              <label className="text-sm font-medium text-muted-foreground">Search All Fields</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Salesman, Journey ID, Site..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>

            {/* 3. Role Filter */}
            {renderSelectFilter(
              'Role',
              roleFilter,
              setRoleFilter,
              availableRoles,
              isLoadingRoles
            )}

            {/* 4. Area Filter */}
            {renderSelectFilter(
              'Area',
              areaFilter,
              setAreaFilter,
              availableAreas,
              isLoadingLocations
            )}

            {/* 5. Region Filter */}
            {renderSelectFilter(
              'Region',
              regionFilter,
              setRegionFilter,
              availableRegions,
              isLoadingLocations
            )}

            {locationError && <p className="text-xs text-red-500 w-full mt-2">Location Filter Error: {locationError}</p>}
            {roleError && <p className="text-xs text-red-500 w-full">Role Filter Error: {roleError}</p>}
          </div>
          {/* --- End Filters Section --- */}

          {/* Data Display / Loading / Error */}
          <div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                <p>Loading geo-tracking reports...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">
                Error: {error}
                <Button onClick={fetchTracks} className="ml-4">Retry</Button>
              </div>
            ) : allFilteredTracks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No geo-tracking reports found matching the selected filters.</div>
            ) : (
              <>
                <DataTableReusable
                  columns={columns}
                  data={currentTracks}
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
    </div>
  );
}

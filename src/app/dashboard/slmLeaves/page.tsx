// src/app/dashboard/slmLeaves/page.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { UniqueIdentifier } from '@dnd-kit/core';
import { format, addDays } from "date-fns";
import { DateRange } from "react-day-picker";

// Import your Shadcn UI components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // For status badges
import { Input } from '@/components/ui/input'; // For search input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination"; // For pagination
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Loader2 } from 'lucide-react';
import { IconCalendar } from '@tabler/icons-react';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';
import { salesmanLeaveApplicationSchema } from '@/app/api/dashboardPagesAPI/slm-leaves/route';
import { cn } from '@/lib/utils';

// IMPORTANT: do NOT augment the z.infer type with role/area/region — those fields are NOT part of the leave schema.
// We'll still fetch available roles/areas/regions from the endpoints and compare at runtime (safely).
type SalesmanLeaveApplication = z.infer<typeof salesmanLeaveApplicationSchema>;

const ITEMS_PER_PAGE = 10; // Define items per page for pagination

// --- API Endpoints and Types for Filters ---
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


export default function SlmLeavesPage() {
  const router = useRouter();
  const [leaveApplications, setLeaveApplications] = React.useState<SalesmanLeaveApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [areaFilter, setAreaFilter] = React.useState('all');
  const [regionFilter, setRegionFilter] = React.useState('all');

  // --- Filter Options States ---
  const [availableRoles, setAvailableRoles] = React.useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = React.useState<string[]>([]);
  const [availableRegions, setAvailableRegions] = React.useState<string[]>([]);

  const [isLoadingLocations, setIsLoadingLocations] = React.useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = React.useState(true);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [roleError, setRoleError] = React.useState<string | null>(null);


  // --- Filter Options Fetching ---
  const fetchLocations = React.useCallback(async () => {
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

  const fetchRoles = React.useCallback(async () => {
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


  // --- Data Fetching Logic ---
  const apiURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/slm-leaves`
  const fetchLeaveApplications = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(apiURI);
      // Append date range to API call
      if (dateRange?.from) {
        url.searchParams.append('startDate', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        url.searchParams.append('endDate', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const response = await fetch(url.toString());

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
      const data: SalesmanLeaveApplication[] = await response.json();
      const validatedData = data.map((item) => {
        try {
          return salesmanLeaveApplicationSchema.parse(item) as SalesmanLeaveApplication;
        } catch (e) {
          console.error("Validation error for item:", item, e);
          return null;
        }
      }).filter(Boolean) as SalesmanLeaveApplication[];

      setLeaveApplications(validatedData);
      toast.success("Salesman leave applications loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch salesman leave applications:", e);
      setError(e.message || "Failed to fetch leave applications.");
      toast.error(e.message || "Failed to load salesman leave applications.");
    } finally {
      setLoading(false);
    }
  }, [dateRange, router]);

  React.useEffect(() => {
    fetchLeaveApplications();
  }, [fetchLeaveApplications]);

  React.useEffect(() => {
    fetchLocations();
    fetchRoles();
  }, [fetchLocations, fetchRoles]);

  // --- Handle Leave Approval/Rejection ---
  const handleLeaveAction = async (id: UniqueIdentifier, newStatus: "Approved" | "Rejected", remarks: string | null = null) => {
    try {
      setLoading(true);
      const response = await fetch(apiURI, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus, adminRemarks: remarks }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const updatedApplication: SalesmanLeaveApplication = await response.json();

      setLeaveApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === id
            ? { ...app, status: updatedApplication.status, adminRemarks: updatedApplication.adminRemarks }
            : app
        )
      );
      toast.success(`Leave for ${updatedApplication.salesmanName} ${newStatus.toLowerCase()}!`);
    } catch (e: any) {
      console.error("Failed to update leave application:", e);
      toast.error(e.message || "Failed to update leave application.");
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering and Pagination Logic ---
  const filteredAndPaginatedData = React.useMemo(() => {
    const lowerCaseSearch = (searchQuery || '').toLowerCase();

    const filteredApplications = leaveApplications.filter((app) => {
      // 1. Search Filter (Salesman, Leave Type, Reason, Status, Admin Remarks, Start/End dates)
      const matchesSearch =
        !lowerCaseSearch ||
        (app.salesmanName || '').toLowerCase().includes(lowerCaseSearch) ||
        (app.leaveType || '').toLowerCase().includes(lowerCaseSearch) ||
        (app.reason || '').toLowerCase().includes(lowerCaseSearch) ||
        (app.status || '').toLowerCase().includes(lowerCaseSearch) ||
        (app.adminRemarks || '').toLowerCase().includes(lowerCaseSearch) ||
        (app.startDate || '').toLowerCase().includes(lowerCaseSearch) ||
        (app.endDate || '').toLowerCase().includes(lowerCaseSearch);

      // 2. Role Filter: backend might not provide role on leave object.
      // Use safe runtime checks via (app as any).salesmanRole or (app as any).role
      const reportRole = ((app as any).salesmanRole || (app as any).role || '').toString();
      const roleMatch = roleFilter === 'all' || reportRole.toLowerCase() === roleFilter.toLowerCase();

      // 3. Area Filter: backend might not have area on leave object
      const reportArea = ((app as any).area || '').toString();
      const areaMatch = areaFilter === 'all' || reportArea.toLowerCase() === areaFilter.toLowerCase();

      // 4. Region Filter
      const reportRegion = ((app as any).region || '').toString();
      const regionMatch = regionFilter === 'all' || reportRegion.toLowerCase() === regionFilter.toLowerCase();

      return matchesSearch && roleMatch && areaMatch && regionMatch;
    });

    const totalPages = Math.max(1, Math.ceil(filteredApplications.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedApplications = filteredApplications.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

    return { filteredApplications, totalPages, paginatedApplications };
  }, [leaveApplications, searchQuery, roleFilter, areaFilter, regionFilter, currentPage]);

  const { filteredApplications: allFilteredApplications, totalPages, paginatedApplications } = filteredAndPaginatedData;

  // Reset page to 1 when filters/search/dateRange change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    roleFilter,
    areaFilter,
    regionFilter,
    // stringify dateRange so the dep is a primitive and stable in shape
    dateRange ? `${dateRange.from?.toISOString() ?? ''}|${dateRange.to?.toISOString() ?? ''}` : ''
  ]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // --- Define Columns for Salesman Leave Applications DataTable ---
  const salesmanLeaveColumns: ColumnDef<SalesmanLeaveApplication>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "leaveType", header: "Leave Type" },
    { accessorKey: "startDate", header: "Start Date" },
    { accessorKey: "endDate", header: "End Date" },
    {
      accessorKey: "reason", header: "Reason",
      cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.original.reason}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let className = "";
        switch (status) {
          case "Approved":
            className = "bg-green-600 hover:bg-green-700 text-white";
            break;
          case "Rejected":
            className = "bg-red-600 hover:bg-red-700 text-white";
            break;
          case "Pending":
            className = "bg-yellow-500 hover:bg-yellow-600 text-black";
            break;
          default:
            className = "bg-gray-500 hover:bg-gray-600 text-white";
        }
        return (
          <Badge className={className}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const app = row.original;
        const isPending = app.status === 'Pending';

        if (!isPending) {
          return <span className="text-sm text-muted-foreground">{app.adminRemarks ? `Remark: ${app.adminRemarks}` : '—'}</span>;
        }

        const onAccept = async () => {
          await handleLeaveAction(app.id, 'Approved');
        };

        const onReject = async () => {
          const remark = window.prompt(`Reason for rejecting ${app.salesmanName}'s leave (optional):`, '');
          await handleLeaveAction(app.id, 'Rejected', remark === null ? null : remark);
        };

        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={onAccept} className="bg-green-600 hover:bg-green-700 text-white">
              Accept
            </Button>
            <Button size="sm" variant="outline" onClick={onReject} className="border-red-500 text-red-600 hover:bg-red-50">
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  const handleSalesmanLeaveOrderChange = (newOrder: SalesmanLeaveApplication[]) => {
    console.log("New salesman leave report order:", newOrder.map(r => (r as any).id));
  };

  // --- Loading and Error States ---
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <p>Loading salesman leave applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 min-h-screen pt-10">
        Error: {error}
        <Button onClick={fetchLeaveApplications} className="ml-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Salesman Leave Applications</h2>
        </div>

        {/* --- Filters Section --- */}
        <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-secondary border">
          {/* 1. Date Range Picker (Leave Date) */}
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
                  <span>Filter by Leave Date Range</span>
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
                placeholder="Salesman, Reason, Status..."
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


        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          {allFilteredApplications.length === 0 && !loading && !error ? (
            <div className="text-center text-gray-500 py-8">No salesman leave applications found matching the selected filters.</div>
          ) : (
            <>
              <DataTableReusable
                columns={salesmanLeaveColumns}
                data={paginatedApplications}
                enableRowDragging={false}
                onRowOrderChange={handleSalesmanLeaveOrderChange}
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

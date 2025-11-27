// src/app/dashboard/technicalVisitReports.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';
import { technicalVisitReportSchema } from '@/lib/shared-zod-schema';

// UI Components for Filtering/Pagination
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
//import { BASE_URL } from '@/lib/Reusable-constants';

// --- CONSTANTS AND TYPES ---
const LOCATION_API_ENDPOINT = `/api/users/user-locations`; 
const ROLES_API_ENDPOINT = `/api/users/user-roles`; 

interface LocationsResponse {
  areas: string[];
  regions: string[];
}
interface RolesResponse {
    roles: string[]; 
}

// Extend the inferred type to explicitly include the salesman's info needed for filtering.
type TechnicalVisitReport = z.infer<typeof technicalVisitReportSchema> & {
    salesmanName: string; 
    role: string;         // Required for Role filter
    area: string;         // Required for Area filter
    region: string;       // Required for Region filter
};

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


export default function TechnicalVisitReportsPage() {
  const router = useRouter();
  const [technicalReports, setTechnicalReports] = React.useState<TechnicalVisitReport[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState(''); // Salesman/Username
  const [roleFilter, setRoleFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  // REMOVED: const [currentPage, setCurrentPage] = useState(1);

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
   * Fetches the main technical visit report data.
   */
  const fetchTechnicalReports = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch from the API path
      const response = await fetch(`/api/dashboardPagesAPI/reports/technical-visit-reports`);
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
      const rawData: TechnicalVisitReport[] = await response.json();
      
      // Validate and ensure the required 'id' property exists for DataTableReusable
      const validatedData = rawData.map((item) => {
        try {
          const validated = technicalVisitReportSchema.parse(item);
          // Assuming a composite ID if 'id' isn't guaranteed by schema
          return { 
            ...validated, 
            id: (validated as any).id?.toString() || `${validated.salesmanName}-${validated.date}-${Math.random()}` 
          } as TechnicalVisitReport;
        } catch (e) {
          console.error("Validation error for item:", item, e);
          toast.error("Invalid report data received from server.");
          return null;
        }
      }).filter(Boolean) as TechnicalVisitReport[];

      setTechnicalReports(validatedData);
      toast.success("Technical visit reports loaded successfully!");
    } catch (error: any) {
      console.error("Failed to fetch technical visit reports:", error);
      toast.error(`Failed to fetch technical visit reports: ${error.message}`);
      setError(error.message);
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

  // Initial data loads for reports and filter options
  React.useEffect(() => {
    fetchTechnicalReports();
    fetchLocations();
    fetchRoles();
  }, [fetchTechnicalReports, fetchLocations, fetchRoles]);


  // --- Filtering Logic 
  const filteredReports = useMemo(() => {
    const q = searchQuery.toLowerCase();
    
    return technicalReports.filter((report) => {
      // 1. Salesman Name Search (fuzzy match)
      const usernameMatch = !searchQuery ||
        report.salesmanName.toLowerCase().includes(q);

      // 2. Role Filter 
      const roleMatch = roleFilter === 'all' || 
        report.role?.toLowerCase() === roleFilter.toLowerCase(); 

      // 3. Area Filter 
      const areaMatch = areaFilter === 'all' || 
        report.area?.toLowerCase() === areaFilter.toLowerCase(); 

      // 4. Region Filter 
      const regionMatch = regionFilter === 'all' || 
        report.region?.toLowerCase() === regionFilter.toLowerCase();
      
      // Combine all conditions
      return usernameMatch && roleMatch && areaMatch && regionMatch;
    });
  }, [technicalReports, searchQuery, roleFilter, areaFilter, regionFilter]);
  

  // --- 3. Define Columns for Technical Visit Report DataTable (UNCHANGED) ---
  const technicalVisitReportColumns: ColumnDef<TechnicalVisitReport>[] = [
  // --- Identity & Salesman ---
  { accessorKey: "salesmanName", header: "Salesman" },
  { accessorKey: "role", header: "Role" },
  
  // --- Date & Time ---
  { 
    accessorKey: "date", // Matches API response key 'date'
    header: "Visit Date" 
  },
  { 
    accessorKey: "checkInTime", 
    header: "Check-in",
    cell: ({ row }) => {
      const val = row.getValue("checkInTime") as string;
      if (!val) return "-";
      return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  },
  { 
    accessorKey: "checkOutTime", 
    header: "Check-out",
    cell: ({ row }) => {
      const val = row.getValue("checkOutTime") as string;
      if (!val) return "-";
      return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  },
  { accessorKey: "timeSpentinLoc", header: "Duration" },

  // --- Location & Contact ---
  { accessorKey: "region", header: "Zone/Region" },
  { accessorKey: "area", header: "Area" },
  { accessorKey: "marketName", header: "Market/Depo" },
  { accessorKey: "siteNameConcernedPerson", header: "Site/Person" },
  { accessorKey: "phoneNo", header: "Phone No" },
  { accessorKey: "whatsappNo", header: "WhatsApp" },
  { accessorKey: "siteAddress", header: "Site Address", cell: ({ row }) => <span className="max-w-[200px] truncate block" title={row.getValue("siteAddress")}>{row.getValue("siteAddress")}</span> },

  // --- Visit Specifics ---
  { accessorKey: "visitType", header: "Visit Type" },
  { accessorKey: "visitCategory", header: "Visit Category" }, // New/Followup
  { accessorKey: "customerType", header: "Customer Type" }, // IHB/Contractor
  { 
    accessorKey: "purposeOfVisit", 
    header: "Purpose",
    cell: ({ row }) => <span className="max-w-[200px] truncate block" title={row.getValue("purposeOfVisit")}>{row.getValue("purposeOfVisit")}</span>
  },

  // --- Construction Details ---
  { accessorKey: "siteVisitStage", header: "Stage" },
  { accessorKey: "constAreaSqFt", header: "Area (SqFt)" },
  { 
    accessorKey: "siteVisitBrandInUse", 
    header: "Brand in Use",
    cell: ({ row }) => {
      const val = row.getValue("siteVisitBrandInUse");
      return <span className="max-w-[150px] truncate block">{Array.isArray(val) ? val.join(', ') : String(val)}</span>;
    },
  },
  { accessorKey: "currentBrandPrice", header: "Brand Price" },
  { accessorKey: "siteStock", header: "Site Stock" },
  { accessorKey: "estRequirement", header: "Est. Req." },

  // --- Dealers ---
  { accessorKey: "supplyingDealerName", header: "Supplying Dealer" },
  { accessorKey: "nearbyDealerName", header: "Nearby Dealer" },

  // --- Conversion ---
  { 
    accessorKey: "isConverted", 
    header: "Converted?",
    cell: ({ row }) => row.getValue("isConverted") ? "Yes" : "No"
  },
  { accessorKey: "conversionType", header: "Conv. Type" },
  { accessorKey: "conversionFromBrand", header: "Conv. From" },
  { accessorKey: "conversionQuantityValue", header: "Conv. Qty" },
  { accessorKey: "conversionQuantityUnit", header: "Unit" },

  // --- Technical Services ---
  { 
    accessorKey: "isTechService", 
    header: "Tech Service?",
    cell: ({ row }) => row.getValue("isTechService") ? "Yes" : "No"
  },
  { accessorKey: "serviceType", header: "Service Type" },
  { accessorKey: "serviceDesc", header: "Service Desc" },
  { accessorKey: "dhalaiVerificationCode", header: "Dhalai Code" },
  { accessorKey: "isVerificationStatus", header: "Verif. Status" },
  { accessorKey: "qualityComplaint", header: "Complaint" },

  // --- Influencer / Mason ---
  { accessorKey: "influencerName", header: "Influencer Name" },
  { accessorKey: "influencerPhone", header: "Influencer Phone" },
  { 
    accessorKey: "influencerType", 
    header: "Influencer Type",
    cell: ({ row }) => {
      const val = row.getValue("influencerType");
      return <span className="max-w-[150px] truncate block">{Array.isArray(val) ? val.join(', ') : String(val)}</span>;
    },
  },
  { 
    accessorKey: "isSchemeEnrolled", 
    header: "Scheme?",
    cell: ({ row }) => row.getValue("isSchemeEnrolled") ? "Yes" : "No"
  },
  { accessorKey: "influencerProductivity", header: "Productivity" },

  // --- Remarks ---
  {
    accessorKey: "clientsRemarks", 
    header: "Client Remarks",
    cell: ({ row }) => <span className="max-w-[200px] truncate block" title={row.getValue("clientsRemarks")}>{row.getValue("clientsRemarks")}</span>,
  },
  {
    accessorKey: "salespersonRemarks", 
    header: "Salesman Remarks",
    cell: ({ row }) => <span className="max-w-[200px] truncate block" title={row.getValue("salespersonRemarks")}>{row.getValue("salespersonRemarks")}</span>,
  },

  // --- Legacy/Other ---
  { accessorKey: "associatedPartyName", header: "Associated Party" },
  { accessorKey: "promotionalActivity", header: "Promo Activity" },
  { accessorKey: "channelPartnerVisit", header: "Partner Visit" },
];

  const handleTechnicalVisitReportOrderChange = (newOrder: TechnicalVisitReport[]) => {
    console.log("New technical visit report order:", newOrder.map(r => r.id));
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-screen">Loading technical visit reports...</div>;

  if (error) return (
    <div className="text-center text-red-500 min-h-screen pt-10">
      Error: {error}
      <Button onClick={fetchTechnicalReports} className="ml-4">Retry</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Technical Visit Reports</h2>
        </div>

        {/* --- Filter Components --- */}
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

          {/* 2. Role Filter */}
          {renderSelectFilter(
            'Role', 
            roleFilter, 
            (v) => { setRoleFilter(v); }, 
            availableRoles, 
            isLoadingRoles
          )}

          {/* 3. Area Filter (Commented out in original but kept for display) */}
          {renderSelectFilter(
            'Area', 
            areaFilter, 
            (v) => { setAreaFilter(v); }, 
            availableAreas, 
            isLoadingLocations
          )}

          {/* 4. Region Filter (Commented out in original but kept for display) */}
          {renderSelectFilter(
            'Region(Zone)', 
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

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          {filteredReports.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No technical visit reports found matching the selected filters.</div>
          ) : (
            <>
              <DataTableReusable
                columns={technicalVisitReportColumns}
                data={filteredReports} // PASS THE FULL FILTERED DATA
                //filterColumnAccessorKey="siteNameConcernedPerson" 
                enableRowDragging={false} 
                onRowOrderChange={handleTechnicalVisitReportOrderChange}
              />
              
              {/* REMOVED: Custom Pagination Component */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
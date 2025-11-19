// src/app/dashboard/masonpcSide/bagsLift.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { IndianRupee, Search, Loader2, Check, X, Eye, ExternalLink } from 'lucide-react';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';
import { bagLiftSchema } from '@/lib/shared-zod-schema';

// UI Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// --- CONSTANTS AND TYPES ---
const BAG_LIFT_API_ENDPOINT = `/api/dashboardPagesAPI/masonpc-side/bags-lift`;
const BAG_LIFT_ACTION_API_BASE = `/api/dashboardPagesAPI/masonpc-side/bags-lift`;
const LOCATION_API_ENDPOINT = `/api/users/user-locations`;
const ROLES_API_ENDPOINT = `/api/users/user-roles`;

interface LocationsResponse {
  areas: string[];
  regions: string[];
}
interface RolesResponse {
  roles: string[];
}

// Type for data coming from the API
type BagLiftRecord = z.infer<typeof bagLiftSchema> & {
  masonName: string;
  dealerName: string | null;
  approverName: string | null;
  role: string;
  area: string;
  region: string;
};


// --- HELPER FUNCTIONS ---

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

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'verified':
      return 'bg-green-100 text-green-700 hover:bg-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-700 hover:bg-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  }
};


// --- MAIN COMPONENT ---

export default function BagsLiftPage() {
  const [bagLiftRecords, setBagLiftRecords] = React.useState<BagLiftRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  // REMOVED: currentPage state (let the table handle it)

  const statusOptions = ['pending', 'approved', 'rejected'];

  // --- Filter Options States ---
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);

  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const [locationError, setLocationError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BagLiftRecord | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);


  // --- Data Fetching Functions ---
  const fetchBagLiftRecords = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(BAG_LIFT_API_ENDPOINT);
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
      const data: BagLiftRecord[] = await response.json();
      setBagLiftRecords(data);
      toast.success("Bag Lift records loaded successfully!");
    } catch (error: any) {
      console.error("Failed to fetch Bag Lift records:", error);
      toast.error(`Failed to fetch Bag Lift records: ${error.message}`);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    } finally {
      setIsLoadingLocations(false);
    }
  }, []);

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
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBagLiftRecords();
    fetchLocations();
    fetchRoles();
  }, [fetchBagLiftRecords, fetchLocations, fetchRoles]);

  const openViewModal = (record: BagLiftRecord) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
    setIsUpdatingId(id);
    const toastId = `baglift-${id}-${newStatus}`;
    toast.loading(`${newStatus === 'approved' ? 'Approving' : 'Rejecting'} bag lift...`, { id: toastId });

    try {
      const response = await fetch(`${BAG_LIFT_ACTION_API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Update failed.');
      }

      toast.success(`Bag Lift successfully ${newStatus}.`, { id: toastId });
      await fetchBagLiftRecords();
    } catch (err: any) {
      toast.error(err.message || 'An unknown error occurred.', { id: toastId });
    } finally {
      setIsUpdatingId(null);
    }
  };

  // --- Filtering Logic ---
  const filteredRecords = useMemo(() => {
    // Removed setCurrentPage(1) because we aren't managing page state anymore
    return bagLiftRecords.filter((record) => {
      const nameMatch = !searchQuery || record.masonName.toLowerCase().includes(searchQuery.toLowerCase());
      const statusMatch = statusFilter === 'all' || record.status.toLowerCase() === statusFilter.toLowerCase();
      const roleMatch = roleFilter === 'all' || record.role?.toLowerCase() === roleFilter.toLowerCase();
      // const areaMatch = areaFilter === 'all' || record.area?.toLowerCase() === areaFilter.toLowerCase();
      // const regionMatch = regionFilter === 'all' || record.region?.toLowerCase() === regionFilter.toLowerCase();

      return nameMatch && statusMatch && roleMatch; // && areaMatch && regionMatch;
    });
  }, [bagLiftRecords, searchQuery, statusFilter, roleFilter]);
  // Removed areaFilter/regionFilter from deps as they are commented out above



  // --- 3. Define Columns for Bag Lift DataTable ---
  const bagLiftColumns: ColumnDef<BagLiftRecord>[] = [
    { accessorKey: "id", header: "Record ID", cell: ({ row }) => <span className="text-xs font-mono">{row.original.id.substring(0, 8)}...</span> },
    { accessorKey: "masonName", header: "Mason Name" },
    { accessorKey: "dealerName", header: "Dealer Name" },
    {
      accessorKey: "purchaseDate",
      header: "Purchase Date",
      cell: ({ row }) => formatDate(row.original.purchaseDate)
    },
    { accessorKey: "bagCount", header: "Bags" },
    {
      accessorKey: "pointsCredited",
      header: "Points",
      cell: ({ row }) => <span className="font-medium">{row.original.pointsCredited}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={cn("capitalize", getStatusBadgeVariant(row.original.status))}>
          {row.original.status}
        </Badge>
      ),
    },
    { accessorKey: "approverName", header: "Approved By" },
    {
      accessorKey: "approvedAt",
      header: "Approved On",
      cell: ({ row }) => formatDate(row.original.approvedAt)
    },
    { accessorKey: "area", header: "Area" },
    { accessorKey: "region", header: "Region(Zone)" },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const record = row.original;
        const isPending = record.status.toLowerCase() === 'pending';
        const isUpdating = isUpdatingId === record.id;

        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openViewModal(record)}
              className="text-blue-500 border-blue-500 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4 mr-1" /> View
            </Button>

            {isPending && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleStatusUpdate(record.id, 'approved')}
                  disabled={isUpdating}
                >
                  {isUpdating && isUpdatingId === record.id
                    ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    : <Check className="h-4 w-4 mr-1" />}
                  Approve
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusUpdate(record.id, 'rejected')}
                  disabled={isUpdating}
                >
                  {isUpdating && isUpdatingId === record.id
                    ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    : <X className="h-4 w-4 mr-1" />}
                  Reject
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const handleBagLiftOrderChange = (newOrder: BagLiftRecord[]) => {
    console.log("New Bag Lift order:", newOrder.map(r => r.id));
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-2">Loading Bag Lift records...</span>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 min-h-screen pt-10">
      Error: {error}
      <Button onClick={fetchBagLiftRecords} className="ml-4">Retry</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Bag Lift Records</h2>
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

          {/* 2. Status Filter */}
          {renderSelectFilter(
            'Status',
            statusFilter,
            (v) => { setStatusFilter(v); },
            statusOptions
          )}

          {/* 3. Role Filter */}
          {/* {renderSelectFilter(
            'Role',
            roleFilter,
            (v) => { setRoleFilter(v); },
            availableRoles,
            isLoadingRoles
          )} */}

          {/* 4. Area Filter (Following the sample style) */}
          {renderSelectFilter(
            'Area', 
            areaFilter, 
            (v) => { setAreaFilter(v); }, 
            availableAreas, 
            isLoadingLocations
          )}

          {/* 5. Region Filter (Following the sample style) */}
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
          {filteredRecords.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No Bag Lift records found matching the selected filters.</div>
          ) : (
            <>
              <DataTableReusable
                columns={bagLiftColumns}
                data={filteredRecords}
                enableRowDragging={false}
                onRowOrderChange={handleBagLiftOrderChange}
              />
            </>
          )}
        </div>
      </div>

      {selectedRecord && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bag Lift Details</DialogTitle>
              <DialogDescription>
                Review the full Bag Lift information for this Mason.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="md:col-span-2 text-lg font-semibold border-b pb-2">
                Mason & Dealer Info
              </div>

              <div>
                <Label>Mason Name</Label>
                <Input value={selectedRecord.masonName} readOnly />
              </div>
              <div>
                <Label>Dealer Name</Label>
                <Input value={selectedRecord.dealerName || 'N/A'} readOnly />
              </div>

              <div className="md:col-span-2 text-lg font-semibold border-b pt-4 pb-2">
                Bag Lift Details
              </div>

              <div>
                <Label>Purchase Date</Label>
                <Input value={formatDate(selectedRecord.purchaseDate)} readOnly />
              </div>
              <div>
                <Label>Bag Count</Label>
                <Input value={selectedRecord.bagCount} readOnly />
              </div>
              <div>
                <Label>Points Credited</Label>
                <Input value={selectedRecord.pointsCredited} readOnly />
              </div>
              <div>
                <Label>Status</Label>
                <Input value={selectedRecord.status} readOnly />
              </div>

              <div className="md:col-span-2 text-lg font-semibold border-b pt-4 pb-2">
                Approval Info
              </div>

              <div>
                <Label>Approved By</Label>
                <Input value={selectedRecord.approverName || 'N/A'} readOnly />
              </div>
              <div>
                <Label>Approved At</Label>
                <Input value={formatDate(selectedRecord.approvedAt)} readOnly />
              </div>

              {/* --- UPDATED IMAGE PREVIEW SECTION --- */}
              {selectedRecord.imageUrl && (
                <div className="md:col-span-2">
                  <Label htmlFor="bagLiftImage">Bag Lift Image</Label>
                  <div id="bagLiftImage" className="mt-2 border p-2 rounded-md bg-muted/50">
                    {/* Link to open original image */}
                    <a
                      href={selectedRecord.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center text-sm font-medium mb-2"
                    >
                      View Original Image <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                    {/* Bigger Image (w-full) */}
                    <img
                      src={selectedRecord.imageUrl}
                      alt="Bag Lift"
                      className="w-full h-auto rounded-md border"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
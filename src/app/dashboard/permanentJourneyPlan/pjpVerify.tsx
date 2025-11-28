// src/app/dashboard/permanentJourneyPlan/pjpVerify.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTableReusable } from '@/components/data-table-reusable';

import {
  permanentJourneyPlanVerificationSchema,
  type PermanentJourneyPlanVerificationSchema,
  type PjpModificationSchema
} from '@/lib/shared-zod-schema';

type PermanentJourneyPlanVerification = PermanentJourneyPlanVerificationSchema;
type PJPModificationData = PjpModificationSchema;

type Dealer = {
  id: string;
  name: string;
  area: string;
  region: string;
};

type Site = {
  id: string;
  name: string;
  location?: string;
};

interface PJPModificationState extends PJPModificationData {
  id: string; 
  dealerId?: string | null;
  siteId?: string | null; // Added siteId
}

export default function PJPVerifyPage() {
  const [pendingPJPs, setPendingPJPs] = useState<PermanentJourneyPlanVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allDealers, setAllDealers] = useState<Dealer[]>([]);
  const [allSites, setAllSites] = useState<Site[]>([]); // Added Sites State
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  // Selection State (Mutually Exclusive)
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  // State for Modification Dialog
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [pjpToModify, setPjpToModify] = useState<PJPModificationState | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  
  // Delete handler
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  
  // filters
  const [selectedSalesmanFilter, setSelectedSalesmanFilter] = useState<string>('all');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');

  // API URIs
  const pjpVerificationAPI = `/api/dashboardPagesAPI/permanent-journey-plan/pjp-verification`;
  const dealerAPI = `/api/dashboardPagesAPI/dealerManagement`;
  const locationAPI = `${dealerAPI}/dealer-locations`;
  const sitesAPI = `/api/dashboardPagesAPI/technical-sites`;

  // --- Fetch Locations, Dealers, and Sites ---
  const fetchDependencies = useCallback(async () => {
    try {
      // 1. Fetch Locations (Areas)
      const locationResponse = await fetch(locationAPI);
      if (locationResponse.ok) {
        const data = await locationResponse.json();
        setAvailableAreas((data.areas || []).filter(Boolean).sort());
      }

      // 2. Fetch Dealers
      const dealerResponse = await fetch(dealerAPI);
      if (dealerResponse.ok) {
        const data = await dealerResponse.json();
        const validatedDealers: Dealer[] = (data || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          area: d.area,
          region: d.region,
        }));
        setAllDealers(validatedDealers);
      }

      // 3. Fetch Sites
      const siteResponse = await fetch(sitesAPI);
      if (siteResponse.ok) {
        const data = await siteResponse.json();
        // Adjust mapping based on your actual site API response structure
        const validatedSites: Site[] = (data || []).map((s: any) => ({
          id: s.id,
          name: s.name || s.siteName, // Handle both siteName/name
          location: s.location || s.area || '',
        }));
        setAllSites(validatedSites);
      }

    } catch (e) {
      console.error('Error fetching dependencies:', e);
      toast.error('Failed to load dealer or site data.');
    }
  }, [locationAPI, dealerAPI, sitesAPI]);

  // --- 1. Fetch Pending PJPs (GET request) ---
  const fetchPendingPJPs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(pjpVerificationAPI);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      const plansArray = Array.isArray(data) ? data : data.plans;

      const validatedPJPs = z.array(permanentJourneyPlanVerificationSchema).parse(plansArray);
      setPendingPJPs(validatedPJPs);
      toast.success(`Loaded ${validatedPJPs.length} pending PJPs.`, { duration: 2000 });
    } catch (e: any) {
      console.error('Failed to fetch pending PJPs:', e);
      const message = e instanceof z.ZodError
        ? 'Data validation failed. Schema mismatch with backend.'
        : (e.message || 'An unknown error occurred.');

      toast.error(`Failed to load pending PJPs: ${message}`);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pjpVerificationAPI]);

  useEffect(() => {
    fetchPendingPJPs();
    fetchDependencies();
  }, [fetchPendingPJPs, fetchDependencies]);

  // --- Resolve dealer by name within an area (best-effort) ---
  const resolveDealerFromName = (name?: string | null, area?: string | null) => {
    if (!name || !area) return null;
    const lower = name.trim().toLowerCase();
    return allDealers.find(
      (d) => d.area === area && d.name.trim().toLowerCase() === lower
    ) || null;
  };

  // Helper to open the modification dialog
  const openModificationDialog = (pjp: PermanentJourneyPlanVerification) => {
    // Attempt to seed Dealer ID if missing but name matches
    const seededDealer =
      (pjp.dealerId && allDealers.find((d) => d.id === pjp.dealerId)) ||
      resolveDealerFromName(pjp.visitDealerName ?? null, pjp.areaToBeVisited);

    // Attempt to seed Site ID if present in PJP (assuming backend sends it)
    const seededSiteId = (pjp as any).siteId || null;

    setPjpToModify({
      id: pjp.id,
      planDate: pjp.planDate,
      areaToBeVisited: pjp.areaToBeVisited,
      description: pjp.description,
      visitDealerName: pjp.visitDealerName ?? null, 
      additionalVisitRemarks: pjp.additionalVisitRemarks,
      dealerId: pjp.dealerId ?? seededDealer?.id ?? null,
      siteId: seededSiteId,
    });

    // Reset UI selectors based on what is present
    if (seededSiteId) {
        setSelectedSiteId(seededSiteId);
        setSelectedDealerId(null);
    } else if (seededDealer) {
        setSelectedDealerId(seededDealer.id);
        setSelectedSiteId(null);
    } else {
        setSelectedDealerId(null);
        setSelectedSiteId(null);
    }

    setIsModificationDialogOpen(true);
  };

  // Options for the dealer select (area-scoped)
  const dealerOptions = (pjpToModify?.areaToBeVisited
    ? allDealers.filter((d) => d.area === pjpToModify.areaToBeVisited)
    : []
  ).map((d) => ({
    value: d.id,
    label: `${d.name} — ${d.area}`,
  }));

  // Options for sites (All sites or filtered if needed)
  const siteOptions = allSites.map((s) => ({
      value: s.id,
      label: `${s.name} ${s.location ? `(${s.location})` : ''}`,
  }));

  // --- 2. Handle Verification/Rejection Action (PUT request) ---
  const handleVerificationAction = async (pjpId: string, action: 'VERIFIED') => {
    toast.loading(`Updating PJP status to ${action}...`, { id: 'verification-status' });

    try {
      const response = await fetch(`${pjpVerificationAPI}/${pjpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: action, status: action }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as any));
        throw new Error(errorData.message || errorData.error || 'Verification failed.');
      }

      toast.success(`PJP successfully marked as ${action}!`, { id: 'verification-status' });
      fetchPendingPJPs();
    } catch (e: any) {
      toast.error(e.message || 'An error occurred during verification.', { id: 'verification-status' });
    }
  };

  // --- 3. Handle Modification and Approval (PATCH request) ---
  const handlePatchPJP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pjpToModify) return;

    setIsPatching(true);
    toast.loading(`Modifying and verifying PJP ID: ${pjpToModify.id}...`, { id: 'patch-status' });

    try {
      const payload = {
        ...pjpToModify,
        dealerId: selectedDealerId ?? null, 
        siteId: selectedSiteId ?? null,      // Send Site ID
        visitDealerName: undefined,
      };

      const response = await fetch(`${pjpVerificationAPI}/${pjpToModify.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as any));
        throw new Error(errorData.message || errorData.error || 'Modification failed.');
      }

      toast.success('PJP modified and VERIFIED successfully!', { id: 'patch-status' });
      setIsModificationDialogOpen(false);
      setPjpToModify(null);
      setSelectedDealerId(null);
      setSelectedSiteId(null);
      fetchPendingPJPs();
    } catch (e: any) {
      toast.error(e.message || 'An error occurred during modification.', { id: 'patch-status' });
    } finally {
      setIsPatching(false);
    }
  };

  // ---  Handler to DELETE a PJP ---
  const handleDeletePjp = async (id: string) => {
    setDeletingId(id);
    const toastId = `delete-${id}`;
    toast.loading(`Rejecting and deleting PJP...`, { id: toastId });
    try {
      const response = await fetch(
        `/api/dashboardPagesAPI/permanent-journey-plan?id=${id}`,
        { method: 'DELETE' },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete PJP');
      }

      toast.success('PJP Rejected and Deleted', { id: toastId });
      fetchPendingPJPs();
    } catch (e: any) {
      toast.error(e.message, { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  // ---  Derived lists for filter dropdowns ---
  const salesmanOptions = React.useMemo(() => {
    const names = new Set<string>();
    pendingPJPs.forEach((p) => { if (p.salesmanName) names.add(p.salesmanName); });
    return ['all', ...Array.from(names).sort()];
  }, [pendingPJPs]);

  const regionOptions = React.useMemo(() => {
    const regions = new Set<string>();
    pendingPJPs.forEach((p) => { if (p.salesmanRegion) regions.add(p.salesmanRegion); });
    return ['all', ...Array.from(regions).sort()];
  }, [pendingPJPs]);

  // --- Client-side Filtering ---
  const filteredPJPs = React.useMemo(() => {
    return pendingPJPs.filter((pjp) => {
      const matchesSalesman = selectedSalesmanFilter === 'all' ? true : pjp.salesmanName === selectedSalesmanFilter;
      const matchesRegion = selectedRegionFilter === 'all' ? true : pjp.salesmanRegion === selectedRegionFilter;
      return matchesSalesman && matchesRegion;
    });
  }, [pendingPJPs, selectedSalesmanFilter, selectedRegionFilter]);

  // --- Columns for PENDING PJPs Table ---
  const pjpVerificationColumns: ColumnDef<PermanentJourneyPlanVerification>[] = [
    { accessorKey: 'salesmanName', header: 'Salesman', minSize: 150 },
    { accessorKey: 'planDate', header: 'Date', minSize: 100 },
    { accessorKey: 'areaToBeVisited', header: 'Area', minSize: 120 },
    {
      accessorKey: 'visitDealerName',
      header: 'Visiting',
      minSize: 180,
      cell: ({ row }) => {
        const name = row.original.visitDealerName;
        // Check local row data to see what type of entity this is
        // We cast to any because the base schema might not explicitly strict type siteId yet in some versions
        const r = row.original as any;
        const isSite = !!r.siteId;
        const isDealer = !!r.dealerId;
        
        if (!name) return <span className="text-gray-400">N/A</span>;
        
        return (
            <div className="flex flex-col">
                <span className="font-medium">{name}</span>
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                    {isSite ? 'Site' : isDealer ? 'Dealer' : ''}
                </span>
            </div>
        );
      },
    },
    { accessorKey: 'salesmanRegion', header: 'Region', minSize: 100 },
    { accessorKey: 'salesmanArea', header: 'Area', minSize: 100 },
    {
      accessorKey: 'description',
      header: 'Description',
      minSize: 220,
      cell: ({ row }) => (
        <span className="max-w-60 truncate block" title={row.original.description || ''}>
          {row.original.description || 'No Description'}
        </span>
      ),
    },
    {
      id: 'verificationActions',
      header: 'Actions',
      minSize: 300,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-green-500 hover:bg-green-700"
            onClick={() => handleVerificationAction(row.original.id, 'VERIFIED')}
            disabled={deletingId === row.original.id}
          >
            Verify
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => openModificationDialog(row.original)}
            className="text-white bg-blue-500 hover:bg-blue-600"
            disabled={deletingId === row.original.id}
          >
            Edit & Apply
          </Button>
          <Button
            className="bg-red-800 hover:bg-red-900 text-white"
            size="sm"
            onClick={() => handleDeletePjp(row.original.id)}
            disabled={deletingId === row.original.id}
          >
            {deletingId === row.original.id ? 'Rejecting...' : 'Reject'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="mt-4 shadow-xl">
      <CardHeader className="rounded-t-lg">
        <CardTitle className="text-2xl">PJP Verification Queue</CardTitle>
        <CardDescription>
          Review and verify (PJPs) submitted by sales executives.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">

        {/* --- Filter Controls --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Select value={selectedSalesmanFilter} onValueChange={setSelectedSalesmanFilter}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Filter by Salesman Name" />
            </SelectTrigger>
            <SelectContent>
              {salesmanOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name === 'all' ? 'All Salesmen' : name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRegionFilter} onValueChange={setSelectedRegionFilter}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Filter by Region" />
            </SelectTrigger>
            <SelectContent>
              {regionOptions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region === 'all' ? 'All Regions' : region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-blue-500 flex items-center justify-center space-x-2">
            <span>Loading pending PJPs...</span>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-12 border border-red-200 bg-red-50 rounded-lg p-4">
            <p className="font-semibold">Error loading PJPs.</p>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : pendingPJPs.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <span className="text-lg font-medium">No new PJPs pending verification.</span>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <DataTableReusable
              columns={pjpVerificationColumns}
              data={filteredPJPs}
              enableRowDragging={false}
              onRowOrderChange={() => { }}
            />
          </div>
        )}
      </CardContent>

      {/* --- PJP Modification/Approval Dialog --- */}
      <Dialog open={isModificationDialogOpen} onOpenChange={setIsModificationDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit & Approve PJP: {pjpToModify?.id}</DialogTitle>
            <DialogDescription>
              Modify PJP details. <strong>Note:</strong> You can select either a Dealer OR a Site, not both.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePatchPJP} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="planDate" className="text-right">Plan Date</Label>
              <Input
                id="planDate"
                type="date"
                value={pjpToModify?.planDate || ''}
                onChange={(e) => setPjpToModify((p) => (p ? { ...p, planDate: e.target.value } : null))}
                className="col-span-3"
              />
            </div>

            {/* Area */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="areaToBeVisited" className="text-right">Area</Label>
              <Select
                value={pjpToModify?.areaToBeVisited || ''}
                onValueChange={(value) => {
                  setPjpToModify((p) => (p ? { ...p, areaToBeVisited: value } : null));
                  // Only reset dealer if area changes, sites might not be strictly area bound in UI logic yet
                  // but good practice to reset dealer since dealer list depends on area
                  setSelectedDealerId(null); 
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Area" />
                </SelectTrigger>
                <SelectContent>
                  {availableAreas.map((area) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dealer Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Dealer</Label>
              <Select
                value={selectedDealerId ?? ''}
                onValueChange={(val) => {
                  setSelectedDealerId(val);
                  setSelectedSiteId(null); // Clear Site
                }}
                disabled={!pjpToModify?.areaToBeVisited || dealerOptions.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={pjpToModify?.areaToBeVisited ? 'Select Dealer' : 'Select Area first...'} />
                </SelectTrigger>
                <SelectContent>
                  {dealerOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative py-1 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative bg-white px-2 text-xs text-muted-foreground uppercase">OR</div>
            </div>

            {/* Site Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Site</Label>
              <Select
                value={selectedSiteId ?? ''}
                onValueChange={(val) => {
                  setSelectedSiteId(val);
                  setSelectedDealerId(null); // Clear Dealer
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Site (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {siteOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">Description</Label>
              <Textarea
                id="description"
                value={pjpToModify?.description || ''}
                onChange={(e) => setPjpToModify((p) => (p ? { ...p, description: e.target.value } : null))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="remarks" className="text-right pt-2">Admin Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Add optional verification remarks..."
                value={pjpToModify?.additionalVisitRemarks || ''}
                onChange={(e) => setPjpToModify((p) => p ? { ...p, additionalVisitRemarks: e.target.value } : null)}
                className="col-span-3"
              />
            </div>
            
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModificationDialogOpen(false)} disabled={isPatching}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPatching}>
                {isPatching ? 'Saving...' : 'Save & Approve (VERIFIED)'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
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

interface PJPModificationState extends PJPModificationData {
  id: string; // Keep the ID for the PATCH request
  dealerId?: string | null;
}

export default function PJPVerifyPage() {
  const [pendingPJPs, setPendingPJPs] = useState<PermanentJourneyPlanVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allDealers, setAllDealers] = useState<Dealer[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  // Name-first UX: store both visible label and hidden FK
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [selectedDealerLabel, setSelectedDealerLabel] = useState<string>('');

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
  const pjpVerificationAPI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/permanent-journey-plan/pjp-verification`;
  const dealerAPI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/dealerManagement`;
  const locationAPI = `${dealerAPI}/dealer-locations`;

  // --- Fetch Locations and Dealers ---
  const fetchLocationsAndDealers = useCallback(async () => {
    try {
      // 1. Fetch Locations (Areas)
      const locationResponse = await fetch(locationAPI);
      if (locationResponse.ok) {
        const data = await locationResponse.json();
        setAvailableAreas((data.areas || []).filter(Boolean).sort());
      } else {
        console.error('Failed to fetch locations.');
      }

      // 2. Fetch Verified Dealers (GET)
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
      } else {
        console.error('Failed to fetch dealers.');
      }
    } catch (e) {
      console.error('Error fetching dependencies:', e);
      toast.error('Failed to load dealer data for modification form.');
    }
  }, [locationAPI, dealerAPI]);

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
    fetchLocationsAndDealers(); // Fetch dependencies on mount
  }, [fetchPendingPJPs, fetchLocationsAndDealers]);

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
    const seededDealer =
      (pjp.dealerId && allDealers.find((d) => d.id === pjp.dealerId)) ||
      resolveDealerFromName(pjp.visitDealerName ?? null, pjp.areaToBeVisited);

    setPjpToModify({
      id: pjp.id,
      planDate: pjp.planDate,
      areaToBeVisited: pjp.areaToBeVisited,
      description: pjp.description,
      visitDealerName: pjp.visitDealerName ?? null, // only for display; not sent
      additionalVisitRemarks: pjp.additionalVisitRemarks,
      dealerId: pjp.dealerId ?? seededDealer?.id ?? null,
    });

    if (seededDealer) {
      setSelectedDealerId(seededDealer.id);
      setSelectedDealerLabel(
        `${seededDealer.name} — ${seededDealer.area}${seededDealer.region ? ', ' + seededDealer.region : ''}`
      );
    } else {
      setSelectedDealerId(null);
      setSelectedDealerLabel('');
    }

    setIsModificationDialogOpen(true);
  };

  // Options for the dealer select (area-scoped)
  const dealerOptions = (pjpToModify?.areaToBeVisited
    ? allDealers.filter((d) => d.area === pjpToModify.areaToBeVisited)
    : []
  ).map((d) => ({
    value: d.id,
    label: `${d.name} — ${d.area}${d.region ? ', ' + d.region : ''}`,
  }));

  // --- 2. Handle Verification/Rejection Action (PUT request) ---
  const handleVerificationAction = async (pjpId: string, action: 'VERIFIED') => {
    toast.loading(`Updating PJP status to ${action}...`, { id: 'verification-status' });

    try {
      const response = await fetch(`${pjpVerificationAPI}/${pjpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: action }),
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
        dealerId: selectedDealerId ?? null,  // send FK only
        visitDealerName: undefined,          // do not send legacy text
      };

      const response = await fetch(`${pjpVerificationAPI}/${pjpToModify.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as any));
        throw new Error(errorData.message || errorData.error || 'Modification and approval failed.');
      }

      toast.success('PJP modified and VERIFIED successfully!', { id: 'patch-status' });
      setIsModificationDialogOpen(false);
      setPjpToModify(null);
      setSelectedDealerId(null);
      setSelectedDealerLabel('');
      fetchPendingPJPs();
    } catch (e: any) {
      toast.error(e.message || 'An error occurred during modification.', { id: 'patch-status' });
    } finally {
      setIsPatching(false);
    }
  };

  // ---  Handler to DELETE a PJP (replaces 'REJECT' logic) ---
  const handleDeletePjp = async (id: string) => {
    setDeletingId(id); // Set loading state for this specific button
    const toastId = `delete-${id}`;
    toast.loading(`Rejecting and deleting PJP...`, { id: toastId });
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/permanent-journey-plan?id=${id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete PJP');
      }

      toast.success('PJP Rejected and Deleted', { id: toastId });
      fetchPendingPJPs(); // Refresh the list
    } catch (e: any) {
      toast.error(e.message, { id: toastId });
    } finally {
      setDeletingId(null); // Clear loading state
    }
  };

  // ---  Derived lists for filter dropdowns ---
  const salesmanOptions = React.useMemo(() => {
    const names = new Set<string>();
    pendingPJPs.forEach((p) => {
      if (p.salesmanName) names.add(p.salesmanName);
    });
    return ['all', ...Array.from(names).sort()];
  }, [pendingPJPs]);

  const regionOptions = React.useMemo(() => {
    const regions = new Set<string>();
    pendingPJPs.forEach((p) => {
      if (p.salesmanRegion) regions.add(p.salesmanRegion);
    });
    return ['all', ...Array.from(regions).sort()];
  }, [pendingPJPs]);

  // --- Client-side Filtering ---
  const filteredPJPs = React.useMemo(() => {
    return pendingPJPs.filter((pjp) => {
      const matchesSalesman =
        selectedSalesmanFilter === 'all' ? true : pjp.salesmanName === selectedSalesmanFilter;

      const matchesRegion =
        selectedRegionFilter === 'all' ? true : pjp.salesmanRegion === selectedRegionFilter;

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
      header: 'Visiting Dealer',
      minSize: 180,
      cell: (info) => info.getValue() || <span className="text-gray-400">N/A</span>,
    },
    { accessorKey: 'salesmanRegion', header: 'Region', minSize: 100 },
    { accessorKey: 'salesmanArea', header: 'Area', minSize: 100 },
    {
      accessorKey: 'description',
      header: 'Description',
      minSize: 220,
      cell: ({ row }) => (
        <span className="max-w-60 truncate block">
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
            // --- MODIFIED: onClick and disabled state ---
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
          <Select
            value={selectedSalesmanFilter}
            onValueChange={setSelectedSalesmanFilter}
          >
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

          <Select
            value={selectedRegionFilter}
            onValueChange={setSelectedRegionFilter}
          >
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
        {/* --- END: Filter Controls --- */}

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

      {/* --- PJP Modification/Approval Dialog (PATCH) --- */}
      <Dialog open={isModificationDialogOpen} onOpenChange={setIsModificationDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit & Approve PJP: {pjpToModify?.id}</DialogTitle>
            <DialogDescription>
              Modify the PJP details before saving and marking it as VERIFIED.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePatchPJP} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="planDate" className="text-right">
                Plan Date
              </Label>
              <Input
                id="planDate"
                type="date"
                value={pjpToModify?.planDate || ''}
                onChange={(e) =>
                  setPjpToModify((p) => (p ? { ...p, planDate: e.target.value } : null))
                }
                className="col-span-3"
              />
            </div>

            {/* Area to Visit - Select component */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="areaToBeVisited" className="text-right">
                Area to Visit
              </Label>
              <Select
                value={pjpToModify?.areaToBeVisited || ''}
                onValueChange={(value) => {
                  setPjpToModify((p) => (p ? { ...p, areaToBeVisited: value } : null));
                  setSelectedDealerId(null);
                  setSelectedDealerLabel('');
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Area" />
                </SelectTrigger>
                <SelectContent>
                  {availableAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dealer to Visit - Single Select by Name (stores ID) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Dealer to Visit</Label>
              <Select
                value={selectedDealerId ?? ''}
                onValueChange={(val) => {
                  setSelectedDealerId(val);
                  const opt = dealerOptions.find((o) => o.value === val);
                  setSelectedDealerLabel(opt?.label ?? '');
                }}
                disabled={!pjpToModify?.areaToBeVisited || dealerOptions.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue
                    placeholder={
                      pjpToModify?.areaToBeVisited ? 'Select Dealer' : 'Select Area first...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {dealerOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                value={pjpToModify?.description || ''}
                onChange={(e) =>
                  setPjpToModify((p) => (p ? { ...p, description: e.target.value } : null))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="remarks" className="text-right pt-2">
                Admin Remarks
              </Label>
              <Textarea
                id="remarks"
                placeholder="Add optional verification remarks here..."
                value={pjpToModify?.additionalVisitRemarks || ''}
                onChange={(e) =>
                  setPjpToModify((p) =>
                    p ? { ...p, additionalVisitRemarks: e.target.value } : null
                  )
                }
                className="col-span-3"
              />
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModificationDialogOpen(false)}
                disabled={isPatching}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPatching}>
                {isPatching ? 'Saving & Verifying...' : 'Save & Approve (VERIFIED)'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

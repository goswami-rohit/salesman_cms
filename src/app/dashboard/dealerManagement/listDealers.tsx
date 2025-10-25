// src/app/dashboard/addDealers/listDealers.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

// Shadcn UI Components (Keeping only what's needed for listing, filtering, and deleting)
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { DataTableReusable } from '@/components/data-table-reusable';

import { useDealerLocations } from '@/components/reusable-dealer-locations';
import { getDealersSchema} from '@/app/api/dashboardPagesAPI/dealerManagement/route';

type DealerRecord = z.infer<typeof getDealersSchema>;

export default function ListDealersPage() {
    // --- State for Dealer Listing ---
    const [dealers, setDealers] = useState<DealerRecord[]>([]);
    const [loadingDealers, setLoadingDealers] = useState(true);
    const [errorDealers, setErrorDealers] = useState<string | null>(null);

    // --- State for Delete Confirmation Dialog ---
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [dealerToDeleteId, setDealerToDeleteId] = useState<string | null>(null);

    // --- Dropdown filter by area and region ---
    const [filterRegion, setFilterRegion] = useState<string>('');
    const [filterArea, setFilterArea] = useState<string>('');
    const { locations, loading: locationsLoading, error: locationsError } = useDealerLocations();

    const apiURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/dealerManagement`;

    // --- Fetch Dealers for the Table (UPDATED to fetch ONLY VERIFIED dealers) ---
    const fetchDealers = useCallback(async () => {
        setLoadingDealers(true);
        setErrorDealers(null);
        try {
            // Fetch ONLY VERIFIED dealers by passing a query parameter
            const response = await fetch(`${apiURI}?status=VERIFIED`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Response Error Text:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            const validatedDealers = z.array(getDealersSchema).parse(data);
            setDealers(validatedDealers);
            toast.success('Verified dealers loaded successfully!');
        } catch (e: any) {
            console.error("Failed to fetch dealers:", e);
            const message = e instanceof z.ZodError 
                ? "Data validation failed. Schema mismatch with backend." 
                : (e.message || "An unknown error occurred.");
            toast.error(`Failed to load dealers: ${message}`);
            setErrorDealers(message);
        } finally {
            setLoadingDealers(false);
        }
    }, [apiURI]);

    useEffect(() => {
        fetchDealers();
    }, [fetchDealers]);

    // --- Delete Handler ---
    const handleDelete = async () => {
        if (!dealerToDeleteId) return;

        try {
            const response = await fetch(`${apiURI}?id=${dealerToDeleteId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || "Failed to delete dealer.");
            }

            toast.success("Dealer deleted successfully!");
            setIsDeleteDialogOpen(false);
            setDealerToDeleteId(null);
            fetchDealers(); // Re-fetch the dealers to update the table
        } catch (e: any) {
            console.error("Error deleting dealer:", e);
            toast.error(e.message || "An unexpected error occurred.");
        }
    };

    // filter handlers for area and region
    const filteredDealers = dealers.filter(d =>
        (filterRegion && filterRegion !== "all" ? d.region === filterRegion : true) &&
        (filterArea && filterArea !== "all" ? d.area === filterArea : true)
    );

    if (loadingDealers || locationsLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                Loading dealer data...
            </div>
        );
    }

    if (errorDealers || locationsError) {
        return (
            <div className="text-center text-red-500 min-h-screen pt-10">
                Error: {errorDealers || locationsError}
            </div>
        );
    }

    // Columns for the Dealers table
    const dealerColumns: ColumnDef<DealerRecord>[] = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'type', header: 'Type' },
        {
            accessorKey: 'parentDealerName', header: 'Parent Dealer',
            cell: info => info.getValue() || '-'
        },
        { accessorKey: 'region', header: 'Region' },
        { accessorKey: 'area', header: 'Area' },
        { accessorKey: 'address', header: 'Address' },
        { accessorKey: 'pinCode', header: 'Pin Code' },
        { accessorKey: 'dateOfBirth', header: 'DOB', cell: info => info.getValue() || '-' },
        { accessorKey: 'anniversaryDate', header: 'Anniversary', cell: info => info.getValue() || '-' },
        { accessorKey: 'phoneNo', header: 'Phone No.' },
        {
            accessorKey: 'totalPotential', header: 'Total Potential',
            cell: info => (info.getValue() as number)?.toFixed(2)
        },
        {
            accessorKey: 'bestPotential', header: 'Best Potential',
            cell: info => (info.getValue() as number)?.toFixed(2)
        },
        {
            accessorKey: 'brandSelling', header: 'Brands',
            cell: info => (info.getValue() as string[]).join(', ')
        },
        {
            accessorKey: 'createdAt', header: 'Added On',
            cell: info => new Date(info.getValue() as string).toLocaleDateString()
        },
        {
            accessorKey: 'verificationStatus', header: 'Status',
            cell: info => (info.getValue() as string[])
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                        setDealerToDeleteId(row.original.id);
                        setIsDeleteDialogOpen(true);
                    }}
                >
                    Delete
                </Button>
            ),
        },
    ];

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Manage Dealers</h1>
            </div>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the dealer record.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4">

                    {/* Region Filter */}
                    <Select value={filterRegion} onValueChange={setFilterRegion}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Region" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            {locations.regions.sort().map(region => (
                                <SelectItem key={region} value={region}>
                                    {region}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Area Filter */}
                    <Select value={filterArea} onValueChange={setFilterArea}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Area" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Areas</SelectItem>
                            {locations.areas.sort().map(areas => (
                                <SelectItem key={areas} value={areas}>
                                    {areas}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                </div>
            </div>

            {/* Dealers Table */}
            <h2 className="text-2xl font-bold mt-10 mb-4">Existing Dealers</h2>
            {loadingDealers ? (
                <div className="text-center py-8">Loading dealers...</div>
            ) : errorDealers ? (
                <div className="text-center text-red-500 py-8">Error loading dealers: {errorDealers}</div>
            ) : dealers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No dealers found for your company.</div>
            ) : (
                <div className="bg-card p-6 rounded-lg border border-border">
                    <DataTableReusable
                        columns={dealerColumns}
                        data={filteredDealers}
                        enableRowDragging={false}
                        onRowOrderChange={() => { }}
                    />
                </div>
            )}
        </div>
    );
}
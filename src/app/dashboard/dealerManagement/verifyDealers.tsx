// src/app/dashboard/dealerManagement/verifyDealers.tsx
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
import { DataTableReusable } from '@/components/data-table-reusable';
import { dealerVerificationSchema } from '@/lib/shared-zod-schema';


type DealerRecord = z.infer<typeof dealerVerificationSchema>;

export default function VerifyDealersPage() {
    const [pendingDealers, setPendingDealers] = useState<DealerRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const apiURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/dealerManagement/dealer-verify`;

    // --- Fetch Pending Dealers ---
    const fetchPendingDealers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch ONLY PENDING dealers
            const response = await fetch(`${apiURI}?status=PENDING`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            
            const dealersArray = Array.isArray(data) ? data : data.dealers;

            const validatedDealers = z.array(dealerVerificationSchema).parse(dealersArray);
            setPendingDealers(validatedDealers);
            toast.success(`Loaded ${validatedDealers.length} pending dealers.`, { duration: 2000 });
        } catch (e: any) {
            console.error("Failed to fetch pending dealers:", e);
            const message = e instanceof z.ZodError 
                ? "Data validation failed. Schema mismatch with backend." 
                : (e.message || "An unknown error occurred.");

            toast.error(`Failed to load pending dealers: ${message}`);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [apiURI]);

    useEffect(() => {
        fetchPendingDealers();
    }, [fetchPendingDealers]);


    // --- Handle Verification/Rejection Action (PUT request) ---
    const handleVerificationAction = async (dealerId: string, action: 'VERIFIED' | 'REJECTED') => {
        console.log(`Attempting to set dealer ID: ${dealerId} status to ${action}`);

        toast.loading(`Updating dealer status to ${action}...`, { id: 'verification-status' });

        try {
            // Call the PUT endpoint with the dealer ID as a query param and the status in the body
            const response = await fetch(`${apiURI}?id=${dealerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                // Sending 'verificationStatus' to match the fixed backend logic
                body: JSON.stringify({ verificationStatus: action }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || "Verification failed.");
            }

            toast.success(`Dealer successfully marked as ${action}!`, { id: 'verification-status' });
            fetchPendingDealers();
        } catch (e: any) {
            toast.error(e.message || "An error occurred during verification.", { id: 'verification-status' });
        }
    };


    // --- Columns for PENDING Dealers Table (Updated accessors) ---
    const pendingDealerColumns: ColumnDef<DealerRecord>[] = [
        { accessorKey: 'name', header: 'Dealer Name', minSize: 150 },
        { accessorKey: 'phoneNo', header: 'Phone No.', minSize: 120 },
        { accessorKey: 'region', header: 'Region', minSize: 100 },
        { accessorKey: 'gstinNo', header: 'GSTIN', minSize: 150, cell: info => info.getValue() || <span className='text-gray-400'>N/A</span> },
        { accessorKey: 'tradeLicNo', header: 'Trade Lic. No.', minSize: 120, cell: info => info.getValue() || <span className='text-gray-400'>N/A</span> },
        {
            accessorKey: 'dealerPicUrl', header: 'Dealer/ID Pic', minSize: 100,
            cell: ({ row }) => row.original.dealerPicUrl ? (
                <a 
                    href={row.original.dealerPicUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:text-blue-600 underline text-sm truncate max-w-[100px] block"
                >
                    View Dealer Pic
                </a>
            ) : (<span className='text-gray-400 text-sm'>N/A</span>),
        },
        {
            accessorKey: 'shopPicUrl', header: 'Shop Pic', minSize: 100,
            cell: ({ row }) => row.original.shopPicUrl ? (
                <a 
                    href={row.original.shopPicUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:text-blue-600 underline text-sm truncate max-w-[100px] block"
                >
                    View Shop Pic
                </a>
            ) : (<span className='text-gray-400 text-sm'>N/A</span>),
        },
        {
            id: 'verificationActions',
            header: 'Actions',
            minSize: 220,
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        className='bg-green-600 hover:bg-green-700'
                        onClick={() => handleVerificationAction(row.original.id, 'VERIFIED')}
                    >
                        Verify
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleVerificationAction(row.original.id, 'REJECTED')}
                    >
                        Reject
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <Card className='mt-4 shadow-xl'>
            <CardHeader className='rounded-t-lg'>
                <CardTitle className='text-2xl'>Dealer Verification Queue</CardTitle>
                <CardDescription>
                    Review new dealer submissions. Check all required documentation (GSTIN, Registration, ID pic, Shop pic) before verifying.
                </CardDescription>
            </CardHeader>
            <CardContent className='p-6'>
                {loading ? (
                    <div className="text-center py-12 text-blue-500 flex items-center justify-center space-x-2">
                        <span>Loading pending dealers...</span>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-12 border border-red-200 bg-red-50 rounded-lg p-4">
                        <p className='font-semibold'>Error loading dealers.</p>
                        <p className='text-sm text-red-400'>{error}</p>
                    </div>
                ) : pendingDealers.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <span className='text-lg font-medium'>No new dealers pending verification.</span>
                        <p className='text-sm mt-1'>You're all caught up!</p>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <DataTableReusable
                            columns={pendingDealerColumns}
                            data={pendingDealers}
                            enableRowDragging={false}
                            onRowOrderChange={() => { }}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
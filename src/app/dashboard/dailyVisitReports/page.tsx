// src/app/dashboard/dailyVisitReports/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { ColumnDef, createColumnHelper, CellContext } from '@tanstack/react-table'; // Keep createColumnHelper
import { toast } from "sonner";
import { z } from "zod";
import { UniqueIdentifier } from '@dnd-kit/core';

// Import your Shadcn UI components for the table
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Only needed for retry button on error

// --- 1. Define Zod Schema for Daily Visit Report Data (matches API output) ---
const dailyVisitReportSchema = z.object({
    id: z.string() as z.ZodType<UniqueIdentifier>,
    salesmanName: z.string(),
    reportDate: z.string(), // YYYY-MM-DD string from backend
    dealerType: z.string(),
    dealerName: z.string().nullable(),
    subDealerName: z.string().nullable(),
    location: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    visitType: z.string(),
    dealerTotalPotential: z.number(),
    dealerBestPotential: z.number(),
    brandSelling: z.array(z.string()),
    contactPerson: z.string().nullable(),
    contactPersonPhoneNo: z.string().nullable(),
    todayOrderMt: z.number(),
    todayCollectionRupees: z.number(),
    feedbacks: z.string(),
    solutionBySalesperson: z.string().nullable(),
    anyRemarks: z.string().nullable(),
    checkInTime: z.string(), // ISO string
    checkOutTime: z.string().nullable(), // ISO string or null
    inTimeImageUrl: z.string().nullable(),
    outTimeImageUrl: z.string().nullable(),
});

// Infer the TypeScript type from the Zod schema
type DailyVisitReport = z.infer<typeof dailyVisitReportSchema>;

// Create a column helper for type safety and easier column definition
const columnHelper = createColumnHelper<DailyVisitReport>();

export default function DailyVisitReportsPage() {
    const [reports, setReports] = useState<DailyVisitReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter(); // Initialize useRouter

    // --- Data Fetching Logic ---
    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/dashboardPagesAPI/daily-visit-reports");
            if (!response.ok) {
                if (response.status === 401) {
                    toast.error("You are not authenticated. Redirecting to login.");
                    router.push('/login');
                    return;
                } else if (response.status === 403) {
                    toast.error("You do not have permission to access this page. Redirecting to dashboard.");
                    router.push('/dashboard');
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data: DailyVisitReport[] = await response.json();

            const validatedData = data.map((item) => {
                try {
                    return dailyVisitReportSchema.parse(item);
                } catch (e) {
                    console.error("Validation error for item:", item, e);
                    toast.error("Invalid report data received from server.");
                    return null;
                }
            }).filter(Boolean) as DailyVisitReport[];

            setReports(validatedData);
            toast.success("Daily Visit Reports loaded successfully!");
        } catch (e: any) {
            console.error("Failed to fetch daily visit reports:", e);
            setError(e.message || "Failed to fetch reports.");
            if (!['401', '403'].includes(e.message?.split('status: ')[1]?.trim())) {
                toast.error(e.message || "Failed to load daily visit reports.");
            }
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    // --- 3. Define Columns for Daily Visit Report DataTable ---
    // Using columnHelper for better type safety and proper ColumnDef structure
    // Explicitly typing the array with `any` for the value type to resolve the type compatibility issue.
    const dailyVisitReportColumns: Array<ColumnDef<DailyVisitReport, any>> = [
        columnHelper.accessor('salesmanName', {
            id: 'salesmanName',
            header: 'Salesman',
        }),
        columnHelper.accessor('reportDate', {
            id: 'reportDate',
            header: 'Date',
        }),
        columnHelper.accessor('dealerType', {
            id: 'dealerType',
            header: 'Dealer Type',
        }),
        columnHelper.accessor('dealerName', {
            id: 'dealerName',
            header: 'Dealer Name',
            cell: info => info.getValue() || 'N/A',
        }),
        columnHelper.accessor('subDealerName', {
            id: 'subDealerName',
            header: 'Sub Dealer Name',
            cell: info => info.getValue() || 'N/A',
        }),
        columnHelper.accessor('location', {
            id: 'location',
            header: 'Location',
        }),
        columnHelper.accessor('visitType', {
            id: 'visitType',
            header: 'Visit Type',
        }),
        columnHelper.accessor('todayOrderMt', {
            id: 'todayOrderMt',
            header: 'Order (MT)',
            cell: info => info.getValue().toFixed(2),
        }),
        columnHelper.accessor('todayCollectionRupees', {
            id: 'todayCollectionRupees',
            header: 'Collection (₹)',
            cell: info => info.getValue().toFixed(2),
        }),
        columnHelper.accessor('feedbacks', {
            id: 'feedbacks',
            header: 'Feedbacks',
            cell: info => <span className="max-w-[200px] truncate block">{info.getValue()}</span>,
        }),
    ];


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                Loading daily visit reports...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 min-h-screen pt-10">
                Error: {error}
                <Button onClick={fetchReports} className="ml-4">Retry</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <div className="flex-1 space-y-8 p-8 pt-6">
                {/* Header Section */}
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Daily Visit Reports</h2>
                </div>

                {/* Data Table Section */}
                <div className="bg-card p-6 rounded-lg border border-border">
                    {reports.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">No daily visit reports found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {dailyVisitReportColumns.map((column) => (
                                            <TableHead key={column.id || column.header as string}>
                                                {column.header as React.ReactNode}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.map((report) => (
                                        <TableRow key={report.id}>
                                            {dailyVisitReportColumns.map((column) => {
                                                let cellContent: React.ReactNode;

                                                // Create a mock CellContext object.
                                                // For simple rendering within TableBody, we primarily need 'row.original' and 'getValue'.
                                                // The 'getValue' function should correctly retrieve the data based on the column's accessor.
                                                const mockCellContext: CellContext<DailyVisitReport, any> = {
                                                    row: { original: report } as any, // Cast to any to satisfy type, as we only need original
                                                    column: column as any, // Cast to any
                                                    table: {} as any, // Dummy table object, not typically used here
                                                    getValue: () => {
                                                        // This is the crucial part: how to get the value for the cell.
                                                        // If it's an accessor column, get the value from the report object.
                                                        if ('accessorKey' in column && column.accessorKey) {
                                                            return (report as any)[column.accessorKey];
                                                        }
                                                        // If it's an accessor function, call it.
                                                        if ('accessorFn' in column && typeof column.accessorFn === 'function') {
                                                            return column.accessorFn(report, 0); // Pass index as second argument if required by accessorFn
                                                        }
                                                        // For 'display' columns or others without direct accessor, the cell function should handle it.
                                                        return undefined;
                                                    },
                                                    // --- ADD THESE TWO PROPERTIES ---
                                                    cell: {} as any, // Provide a dummy object for the 'cell' property
                                                    renderValue: () => mockCellContext.getValue(), // A simple passthrough or dummy function
                                                    // --- END ADDITION ---
                                                };

                                                if (column.cell) {
                                                    // If a custom cell renderer is provided and it's a function, call it.
                                                    if (typeof column.cell === 'function') {
                                                        cellContent = column.cell(mockCellContext);
                                                    } else {
                                                        // If column.cell is not a function (e.g., a string, which should ideally not happen if columnHelper is used correctly)
                                                        cellContent = column.cell; // Render it directly as content
                                                    }
                                                } else {
                                                    // If no custom cell renderer, try to get the value directly from the report using the column's id or accessorKey
                                                    cellContent = mockCellContext.getValue();
                                                }

                                                return (
                                                    <TableCell key={column.id || (column.header as string)}>
                                                        {cellContent}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
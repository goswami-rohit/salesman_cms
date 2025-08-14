// src/app/dashboard/teamOverview/dvrTabContent.tsx
'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { DataTableReusable } from '@/components/data-table-reusable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ColumnDef } from '@tanstack/react-table';
import { RawDailyVisitReportRecord } from '../data-format';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const allRoles = [
    'junior-executive','executive',
];

// Define the columns for the Daily Visit Report table based on the API response
const dailyReportsColumns: ColumnDef<RawDailyVisitReportRecord>[] = [
    { accessorKey: 'salesmanName', header: 'Salesman Name' },
    { accessorKey: 'role', header: 'Role' }, // This column requires an API update
    { accessorKey: 'todayCollectionRupees', header: 'Collection (₹)' },
    { accessorKey: 'todayOrderMt', header: 'Orders (MT)' },
    { accessorKey: 'dealerName', header: 'Dealer Name' },
    {
        accessorKey: 'date',
        header: 'Report Date',
        // Note: The `date` from the API is only a YYYY-MM-DD string, so the time will be 00:00:00.
        cell: ({ row }) => {
            const date = new Date(row.original.reportDate);
            const formattedDate = new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                // hour: 'numeric',
                // minute: '2-digit',
                // second: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata'
            }).format(date);
            return <div>{formattedDate}</div>;
        },
    },
];

export function DVRTabContent() {
    const [reports, setReports] = useState<RawDailyVisitReportRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState('all');

    useEffect(() => {
        async function fetchDailyReports() {
            setIsLoading(true);
            try {
                const url = new URL('/api/dashboardPagesAPI/daily-visit-reports', window.location.origin);
                if (selectedRole !== 'all') {
                    url.searchParams.append('role', selectedRole);
                }

                const response = await fetch(url.toString());
                if (!response.ok) {
                    throw new Error('Failed to fetch daily visit reports');
                }
                const data: RawDailyVisitReportRecord[] = await response.json();
                setReports(data);
            } catch (error) {
                console.error('Error fetching daily reports:', error);
                toast.error('Failed to load Daily Visit Reports.');
            } finally {
                setIsLoading(false);
            }
        }
        fetchDailyReports();
    }, [selectedRole]); // Dependency added to re-fetch on role change

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daily Visit Reports</CardTitle>
                <CardDescription>
                    A table of all submitted daily visit reports for your company.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* New Role Filter Select Component */}
                <div className="flex justify-end mb-4">
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            {allRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center text-neutral-500 py-8">
                        No daily visit reports found for your company.
                    </div>
                ) : (
                    <DataTableReusable columns={dailyReportsColumns} data={reports} />
                )}
            </CardContent>
        </Card>
    );
}
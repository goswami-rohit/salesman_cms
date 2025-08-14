// src/app/dashboard/teamOverview/tvrTabContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { DataTableReusable } from '@/components/data-table-reusable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ColumnDef } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Define the shape of a technical report based on the API route
interface TechnicalReport {
    id: string;
    salesmanName: string;
    visitType: string;
    siteNameConcernedPerson: string;
    phoneNo: string;
    date: string;
    emailId: string;
    clientsRemarks: string;
    salespersonRemarks: string;
    checkInTime: string;
    checkOutTime: string | null;
}

const allRoles = [
    'junior-executive','executive',
];

// Define the columns for the Technical Visit Report table
const technicalReportsColumns: ColumnDef<TechnicalReport>[] = [
    {
        accessorKey: 'salesmanName',
        header: 'Salesman Name',
    },
    {
        accessorKey: 'role',
        header: 'Role',
    },
    {
        accessorKey: 'visitType',
        header: 'Visit Type',
    },
    {
        accessorKey: 'siteNameConcernedPerson',
        header: 'Site/Concerned Person',
    },
    {
        accessorKey: 'clientsRemarks',
        header: 'Client Remarks',
    },
    {
        accessorKey: 'salespersonRemarks',
        header: 'Salesperson Remarks',
    },
    {
        accessorKey: 'date',
        header: 'Report Date',
        // Note: The `date` from the API is only a YYYY-MM-DD string, so the time will be 00:00:00.
        cell: ({ row }) => {
            const date = new Date(row.original.date);
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

export function TVRTabContent() {
    const [reports, setReports] = useState<TechnicalReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedRole, setSelectedRole] = useState('all');

    useEffect(() => {
        async function fetchTechnicalReports() {
            setIsLoading(true);
            try {
                const url = new URL('/api/dashboardPagesAPI/technical-visit-reports', window.location.origin);
                // Add the role as a query parameter if not 'all'
                if (selectedRole !== 'all') {
                    url.searchParams.append('role', selectedRole);
                }

                const response = await fetch(url.toString());
                if (!response.ok) {
                    throw new Error('Failed to fetch technical visit reports');
                }
                const data: TechnicalReport[] = await response.json();
                setReports(data);
            } catch (error) {
                console.error('Error fetching technical reports:', error);
                toast.error('Failed to load Technical Visit Reports.');
            } finally {
                setIsLoading(false);
            }
        }
        fetchTechnicalReports();
    }, [selectedRole]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Technical Visit Reports</CardTitle>
                <CardDescription>
                    A table of all submitted technical visit reports for your company.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                        No technical visit reports found for your company.
                    </div>
                ) : (
                    <DataTableReusable columns={technicalReportsColumns} data={reports} />
                )}
            </CardContent>
        </Card>
    );
}
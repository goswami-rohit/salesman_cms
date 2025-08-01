// src/app/dashboard/dailyVisitReports/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from "sonner";
import { z } from "zod";
import { UniqueIdentifier } from '@dnd-kit/core';

// Import Shadcn UI components
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconDownload, IconLoader2 } from '@tabler/icons-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

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
    dealerTotalPotential: z.number().nullable(),
    dealerBestPotential: z.number().nullable(),
    brandSelling: z.array(z.string()),
    contactPerson: z.string().nullable(),
    contactPersonPhoneNo: z.string().nullable(),
    todayOrderMt: z.number().nullable(),
    todayCollectionRupees: z.number().nullable(),
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

export default function DailyVisitReportsPage() {
    const [reports, setReports] = useState<DailyVisitReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<DailyVisitReport | null>(null);
    const router = useRouter();

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
    
    // --- Download Handlers ---
    const handleDownload = (url: string, filename: string) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleIndividualDownload = async (reportId: UniqueIdentifier, format: 'csv' | 'xlsx'): Promise<void> => {
      if (format === 'xlsx') {
        toast.info("XLSX downloading is not yet implemented.");
        return;
      }
      setIsDownloading(true);
      toast.info(`Downloading report ${reportId} as ${format.toUpperCase()}...`);
      try {
        const filename = `daily-visit-report-${reportId}.csv`;
        const downloadUrl = `/api/dashboardPagesAPI/daily-visit-reports?format=${format}&ids=${reportId}`;
        handleDownload(downloadUrl, filename);
        toast.success("Download started successfully!");
      } catch (e) {
        toast.error("Failed to start download.");
      } finally {
        setIsDownloading(false);
      }
    };

    const handleDownloadAll = async (format: 'csv' | 'xlsx'): Promise<void> => {
      if (format === 'xlsx') {
        toast.info("XLSX downloading is not yet implemented.");
        return;
      }
      setIsDownloading(true);
      toast.info(`Downloading all Daily Visit Reports as ${format.toUpperCase()}...`);
      try {
        const filename = `all-daily-visit-reports-${Date.now()}.csv`;
        const downloadUrl = `/api/dashboardPagesAPI/daily-visit-reports?format=${format}`;
        handleDownload(downloadUrl, filename);
        toast.success("Download started successfully!");
      } catch (e) {
        toast.error("Failed to start download.");
      } finally {
        setIsDownloading(false);
      }
    };
    
    const handleViewReport = (report: DailyVisitReport) => {
        setSelectedReport(report);
        setIsViewModalOpen(true);
    };

    // --- 2. Define Columns for Daily Visit Report DataTable ---
    const dailyVisitReportColumns: ColumnDef<DailyVisitReport>[] = [
        { accessorKey: "salesmanName", header: "Salesman" },
        { accessorKey: "reportDate", header: "Date" },
        { accessorKey: "dealerType", header: "Dealer Type" },
        { accessorKey: "dealerName", header: "Dealer Name", cell: ({ row }) => row.original.dealerName || 'N/A' },
        { accessorKey: "subDealerName", header: "Sub Dealer Name", cell: ({ row }) => row.original.subDealerName || 'N/A' },
        { accessorKey: "location", header: "Location" },
        { accessorKey: "visitType", header: "Visit Type" },
        { accessorKey: "todayOrderMt", header: "Order (MT)", cell: ({ row }) => row.original.todayOrderMt?.toFixed(2) || 'N/A' },
        { accessorKey: "todayCollectionRupees", header: "Collection (₹)", cell: ({ row }) => row.original.todayCollectionRupees?.toFixed(2) || 'N/A' },
        { accessorKey: "feedbacks", header: "Feedbacks", cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.feedbacks}</span> },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <IconDotsVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
                        <DropdownMenuItem onClick={() => handleIndividualDownload(row.original.id, 'csv')}>
                            Download CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleIndividualDownload(row.original.id, 'xlsx')}>
                            Download XLSX
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewReport(row.original)}>
                            View Details
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button disabled={isDownloading}>
                                {isDownloading ? (
                                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <IconDownload className="mr-2 h-4 w-4" />
                                )}
                                Download All
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadAll('csv')}>Download CSV</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadAll('xlsx')}>Download XLSX</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Data Table Section */}
                <div className="bg-card p-6 rounded-lg border border-border">
                    {reports.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">No daily visit reports found.</div>
                    ) : (
                        <DataTableReusable
                            columns={dailyVisitReportColumns}
                            data={reports}
                            reportTitle="Daily Visit Reports"
                            filterColumnAccessorKey="salesmanName" // Column to search by
                            enableRowDragging={false}
                            onDownloadAll={handleDownloadAll}
                        />
                    )}
                </div>
            </div>

            {selectedReport && (
                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Daily Visit Report Details</DialogTitle>
                            <DialogDescription>
                                Detailed information about the visit report.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 gap-4 py-4">
                            <div><Label>Salesman Name</Label><Input value={selectedReport.salesmanName} readOnly /></div>
                            <div><Label>Report Date</Label><Input value={selectedReport.reportDate} readOnly /></div>
                            <div><Label>Dealer Type</Label><Input value={selectedReport.dealerType} readOnly /></div>
                            <div><Label>Dealer Name</Label><Input value={selectedReport.dealerName || 'N/A'} readOnly /></div>
                            <div><Label>Sub Dealer Name</Label><Input value={selectedReport.subDealerName || 'N/A'} readOnly /></div>
                            <div><Label>Location</Label><Input value={selectedReport.location} readOnly /></div>
                            <div><Label>Latitude</Label><Input value={selectedReport.latitude} readOnly /></div>
                            <div><Label>Longitude</Label><Input value={selectedReport.longitude} readOnly /></div>
                            <div><Label>Visit Type</Label><Input value={selectedReport.visitType} readOnly /></div>
                            <div><Label>Total Potential (₹)</Label><Input value={selectedReport.dealerTotalPotential?.toFixed(2) || 'N/A'} readOnly /></div>
                            <div><Label>Best Potential (₹)</Label><Input value={selectedReport.dealerBestPotential?.toFixed(2) || 'N/A'} readOnly /></div>
                            <div><Label>Brands Selling</Label><Input value={selectedReport.brandSelling.join(', ')} readOnly /></div>
                            <div><Label>Contact Person</Label><Input value={selectedReport.contactPerson || 'N/A'} readOnly /></div>
                            <div><Label>Contact Phone No.</Label><Input value={selectedReport.contactPersonPhoneNo || 'N/A'} readOnly /></div>
                            <div><Label>Today&apos;s Order (MT)</Label><Input value={selectedReport.todayOrderMt?.toFixed(2) || 'N/A'} readOnly /></div>
                            <div><Label>Today&apos;s Collection (₹)</Label><Input value={selectedReport.todayCollectionRupees?.toFixed(2) || 'N/A'} readOnly /></div>
                            <div><Label>Feedbacks</Label><Textarea value={selectedReport.feedbacks} readOnly className="h-16" /></div>
                            <div><Label>Solution by Salesperson</Label><Textarea value={selectedReport.solutionBySalesperson || 'N/A'} readOnly className="h-16" /></div>
                            <div><Label>Remarks</Label><Textarea value={selectedReport.anyRemarks || 'N/A'} readOnly className="h-16" /></div>
                            <div><Label>Check-in Time</Label><Input value={new Date(selectedReport.checkInTime).toLocaleString()} readOnly /></div>
                            <div><Label>Check-out Time</Label><Input value={selectedReport.checkOutTime ? new Date(selectedReport.checkOutTime).toLocaleString() : 'N/A'} readOnly /></div>
                            {selectedReport.inTimeImageUrl && (
                              <div>
                                <Label>Check-in Image</Label>
                                <img src={selectedReport.inTimeImageUrl} alt="Check-in" className="mt-2 w-full h-auto rounded-md" />
                              </div>
                            )}
                             {selectedReport.outTimeImageUrl && (
                              <div>
                                <Label>Check-out Image</Label>
                                <img src={selectedReport.outTimeImageUrl} alt="Check-out" className="mt-2 w-full h-auto rounded-md" />
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

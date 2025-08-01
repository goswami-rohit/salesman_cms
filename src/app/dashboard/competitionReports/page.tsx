// src/app/dashboard/competitionReports/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { UniqueIdentifier } from '@dnd-kit/core';

// Import Shadcn UI components
import { Button } from '@/components/ui/button';
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

// --- 1. Define Zod Schema for Competition Report Data ---
const competitionReportSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>,
  salesmanName: z.string(),
  brandName: z.string(),
  date: z.string(), // YYYY-MM-DD string from backend
  billing: z.string(),
  nod: z.string(),
  retail: z.string(),
  schemesYesNo: z.string(),
  avgSchemeCost: z.number(),
  remarks: z.string().nullable(),
});

// Infer the TypeScript type from the Zod schema
type CompetitionReport = z.infer<typeof competitionReportSchema>;

export default function CompetitionReportsPage() {
  const [reports, setReports] = useState<CompetitionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CompetitionReport | null>(null);
  const router = useRouter();

  // --- Data Fetching Logic ---
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboardPagesAPI/competition-reports");
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
      const data: CompetitionReport[] = await response.json();

      const validatedData = data.map((item) => {
        try {
          return competitionReportSchema.parse(item);
        } catch (e) {
          console.error("Validation error for item:", item, e);
          toast.error("Invalid report data received from server.");
          return null;
        }
      }).filter(Boolean) as CompetitionReport[];

      setReports(validatedData);
      toast.success("Competition reports loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch competition reports:", e);
      setError(e.message || "Failed to fetch reports.");
      if (!['401', '403'].includes(e.message?.split('status: ')[1]?.trim())) {
        toast.error(e.message || "Failed to load competition reports.");
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
      const filename = `competition-report-${reportId}.csv`;
      const downloadUrl = `/api/dashboardPagesAPI/competition-reports?format=${format}&ids=${reportId}`;
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
    toast.info(`Downloading all Competition Reports as ${format.toUpperCase()}...`);
    try {
      const filename = `all-competition-reports-${Date.now()}.csv`;
      const downloadUrl = `/api/dashboardPagesAPI/competition-reports?format=${format}`;
      handleDownload(downloadUrl, filename);
      toast.success("Download started successfully!");
    } catch (e) {
      toast.error("Failed to start download.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewReport = (report: CompetitionReport) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  // --- 2. Define Columns for Competition Report DataTable ---
  const competitionReportColumns: ColumnDef<CompetitionReport>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "brandName", header: "Competitor Brand" },
    { accessorKey: "date", header: "Report Date" },
    { accessorKey: "billing", header: "Billing" },
    { accessorKey: "nod", header: "NOD" },
    { accessorKey: "retail", header: "Retail Channel" },
    { accessorKey: "schemesYesNo", header: "Schemes?" },
    { accessorKey: "avgSchemeCost", header: "Avg Scheme Cost (₹)", cell: ({ row }) => row.original.avgSchemeCost.toFixed(2) },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => (
        <span className="max-w-[250px] truncate block">{row.original.remarks || 'N/A'}</span>
      ),
    },
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
        Loading competition reports...
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
          <h2 className="text-3xl font-bold tracking-tight">Competitor Information Reports</h2>
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
          {reports.length === 0 && !loading && !error ? (
            <div className="text-center text-gray-500 py-8">No competition reports found.</div>
          ) : (
            <DataTableReusable
              columns={competitionReportColumns}
              data={reports}
              reportTitle="Competitor Information Reports"
              filterColumnAccessorKey="salesmanName"
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
              <DialogTitle>Competition Report Details</DialogTitle>
              <DialogDescription>
                Detailed information about the competitor.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              <div><Label htmlFor="salesmanName">Salesman Name</Label><Input id="salesmanName" value={selectedReport.salesmanName} readOnly /></div>
              <div><Label htmlFor="brandName">Competitor Brand</Label><Input id="brandName" value={selectedReport.brandName} readOnly /></div>
              <div><Label htmlFor="date">Report Date</Label><Input id="date" value={selectedReport.date} readOnly /></div>
              <div><Label htmlFor="billing">Billing</Label><Input id="billing" value={selectedReport.billing} readOnly /></div>
              <div><Label htmlFor="nod">NOD</Label><Input id="nod" value={selectedReport.nod} readOnly /></div>
              <div><Label htmlFor="retail">Retail Channel</Label><Input id="retail" value={selectedReport.retail} readOnly /></div>
              <div><Label htmlFor="schemesYesNo">Schemes?</Label><Input id="schemesYesNo" value={selectedReport.schemesYesNo} readOnly /></div>
              <div><Label htmlFor="avgSchemeCost">Avg Scheme Cost (₹)</Label><Input id="avgSchemeCost" value={selectedReport.avgSchemeCost.toFixed(2)} readOnly /></div>
              <div className="col-span-1"><Label htmlFor="remarks">Remarks</Label><Textarea id="remarks" value={selectedReport.remarks || 'N/A'} readOnly className="h-24" /></div>
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

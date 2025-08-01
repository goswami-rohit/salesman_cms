// src/app/dashboard/clientReports/page.tsx
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

// --- 1. Define Zod Schema for Client Report Data ---
const clientReportSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>,
  salesmanName: z.string(),
  dealerType: z.string().nullable(),
  dealerSubDealerName: z.string(),
  location: z.string(),
  typeBestNonBest: z.string(),
  dealerTotalPotential: z.number(),
  dealerBestPotential: z.number(),
  brandSelling: z.string().nullable(),
  contactPerson: z.string().nullable(),
  contactPersonPhoneNo: z.string().nullable(),
  todayOrderMT: z.number(),
  todayCollection: z.number(),
  feedbacks: z.string().nullable(),
  solutionsAsPerSalesperson: z.string().nullable(),
  anyRemarks: z.string().nullable(),
  checkOutTime: z.string(), // ISO string from backend
});

// Infer the TypeScript type from the Zod schema
type ClientReport = z.infer<typeof clientReportSchema>;

export default function ClientReportsPage() {
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ClientReport | null>(null);
  const router = useRouter();

  // --- Data Fetching Logic ---
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboardPagesAPI/client-reports");
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
      const data: ClientReport[] = await response.json();

      const validatedData = data.map((item) => {
        try {
          return clientReportSchema.parse(item);
        } catch (e) {
          console.error("Validation error for item:", item, e);
          toast.error("Invalid report data received from server.");
          return null;
        }
      }).filter(Boolean) as ClientReport[];

      setReports(validatedData);
      toast.success("Client reports loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch client reports:", e);
      setError(e.message || "Failed to fetch reports.");
      if (!['401', '403'].includes(e.message?.split('status: ')[1]?.trim())) {
        toast.error(e.message || "Failed to load client reports.");
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
      const filename = `client-report-${reportId}.csv`;
      const downloadUrl = `/api/dashboardPagesAPI/client-reports?format=${format}&ids=${reportId}`;
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
    toast.info(`Downloading all Client Reports as ${format.toUpperCase()}...`);
    try {
      const filename = `all-client-reports-${Date.now()}.csv`;
      const downloadUrl = `/api/dashboardPagesAPI/client-reports?format=${format}`;
      handleDownload(downloadUrl, filename);
      toast.success("Download started successfully!");
    } catch (e) {
      toast.error("Failed to start download.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewReport = (report: ClientReport) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  // --- 2. Define Columns for Client Report DataTable ---
  const clientReportColumns: ColumnDef<ClientReport>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "dealerType", header: "Dealer Type" },
    { accessorKey: "dealerSubDealerName", header: "Dealer/Sub-Dealer" },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "dealerTotalPotential", header: "Total Potential", cell: ({ row }) => row.original.dealerTotalPotential?.toFixed(2) },
    { accessorKey: "todayOrderMT", header: "Today Order (MT)", cell: ({ row }) => row.original.todayOrderMT?.toFixed(2) },
    { accessorKey: "todayCollection", header: "Today Collection (₹)", cell: ({ row }) => row.original.todayCollection?.toFixed(2) },
    {
      accessorKey: "checkOutTime",
      header: "Check-out Time",
      cell: ({ row }) => new Date(row.original.checkOutTime).toLocaleString()
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
        Loading reports...
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
          <h2 className="text-3xl font-bold tracking-tight">Client Reports</h2>
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          {reports.length === 0 && !loading && !error ? (
            <div className="text-center text-gray-500 py-8">No reports found.</div>
          ) : (
            <DataTableReusable
              columns={clientReportColumns}
              data={reports}
              reportTitle="Client Reports"
              filterColumnAccessorKey="salesmanName"
              onDownloadAll={handleDownloadAll}
              enableRowDragging={false}
            />
          )}
        </div>
      </div>

      {selectedReport && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Client Report Details</DialogTitle>
              <DialogDescription>
                Detailed information about the client visit.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div><Label htmlFor="salesmanName">Salesman Name</Label><Input id="salesmanName" value={selectedReport.salesmanName} readOnly /></div>
              <div><Label htmlFor="dealerType">Dealer Type</Label><Input id="dealerType" value={selectedReport.dealerType || 'N/A'} readOnly /></div>
              <div><Label htmlFor="dealerSubDealerName">Dealer/Sub-Dealer Name</Label><Input id="dealerSubDealerName" value={selectedReport.dealerSubDealerName} readOnly /></div>
              <div><Label htmlFor="location">Location</Label><Input id="location" value={selectedReport.location} readOnly /></div>
              <div><Label htmlFor="typeBestNonBest">Best/Non-Best Type</Label><Input id="typeBestNonBest" value={selectedReport.typeBestNonBest} readOnly /></div>
              <div><Label htmlFor="dealerTotalPotential">Dealer Total Potential</Label><Input id="dealerTotalPotential" value={selectedReport.dealerTotalPotential.toFixed(2)} readOnly /></div>
              <div><Label htmlFor="dealerBestPotential">Dealer Best Potential</Label><Input id="dealerBestPotential" value={selectedReport.dealerBestPotential.toFixed(2)} readOnly /></div>
              <div><Label htmlFor="brandSelling">Brands Selling</Label><Input id="brandSelling" value={selectedReport.brandSelling || 'N/A'} readOnly /></div>
              <div><Label htmlFor="contactPerson">Contact Person</Label><Input id="contactPerson" value={selectedReport.contactPerson || 'N/A'} readOnly /></div>
              <div><Label htmlFor="contactPersonPhoneNo">Contact Person Phone No.</Label><Input id="contactPersonPhoneNo" value={selectedReport.contactPersonPhoneNo || 'N/A'} readOnly /></div>
              <div><Label htmlFor="todayOrderMT">Today's Order (MT)</Label><Input id="todayOrderMT" value={selectedReport.todayOrderMT.toFixed(2)} readOnly /></div>
              <div><Label htmlFor="todayCollection">Today's Collection (₹)</Label><Input id="todayCollection" value={selectedReport.todayCollection.toFixed(2)} readOnly /></div>
              <div><Label htmlFor="checkOutTime">Check-out Time</Label><Input id="checkOutTime" value={new Date(selectedReport.checkOutTime).toLocaleString()} readOnly /></div>
              <div className="md:col-span-2"><Label htmlFor="feedbacks">Feedbacks</Label><Textarea id="feedbacks" value={selectedReport.feedbacks || 'N/A'} readOnly className="h-24" /></div>
              <div className="md:col-span-2"><Label htmlFor="solutionsAsPerSalesperson">Solutions As Per Salesperson</Label><Textarea id="solutionsAsPerSalesperson" value={selectedReport.solutionsAsPerSalesperson || 'N/A'} readOnly className="h-24" /></div>
              <div className="md:col-span-2"><Label htmlFor="anyRemarks">Any Remarks</Label><Textarea id="anyRemarks" value={selectedReport.anyRemarks || 'N/A'} readOnly className="h-24" /></div>
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

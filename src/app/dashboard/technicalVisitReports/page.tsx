// src/app/dashboard/technicalVisitReports/page.tsx
'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { UniqueIdentifier } from '@dnd-kit/core';

// Import your Shadcn UI components
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconDownload, IconLoader2 } from '@tabler/icons-react';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Technical Visit Report Data ---
const technicalVisitReportSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>,
  salesmanName: z.string(),
  visitType: z.string(),
  siteNameConcernedPerson: z.string(),
  phoneNo: z.string(),
  date: z.string(),
  emailId: z.string().email().or(z.literal('')),
  clientsRemarks: z.string(),
  salespersonRemarks: z.string(),
  checkInTime: z.string(),
  checkOutTime: z.string(),
});

// Infer the TypeScript type from the Zod schema
type TechnicalVisitReport = z.infer<typeof technicalVisitReportSchema>;

export default function TechnicalVisitReportsPage() {
  const [technicalReports, setTechnicalReports] = React.useState<TechnicalVisitReport[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // --- Data Fetching Function ---
  const fetchTechnicalReports = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboardPagesAPI/technical-visit-reports');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: TechnicalVisitReport[] = await response.json();
      setTechnicalReports(data);
      toast.success("Technical visit reports loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch technical visit reports:", e);
      setError(e.message || "Failed to fetch technical visit reports.");
      toast.error(e.message || "Failed to load technical visit reports.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTechnicalReports();
  }, [fetchTechnicalReports]);


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
    const filename = `technical-report-${reportId}.csv`;
    const downloadUrl = `/api/dashboardPagesAPI/technical-visit-reports?format=${format}&ids=${reportId}`;
    handleDownload(downloadUrl, filename);
    setIsDownloading(false);
  };

  const handleDownloadAllTechnicalVisitReports = async (format: 'csv' | 'xlsx'): Promise<void> => {
    if (format === 'xlsx') {
      toast.info("XLSX downloading is not yet implemented.");
      return;
    }
    setIsDownloading(true);
    toast.info(`Downloading all Technical Visit Reports as ${format.toUpperCase()}...`);
    const filename = `all-technical-visit-reports-${Date.now()}.csv`;
    const downloadUrl = `/api/dashboardPagesAPI/technical-visit-reports?format=${format}`;
    handleDownload(downloadUrl, filename);
    setIsDownloading(false);
  };

  // --- 3. Define Columns for Technical Visit Report DataTable ---
  const technicalVisitReportColumns: ColumnDef<TechnicalVisitReport>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "visitType", header: "Visit Type" },
    { accessorKey: "siteNameConcernedPerson", header: "Site/Person" },
    { accessorKey: "phoneNo", header: "Phone No." },
    { accessorKey: "date", header: "Visit Date" },
    { accessorKey: "checkInTime", header: "Check-in" },
    { accessorKey: "checkOutTime", header: "Check-out" },
    { accessorKey: "clientsRemarks", header: "Client Remarks",
      cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.clientsRemarks}</span>,
    },
    { accessorKey: "salespersonRemarks", header: "Salesman Remarks",
      cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.salespersonRemarks}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
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
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // --- Loading and Error States ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading technical visit reports...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 min-h-screen pt-10">
        Error: {error}
        <Button onClick={fetchTechnicalReports} className="ml-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Technical Visit Reports</h2>
          <Button
            onClick={() => handleDownloadAllTechnicalVisitReports('csv')}
            className="h-8"
            disabled={isDownloading}
          >
            {isDownloading ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconDownload className="mr-2 h-4 w-4" />}
            Download All
          </Button>
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <DataTableReusable
            columns={technicalVisitReportColumns}
            data={technicalReports}
            reportTitle="Technical Visit Reports"
            filterColumnAccessorKey="siteNameConcernedPerson"
            onDownloadAll={handleDownloadAllTechnicalVisitReports}
            enableRowDragging={false}
          />
        </div>
      </div>
    </div>
  );
}
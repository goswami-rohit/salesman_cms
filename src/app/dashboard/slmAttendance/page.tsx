// src/app/dashboard/slmAttendance/page.tsx
'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { UniqueIdentifier } from '@dnd-kit/core';

// Import your Shadcn UI components
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconCheck, IconX, IconDownload, IconExternalLink, IconLoader2 } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Salesman Attendance Report Data ---
const salesmanAttendanceReportSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>,
  salesmanName: z.string(),
  date: z.string(), // YYYY-MM-DD string
  location: z.string(), // Corresponds to locationName
  inTime: z.string().nullable(),
  outTime: z.string().nullable(),
  inTimeImageCaptured: z.boolean(),
  outTimeImageCaptured: z.boolean(),
  inTimeImageUrl: z.string().optional().nullable(),
  outTimeImageUrl: z.string().optional().nullable(),
  inTimeLatitude: z.number().optional().nullable(),
  inTimeLongitude: z.number().optional().nullable(),
  inTimeAccuracy: z.number().optional().nullable(),
  inTimeSpeed: z.number().optional().nullable(),
  inTimeHeading: z.number().optional().nullable(),
  inTimeAltitude: z.number().optional().nullable(),
  outTimeLatitude: z.number().optional().nullable(),
  outTimeLongitude: z.number().optional().nullable(),
  outTimeAccuracy: z.number().optional().nullable(),
  outTimeSpeed: z.number().optional().nullable(),
  outTimeHeading: z.number().optional().nullable(),
  outTimeAltitude: z.number().optional().nullable(),
});

// Infer the TypeScript type from the Zod schema
type SalesmanAttendanceReport = z.infer<typeof salesmanAttendanceReportSchema>;

export default function SlmAttendancePage() {
  const [attendanceReports, setAttendanceReports] = React.useState<SalesmanAttendanceReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<SalesmanAttendanceReport | null>(null);

  // --- Data Fetching Logic ---
  const fetchAttendanceReports = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboardPagesAPI/salesman-attendance");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SalesmanAttendanceReport[] = await response.json();
      const validatedData = data.map((item) => {
        try {
          return salesmanAttendanceReportSchema.parse(item);
        } catch (e) {
          console.error("Validation error for item:", item, e);
          toast.error("Invalid salesman attendance data received from server.");
          return null;
        }
      }).filter(Boolean) as SalesmanAttendanceReport[];

      setAttendanceReports(validatedData);
      toast.success("Salesman attendance reports loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch salesman attendance reports:", e);
      setError(e.message || "Failed to fetch reports.");
      toast.error(e.message || "Failed to load salesman attendance reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAttendanceReports();
  }, [fetchAttendanceReports]);
  
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
    const filename = `attendance-report-${reportId}.csv`;
    const downloadUrl = `/api/dashboardPagesAPI/salesman-attendance?format=${format}&ids=${reportId}`;
    handleDownload(downloadUrl, filename);
    setIsDownloading(false);
  };

  const handleDownloadAllSalesmanAttendance = async (format: 'csv' | 'xlsx'): Promise<void> => {
    if (format === 'xlsx') {
      toast.info("XLSX downloading is not yet implemented.");
      return;
    }
    setIsDownloading(true);
    toast.info(`Downloading all Salesman Attendance Reports as ${format.toUpperCase()}...`);
    const filename = `all-salesman-attendance-reports-${Date.now()}.csv`;
    const downloadUrl = `/api/dashboardPagesAPI/salesman-attendance?format=${format}`;
    handleDownload(downloadUrl, filename);
    setIsDownloading(false);
  };

  const handleViewReport = (report: SalesmanAttendanceReport) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  // --- 3. Define Columns for Salesman Attendance DataTable ---
  const salesmanAttendanceColumns: ColumnDef<SalesmanAttendanceReport>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "location", header: "Location",
      cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.original.location}</span>,
    },
    { accessorKey: "inTime", header: "In Time" },
    { accessorKey: "outTime", header: "Out Time",
      cell: ({ row }) => (
        <span>{row.original.outTime || "N/A (Still In)"}</span>
      ),
    },
    {
      id: "inTimeImage",
      header: "In Image",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.inTimeImageCaptured ? (
            row.original.inTimeImageUrl ? (
              <a href={row.original.inTimeImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                <IconCheck className="h-4 w-4 text-green-500" /> View <IconExternalLink size={14} />
              </a>
            ) : (
              <span className="flex items-center gap-1"><IconCheck className="h-4 w-4 text-green-500" /> Yes</span>
            )
          ) : (
            <span className="flex items-center gap-1"><IconX className="h-4 w-4 text-red-500" /> No</span>
          )}
        </div>
      ),
    },
    {
      id: "outTimeImage",
      header: "Out Image",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.outTimeImageCaptured ? (
            row.original.outTimeImageUrl ? (
              <a href={row.original.outTimeImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                <IconCheck className="h-4 w-4 text-green-500" /> View <IconExternalLink size={14} />
              </a>
            ) : (
              <span className="flex items-center gap-1"><IconCheck className="h-4 w-4 text-green-500" /> Yes</span>
            )
          ) : (
            <span className="flex items-center gap-1"><IconX className="h-4 w-4 text-red-500" /> No</span>
          )}
        </div>
      ),
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
              <DropdownMenuItem onClick={() => handleViewReport(row.original)}>
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading salesman attendance reports...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 min-h-screen pt-10">
        Error: {error}
        <Button onClick={fetchAttendanceReports} className="ml-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Salesman Attendance Reports</h2>
          <Button
            onClick={() => handleDownloadAllSalesmanAttendance('csv')}
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
            columns={salesmanAttendanceColumns}
            data={attendanceReports}
            reportTitle="Salesman Attendance Reports"
            filterColumnAccessorKey="salesmanName"
            onDownloadAll={handleDownloadAllSalesmanAttendance}
            enableRowDragging={false}
          />
        </div>
      </div>

      {selectedReport && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Salesman Attendance Details</DialogTitle>
              <DialogDescription>
                Detailed information for {selectedReport.salesmanName} on {selectedReport.date}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="salesmanName">Salesman Name</Label>
                <Input id="salesmanName" value={selectedReport.salesmanName} readOnly />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" value={selectedReport.date} readOnly />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="location">Location</Label>
                <Textarea id="location" value={selectedReport.location} readOnly className="h-auto" />
              </div>

              {/* In-Time Details */}
              <div className="md:col-span-2 text-lg font-semibold border-t pt-4 mt-4">In-Time Details</div>
              <div>
                <Label htmlFor="inTime">Time</Label>
                <Input id="inTime" value={selectedReport.inTime || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="inTimeImage">Image Captured</Label>
                <Input id="inTimeImage" value={selectedReport.inTimeImageCaptured ? 'Yes' : 'No'} readOnly />
              </div>
              {selectedReport.inTimeImageUrl && (
                <div className="md:col-span-2">
                  <Label htmlFor="inTimeImageUrl">Image URL</Label>
                  <a href={selectedReport.inTimeImageUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-500 hover:underline break-all">
                    {selectedReport.inTimeImageUrl}
                  </a>
                  <img src={selectedReport.inTimeImageUrl} alt="In Time" className="mt-2 max-w-full h-auto rounded-md border" />
                </div>
              )}
              <div>
                <Label htmlFor="inTimeLatitude">Latitude</Label>
                <Input id="inTimeLatitude" value={selectedReport.inTimeLatitude?.toFixed(7) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="inTimeLongitude">Longitude</Label>
                <Input id="inTimeLongitude" value={selectedReport.inTimeLongitude?.toFixed(7) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="inTimeAccuracy">Accuracy (m)</Label>
                <Input id="inTimeAccuracy" value={selectedReport.inTimeAccuracy?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="inTimeSpeed">Speed (m/s)</Label>
                <Input id="inTimeSpeed" value={selectedReport.inTimeSpeed?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="inTimeHeading">Heading (°)</Label>
                <Input id="inTimeHeading" value={selectedReport.inTimeHeading?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="inTimeAltitude">Altitude (m)</Label>
                <Input id="inTimeAltitude" value={selectedReport.inTimeAltitude?.toFixed(2) || 'N/A'} readOnly />
              </div>

              {/* Out-Time Details */}
              <div className="md:col-span-2 text-lg font-semibold border-t pt-4 mt-4">Out-Time Details</div>
              <div>
                <Label htmlFor="outTime">Time</Label>
                <Input id="outTime" value={selectedReport.outTime || 'N/A (Still In)'} readOnly />
              </div>
              <div>
                <Label htmlFor="outTimeImage">Image Captured</Label>
                <Input id="outTimeImage" value={selectedReport.outTimeImageCaptured ? 'Yes' : 'No'} readOnly />
              </div>
              {selectedReport.outTimeImageUrl && (
                <div className="md:col-span-2">
                  <Label htmlFor="outTimeImageUrl">Image URL</Label>
                  <a href={selectedReport.outTimeImageUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-500 hover:underline break-all">
                    {selectedReport.outTimeImageUrl}
                  </a>
                  <img src={selectedReport.outTimeImageUrl} alt="Out Time" className="mt-2 max-w-full h-auto rounded-md border" />
                </div>
              )}
              <div>
                <Label htmlFor="outTimeLatitude">Latitude</Label>
                <Input id="outTimeLatitude" value={selectedReport.outTimeLatitude?.toFixed(7) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="outTimeLongitude">Longitude</Label>
                <Input id="outTimeLongitude" value={selectedReport.outTimeLongitude?.toFixed(7) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="outTimeAccuracy">Accuracy (m)</Label>
                <Input id="outTimeAccuracy" value={selectedReport.outTimeAccuracy?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="outTimeSpeed">Speed (m/s)</Label>
                <Input id="outTimeSpeed" value={selectedReport.outTimeSpeed?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="outTimeHeading">Heading (°)</Label>
                <Input id="outTimeHeading" value={selectedReport.outTimeHeading?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="outTimeAltitude">Altitude (m)</Label>
                <Input id="outTimeAltitude" value={selectedReport.outTimeAltitude?.toFixed(2) || 'N/A'} readOnly />
              </div>
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
// src/app/dashboard/slmAttendance/page.tsx
'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { UniqueIdentifier } from '@dnd-kit/core';
// Import your Shadcn UI components
import { Button } from '@/components/ui/button';
import { IconCheck, IconX, IconExternalLink, IconCalendar } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
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
import { format, addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';

import { salesmanAttendanceSchema } from '@/app/api/dashboardPagesAPI/slm-attendance/route';

// Infer the TypeScript type from the Zod schema
type SalesmanAttendanceReport = z.infer<typeof salesmanAttendanceSchema>;

const ITEMS_PER_PAGE = 10; // Define items per page for pagination

export default function SlmAttendancePage() {
  const [attendanceReports, setAttendanceReports] = React.useState<SalesmanAttendanceReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<SalesmanAttendanceReport | null>(null);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  // --- Data Fetching Logic ---
  const fetchAttendanceReports = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/slm-attendance`);
      if (dateRange?.from) {
        url.searchParams.append('startDate', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        url.searchParams.append('endDate', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SalesmanAttendanceReport[] = await response.json();
      const validatedData = data.map((item) => {
        try {
          return salesmanAttendanceSchema.parse(item);
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
  }, [dateRange]);

  React.useEffect(() => {
    fetchAttendanceReports();
  }, [fetchAttendanceReports]);

  // --- Filtering and Pagination Logic ---
  const filteredReports = attendanceReports.filter((report) => {
    const matchesSearch =
      report.salesmanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.inTime && report.inTime.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (report.outTime && report.outTime.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedReports = filteredReports.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  React.useEffect(() => {
    // Reset page to 1 when search query changes
    setCurrentPage(1);
  }, [searchQuery]);

  const handleViewReport = (report: SalesmanAttendanceReport) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  // --- 3. Define Columns for Salesman Attendance DataTable ---
  const salesmanAttendanceColumns: ColumnDef<SalesmanAttendanceReport>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
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
    {
      accessorKey: "location", header: "Location",
      cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.original.location}</span>,
    },
    { accessorKey: "inTime", header: "In Time" },
    {
      accessorKey: "outTime", header: "Out Time",
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
  ];

  const handleSalesmanAttendanceOrderChange = (newOrder: SalesmanAttendanceReport[]) => {
    console.log("New salesman attendance report order:", newOrder.map(r => r.id));
  };

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
        </div>

        {/* Search Input */}
        <div className="flex justify-end mb-4">
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <IconCalendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Filter by Date Range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {dateRange && (
            <Button variant="ghost" onClick={() => setDateRange(undefined)}>
              Clear Filter
            </Button>
          )}
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          {paginatedReports.length === 0 && !loading && !error ? (
            <div className="text-center text-gray-500 py-8">No salesman attendance reports found.</div>
          ) : (
            <>
              <DataTableReusable
                columns={salesmanAttendanceColumns}
                data={paginatedReports}
                //filterColumnAccessorKey="salesmanName"              
                enableRowDragging={false}
                onRowOrderChange={handleSalesmanAttendanceOrderChange}
              />
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      aria-disabled={currentPage === 1}
                      tabIndex={currentPage === 1 ? -1 : undefined}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        onClick={() => handlePageChange(index + 1)}
                        isActive={currentPage === index + 1}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      aria-disabled={currentPage === totalPages}
                      tabIndex={currentPage === totalPages ? -1 : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
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
// src/app/dashboard/slmGeotracking/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { UniqueIdentifier } from "@dnd-kit/core";
import { ColumnDef } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical, IconDownload, IconLoader2 } from "@tabler/icons-react";

// Assuming this component exists from previous conversations
import { DataTableReusable } from '@/components/data-table-reusable';

// Zod schema for GeoTracking data based on API response
const geoTrackingSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>, // UUID string
  salesmanName: z.string(),
  employeeId: z.string(),
  workosOrganizationId: z.string(), // WorkOS User ID from route.ts
  latitude: z.number(),
  longitude: z.number(),
  recordedAt: z.string(), // ISO string from backend
  totalDistanceTravelled: z.number(),

  // Optional fields, matching the API route's nullable/null handling
  accuracy: z.number().nullable(),
  speed: z.number().nullable(),
  heading: z.number().nullable(),
  altitude: z.number().nullable(),
  locationType: z.string().nullable(),
  activityType: z.string().nullable(),
  appState: z.string().nullable(),
  batteryLevel: z.number().nullable(),
  isCharging: z.boolean().nullable(),
  networkStatus: z.string().nullable(),
  ipAddress: z.string().nullable(),
  siteName: z.string().nullable(),
  checkInTime: z.string().nullable(),
  checkOutTime: z.string().nullable(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

type GeoTrackingRecord = z.infer<typeof geoTrackingSchema>;

export default function SlmGeoTrackingPage() {
  const [records, setRecords] = useState<GeoTrackingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<GeoTrackingRecord | null>(null);

  const fetchGeoTrackingRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboardPagesAPI/slm-geotracking");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: GeoTrackingRecord[] = await response.json();
      
      const validatedData = data.map((item) => {
        try {
          return geoTrackingSchema.parse(item);
        } catch (e) {
          console.error("Validation error for geo-tracking item:", item, e);
          toast.error("Invalid geo-tracking data received from server.");
          return null;
        }
      }).filter(Boolean) as GeoTrackingRecord[];
      
      setRecords(validatedData);
      toast.success("Geo-tracking records loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch geo-tracking records:", e);
      setError(e.message || "Failed to fetch geo-tracking records.");
      toast.error(e.message || "Failed to load geo-tracking records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGeoTrackingRecords();
  }, [fetchGeoTrackingRecords]);

  // --- Download Handlers ---
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleIndividualDownload = async (recordId: UniqueIdentifier, format: 'csv' | 'xlsx'): Promise<void> => {
    if (format === 'xlsx') {
      toast.info("XLSX downloading is not yet implemented.");
      return;
    }
    setIsDownloading(true);
    toast.info(`Downloading record ${recordId} as ${format.toUpperCase()}...`);
    const filename = `geo-tracking-record-${recordId}.csv`;
    const downloadUrl = `/api/dashboardPagesAPI/slm-geotracking?format=${format}&ids=${recordId}`;
    handleDownload(downloadUrl, filename);
    setIsDownloading(false);
  };

  const handleDownloadAllGeoTrackingRecords = async (format: 'csv' | 'xlsx'): Promise<void> => {
    if (format === 'xlsx') {
      toast.info("XLSX downloading is not yet implemented.");
      return;
    }
    setIsDownloading(true);
    toast.info(`Downloading all Geo-Tracking Records as ${format.toUpperCase()}...`);
    const filename = `all-geo-tracking-records-${Date.now()}.csv`;
    const downloadUrl = `/api/dashboardPagesAPI/slm-geotracking?format=${format}`;
    handleDownload(downloadUrl, filename);
    setIsDownloading(false);
  };

  const handleViewRecord = (record: GeoTrackingRecord) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  // --- Column Definitions for DataTableReusable ---
  const geoTrackingColumns: ColumnDef<GeoTrackingRecord>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "employeeId", header: "Employee ID" },
    {
      accessorKey: "recordedAt",
      header: "Recorded At",
      cell: ({ row }) => new Date(row.original.recordedAt).toLocaleString(),
    },
    {
      accessorKey: "latitude",
      header: "Latitude",
      cell: ({ row }) => row.original.latitude.toFixed(5),
    },
    {
      accessorKey: "longitude",
      header: "Longitude",
      cell: ({ row }) => row.original.longitude.toFixed(5),
    },
    {
      accessorKey: "totalDistanceTravelled",
      header: "Total Distance (KM)",
      cell: ({ row }) => row.original.totalDistanceTravelled.toFixed(3),
    },
    { accessorKey: "activityType", header: "Activity Type" },
    { accessorKey: "locationType", header: "Location Type" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleViewRecord(record)}>
              View
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <IconDotsVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
                <DropdownMenuItem onClick={() => handleIndividualDownload(record.id, 'csv')}>
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleIndividualDownload(record.id, 'xlsx')}>
                  Download XLSX
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading geo-tracking records...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 min-h-screen pt-10">
        Error: {error}
        <Button onClick={fetchGeoTrackingRecords} className="ml-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Salesman Geo-Tracking</h2>
          <Button
            onClick={() => handleDownloadAllGeoTrackingRecords('csv')}
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
            columns={geoTrackingColumns}
            data={records}
            reportTitle="Salesman Geo-Tracking"
            filterColumnAccessorKey="salesmanName"
            onDownloadAll={handleDownloadAllGeoTrackingRecords}
            enableRowDragging={false}
          />
        </div>
      </div>
      
      {selectedRecord && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Geo-Tracking Record Details</DialogTitle>
              <DialogDescription>
                Detailed information about the salesman's geo-tracking event.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="salesmanName">Salesman Name</Label>
                <Input id="salesmanName" value={selectedRecord.salesmanName} readOnly />
              </div>
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input id="employeeId" value={selectedRecord.employeeId} readOnly />
              </div>
              <div>
                <Label htmlFor="recordedAt">Recorded At</Label>
                <Input id="recordedAt" value={new Date(selectedRecord.recordedAt).toLocaleString()} readOnly />
              </div>
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" value={selectedRecord.latitude.toFixed(7)} readOnly />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" value={selectedRecord.longitude.toFixed(7)} readOnly />
              </div>
              <div>
                <Label htmlFor="totalDistanceTravelled">Total Distance Travelled (KM)</Label>
                <Input id="totalDistanceTravelled" value={selectedRecord.totalDistanceTravelled.toFixed(3)} readOnly />
              </div>
              <div>
                <Label htmlFor="accuracy">Accuracy (m)</Label>
                <Input id="accuracy" value={selectedRecord.accuracy?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="speed">Speed (m/s)</Label>
                <Input id="speed" value={selectedRecord.speed?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="heading">Heading (degrees)</Label>
                <Input id="heading" value={selectedRecord.heading?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="altitude">Altitude (m)</Label>
                <Input id="altitude" value={selectedRecord.altitude?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="locationType">Location Type</Label>
                <Input id="locationType" value={selectedRecord.locationType || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="activityType">Activity Type</Label>
                <Input id="activityType" value={selectedRecord.activityType || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="appState">App State</Label>
                <Input id="appState" value={selectedRecord.appState || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="batteryLevel">Battery Level (%)</Label>
                <Input id="batteryLevel" value={selectedRecord.batteryLevel?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="isCharging">Is Charging</Label>
                <Input id="isCharging" value={selectedRecord.isCharging !== null ? (selectedRecord.isCharging ? 'Yes' : 'No') : 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="networkStatus">Network Status</Label>
                <Input id="networkStatus" value={selectedRecord.networkStatus || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input id="ipAddress" value={selectedRecord.ipAddress || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input id="siteName" value={selectedRecord.siteName || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="checkInTime">Check-in Time</Label>
                <Input id="checkInTime" value={selectedRecord.checkInTime ? new Date(selectedRecord.checkInTime).toLocaleString() : 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="checkOutTime">Check-out Time</Label>
                <Input id="checkOutTime" value={selectedRecord.checkOutTime ? new Date(selectedRecord.checkOutTime).toLocaleString() : 'N/A'} readOnly />
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
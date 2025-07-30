// src/app/dashboard/slmGeotracking/page.tsx
"use client";

// import { getTokenClaims } from '@workos-inc/authkit-nextjs';
// import { redirect } from 'next/navigation';
import React, { useState, useEffect, useCallback } from "react";
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
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
//import { Textarea } from "@/components/ui/textarea"; // Although GeoTracking doesn't have textareas, keeping for consistency

// Zod schema for GeoTracking data based on API response
const geoTrackingSchema = z.object({
  id: z.string(), // UUID string
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

const ITEMS_PER_PAGE = 10; // Number of items to display per page

export default function SlmGeoTrackingPage() {
  const [records, setRecords] = useState<GeoTrackingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActivityType, setFilterActivityType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<GeoTrackingRecord | null>(null);

  // React.useEffect(() => {
  //     async function checkAuth() {
  //       const claims = await getTokenClaims();
  //       if (!claims || !claims.sub) {
  //         redirect('/login');
  //       }
  //       if (!claims.org_id) {
  //         redirect('/dashboard');
  //       }
  //     }
  //     checkAuth();
  //   }, []);
    
  const fetchGeoTrackingRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboardPagesAPI/slm-geotracking");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: GeoTrackingRecord[] = await response.json();
      
      // Validate each item against the schema for robust client-side data handling
      const validatedData = data.map((item) => {
        try {
          return geoTrackingSchema.parse(item);
        } catch (e) {
          console.error("Validation error for geo-tracking item:", item, e);
          toast.error("Invalid geo-tracking data received from server.");
          return null; // Filter out invalid items or handle them
        }
      }).filter(Boolean) as GeoTrackingRecord[]; // Remove any nulls resulting from validation failures
      
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

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.salesmanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.locationType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.siteName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterActivityType === "all" || 
      (record.activityType && record.activityType.toLowerCase() === filterActivityType);

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentRecords = filteredRecords.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleViewRecord = (record: GeoTrackingRecord) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Salesman Geo-Tracking</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by salesman name, employee ID, location type, site name, IP address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow"
        />
        <Select value={filterActivityType} onValueChange={setFilterActivityType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Activity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="still">Still</SelectItem>
            <SelectItem value="in_vehicle">In Vehicle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center text-gray-500">No geo-tracking records found matching your criteria.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Recorded At</TableHead>
                  <TableHead>Latitude</TableHead>
                  <TableHead>Longitude</TableHead>
                  <TableHead>Total Distance (KM)</TableHead>
                  <TableHead>Activity Type</TableHead>
                  <TableHead>Location Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.salesmanName}
                    </TableCell>
                    <TableCell>{record.employeeId}</TableCell>
                    <TableCell>
                      {new Date(record.recordedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{record.latitude.toFixed(5)}</TableCell>
                    <TableCell>{record.longitude.toFixed(5)}</TableCell>
                    <TableCell>{record.totalDistanceTravelled.toFixed(3)}</TableCell>
                    <TableCell>{record.activityType || 'N/A'}</TableCell>
                    <TableCell>{record.locationType || 'N/A'}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewRecord(record)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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
// src/app/dashboard/slmGeotracking/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import { DataTableReusable } from '@/components/data-table-reusable';

// Updated schema to match the data structure from the API
const geoTrackSchema = z.object({
  id: z.string(),
  salesmanName: z.string(),
  totalDistanceTravelled: z.number(), // Corrected from totalDistanceKm
  checkInTime: z.string(),
  checkOutTime: z.string().nullable(),
});

// Define a type for the transformed data that we will use in the table
type GeoTrack = z.infer<typeof geoTrackSchema>;
type DisplayGeoTrack = GeoTrack & { trackDate: string };

const ITEMS_PER_PAGE = 10;

export default function SalesmanGeoTrackingPage() {
  const [tracks, setTracks] = useState<DisplayGeoTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format ISO date strings
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboardPagesAPI/slm-geotracking');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const rawData = await res.json();

      const validatedData = rawData
        .map((item: unknown) => {
          try {
            return geoTrackSchema.parse(item);
          } catch (e) {
            console.error('Data validation failed for item:', item, 'ZodError', e);
            return null;
          }
        })
        .filter((item: GeoTrack | null): item is GeoTrack => item !== null)
        .map((item: GeoTrack) => ({
          ...item,
          trackDate: formatDate(item.checkInTime), // Create a display-friendly date field
        }));

      setTracks(validatedData);
      toast.success('Geo-tracking reports loaded successfully.');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`Failed to fetch geo-tracking reports: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const filteredTracks = tracks.filter(track =>
    track.salesmanName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTracks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTracks = filteredTracks.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const columns: ColumnDef<DisplayGeoTrack>[] = [
    {
      accessorKey: 'salesmanName',
      header: 'Salesman',
    },
    {
      accessorKey: 'trackDate',
      header: 'Date',
    },
    {
      accessorKey: 'totalDistanceTravelled', // Updated accessor key
      header: 'Total Distance (km)',
      cell: ({ row }) => `${row.original.totalDistanceTravelled.toFixed(2)} km`,
    },
    {
      accessorKey: 'checkInTime',
      header: 'Check-in Time',
      cell: ({ row }) => formatTime(row.original.checkInTime),
    },
    {
      accessorKey: 'checkOutTime',
      header: 'Check-out Time',
      cell: ({ row }) => (row.original.checkOutTime ? formatTime(row.original.checkOutTime) : 'N/A'),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Salesman Geo-Tracking</h1>
        <div className="flex justify-between items-center">
          <Input
            placeholder="Search by Salesman Name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on new search
            }}
            className="max-w-sm"
          />
        </div>
        <div>
          {loading ? (
            <div className="text-center py-8">Loading geo-tracking reports...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">Error: {error}</div>
          ) : filteredTracks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No geotracking reports found.</div>
          ) : (
            <>
              <DataTableReusable
                columns={columns}
                data={currentTracks}
                //reportTitle="GeoTracking Reports"
                //filterColumnAccessorKey="salesmanName"
                //onDownloadAll={dummyDownloadFunction}
                enableRowDragging={false}
                onRowOrderChange={() => {}}
              />

              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
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
                    <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

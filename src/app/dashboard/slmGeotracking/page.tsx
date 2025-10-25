// src/app/dashboard/slmGeotracking/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import { DataTableReusable } from '@/components/data-table-reusable';
import { geoTrackingSchema } from '@/app/api/dashboardPagesAPI/slm-geotracking/route';

// Define a type for the transformed data that we will use in the table
type GeoTrack = z.infer<typeof geoTrackingSchema>;
type DisplayGeoTrack = GeoTrack & { displayDate: string; displayCheckInTime: string; displayCheckOutTime: string };

const ITEMS_PER_PAGE = 10;

export default function SalesmanGeoTrackingPage() {
  const [tracks, setTracks] = useState<DisplayGeoTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  const apiURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/slm-geotracking`
  const fetchTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiURI);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const rawData = await res.json();

      const validatedData = rawData
        .map((item: unknown) => {
          try {
            return geoTrackingSchema.parse(item);
          } catch (e) {
            console.error('Data validation failed for item:', item, 'ZodError', e);
            return null;
          }
        })
        .filter((item: GeoTrack | null): item is GeoTrack => item !== null)
        .map((item: GeoTrack) => ({
          ...item,
          displayDate: formatDate(item.recordedAt),
          displayCheckInTime: formatTime(item.checkInTime),
          displayCheckOutTime: formatTime(item.checkOutTime),
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

  const filteredTracks = tracks.filter(track => {
    const salesmanName = track.salesmanName || '';
    const journeyId = track.journeyId || '';
    const siteName = track.siteName || '';

    return (
      salesmanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journeyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      siteName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
      cell: ({ row }) => row.original.salesmanName ?? 'N/A',
    },
    {
      accessorKey: 'displayDate',
      header: 'Date',
    },
    {
      accessorKey: 'siteName',
      header: 'Site Name',
      cell: ({ row }) => row.original.siteName ?? 'N/A',
    },
    {
      accessorKey: 'checkInTime',
      header: 'Check-in Time',
      cell: ({ row }) => row.original.displayCheckInTime,
    },
    {
      accessorKey: 'checkOutTime',
      header: 'Check-out Time',
      cell: ({ row }) => row.original.displayCheckOutTime,
    },
    {
      accessorKey: 'totalDistanceTravelled',
      header: 'Distance (km)',
      cell: ({ row }) => (row.original.totalDistanceTravelled ? `${row.original.totalDistanceTravelled.toFixed(2)} km` : 'N/A'),
    },
    {
      accessorKey: 'locationType',
      header: 'Location Type',
      cell: ({ row }) => row.original.locationType ?? 'N/A',
    },
    {
      accessorKey: 'appState',
      header: 'App State',
      cell: ({ row }) => row.original.appState ?? 'N/A'
    },
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ row }) => (row.original.isActive ? 'Yes' : 'No'),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Salesman Geo-Tracking</h1>
        <div className="flex justify-between items-center">
          <Input
            placeholder="Search by Salesman, Journey ID, or Site..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
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
                enableRowDragging={false}
                onRowOrderChange={() => { }}
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

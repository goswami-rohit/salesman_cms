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

// Define a more comprehensive and flexible Zod schema
const geoTrackSchema = z.object({
  id: z.string(),
  salesmanName: z.string().nullable(),
  trackDate: z.string(),
  totalDistanceKm: z.number().nullable(),
  checkInTime: z.string(),
  checkOutTime: z.string().nullable(),
  // Add other potential fields from the API to be more robust
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  recordedAt: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
  // and so on...
});

type GeoTrack = z.infer<typeof geoTrackSchema>;
const ITEMS_PER_PAGE = 10;

export default function SalesmanGeoTrackingPage() {
  const [tracks, setTracks] = useState<GeoTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/slm-geotracking`
  const fetchTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching geo-tracking data from API...');
      const res = await fetch(apiURI);

      if (!res.ok) {
        console.error('Fetch failed with status:', res.status);
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data = await res.json();
      console.log('Raw API response data:', data);

      if (!Array.isArray(data)) {
        throw new Error('API response is not an array.');
      }

      const validated = data.map((item: any) => {
        try {
          return geoTrackSchema.parse(item);
        } catch (err) {
          console.error('Data validation failed for item:', item, err);
          toast.error('Invalid geotracking data received');
          return null;
        }
      }).filter(Boolean) as GeoTrack[];

      console.log('Validated data after Zod parsing:', validated);

      setTracks(validated);
      toast.success('GeoTracking data loaded');
    } catch (err: any) {
      console.error('Error in fetchTracks:', err);
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const filteredTracks = tracks.filter((track) =>
    track.salesmanName && track.salesmanName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTracks.length / ITEMS_PER_PAGE);
  const currentTracks = filteredTracks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const columns: ColumnDef<GeoTrack>[] = [
    { accessorKey: 'salesmanName', header: 'Salesman Name' },
    { accessorKey: 'trackDate', header: 'Track Date' },
    { accessorKey: 'totalDistanceKm', header: 'Total Distance (km)' },
    { accessorKey: 'checkInTime', header: 'Check-in Time' },
    { accessorKey: 'checkOutTime', header: 'Check-out Time' },
  ];

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading geotracking data...</div>;

  if (error) return (
    <div className="text-center text-red-500 min-h-screen pt-10">
      Error: {error}
      <Button onClick={fetchTracks} className="ml-4">Retry</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Salesman GeoTracking</h2>
        </div>
        <div className="flex justify-end mb-4">
          <Input
            placeholder="Search by salesman name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          {filteredTracks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No geotracking reports found.</div>
          ) : (
            <>
              <DataTableReusable
                columns={columns}
                data={currentTracks}
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

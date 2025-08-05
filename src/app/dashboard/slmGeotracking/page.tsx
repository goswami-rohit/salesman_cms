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

const geoTrackSchema = z.object({
  id: z.string(),
  salesmanName: z.string(),
  trackDate: z.string(),
  totalDistanceKm: z.number(),
  checkInTime: z.string(),
  checkOutTime: z.string().nullable(),
});

type GeoTrack = z.infer<typeof geoTrackSchema>;
const ITEMS_PER_PAGE = 10;

export default function SalesmanGeoTrackingPage() {
  const [tracks, setTracks] = useState<GeoTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboardPagesAPI/slm-geotracking');
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const data = await res.json();
      const validated = data.map((item: any) => {
        try {
          return geoTrackSchema.parse(item);
        } catch (err) {
          toast.error('Invalid geotracking data received');
          return null;
        }
      }).filter(Boolean) as GeoTrack[];

      setTracks(validated);
      toast.success('GeoTracking data loaded');
    } catch (err: any) {
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
    track.salesmanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.trackDate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTracks.length / ITEMS_PER_PAGE);
  const currentTracks = filteredTracks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // const dummyDownloadFunction = async (format: 'csv' | 'xlsx') => {
  //   console.log(`Download requested for ${format}`);
  // };

  const columns: ColumnDef<GeoTrack>[] = [
    { accessorKey: 'salesmanName', header: 'Salesman' },
    { accessorKey: 'trackDate', header: 'Date' },
    { accessorKey: 'totalDistanceKm', header: 'Distance (km)' },
    { accessorKey: 'checkInTime', header: 'Check In' },
    { accessorKey: 'checkOutTime', header: 'Check Out' },
  ];

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading GeoTracking reports...</div>;

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
            placeholder="Search reports..."
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

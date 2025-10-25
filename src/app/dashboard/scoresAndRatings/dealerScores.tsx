// app/dashboard/scoresAndRatings/dealerScores.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';

import { DataTableReusable } from '@/components/data-table-reusable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dealerScoreSchema } from '@/app/api/dashboardPagesAPI/scores-ratings/route';

// Infer the TypeScript type from the Zod schema
type DealerScore = z.infer<typeof dealerScoreSchema>;

// Column helper to define the columns for the data table
const columnHelper = createColumnHelper<DealerScore>();

const columns: ColumnDef<DealerScore, any>[] = [
  // Define columns for the table, including headers and cell rendering
  columnHelper.accessor('dealerName', {
    header: 'Dealer Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('dealerScore', {
    header: 'Overall Score',
    cell: (info) => info.getValue().toFixed(2),
  }),
  columnHelper.accessor('trustWorthinessScore', {
    header: 'Trust Score',
    cell: (info) => info.getValue().toFixed(2),
  }),
  columnHelper.accessor('creditWorthinessScore', {
    header: 'Credit Score',
    cell: (info) => info.getValue().toFixed(2),
  }),
  columnHelper.accessor('orderHistoryScore', {
    header: 'Order History Score',
    cell: (info) => info.getValue().toFixed(2),
  }),
  columnHelper.accessor('visitFrequencyScore', {
    header: 'Visit Frequency Score',
    cell: (info) => info.getValue().toFixed(2),
  }),
  columnHelper.accessor('lastUpdatedDate', {
    header: 'Last Updated',
    cell: (info) => info.getValue(),
  }),
];

export default function DealerScores() {
  const [data, setData] = useState<DealerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // useEffect to fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/scores-ratings?type=dealer`);
        if (!response.ok) {
          throw new Error('Failed to fetch dealer scores');
        }
        const rawData = await response.json();
        // Validate the fetched data using the Zod schema
        const validatedData = z.array(dealerScoreSchema).parse(rawData);
        setData(validatedData);
      } catch (err: any) {
        setError(err.message);
        toast.error('Failed to load dealer scores.');
        console.error('Fetching error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentScores = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dealer Scores</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            Loading...
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-8">
            <p>Error: {error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-500 p-8">No dealer scores found.</div>
        ) : (
          <>
            <DataTableReusable
              columns={columns}
              data={currentScores}
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
      </CardContent>
    </Card>
  );
}

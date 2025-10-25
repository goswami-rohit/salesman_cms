// app/dashboard/scoresAndRatings/salesmanRatings.tsx
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
import { salesmanRatingSchema } from '@/app/api/dashboardPagesAPI/scores-ratings/route';

// Infer the TypeScript type from the Zod schema
type SalesmanRating = z.infer<typeof salesmanRatingSchema>;

// Column helper to define the columns for the data table
const columnHelper = createColumnHelper<SalesmanRating>();

const columns: ColumnDef<SalesmanRating, any>[] = [
  // Define columns for the table, including headers and cell rendering
  columnHelper.accessor('salesPersonName', {
    header: 'Sales Person Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('area', {
    header: 'Area',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('region', {
    header: 'Region',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('rating', {
    header: 'Rating',
    cell: (info) => {
      const rating = info.getValue();
      const ratingClass = rating >= 4 ? 'bg-green-500' : rating === 3 ? 'bg-yellow-500' : 'bg-red-500';
      const ratingText = rating >= 4 ? 'BEST' : rating === 3 ? 'FAIR' : 'ALARMING';
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${ratingClass}`}>
          {ratingText}
        </span>
      );
    },
  }),
];

export default function SalesmanRatings() {
  const [data, setData] = useState<SalesmanRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // useEffect to fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/scores-ratings?type=salesman`);
        if (!response.ok) {
          throw new Error('Failed to fetch salesman ratings');
        }
        const rawData = await response.json();
        // Validate the fetched data using the Zod schema
        const validatedData = z.array(salesmanRatingSchema).parse(rawData);
        setData(validatedData);
      } catch (err: any) {
        setError(err.message);
        toast.error('Failed to load salesman ratings.');
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
  const currentRatings = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Salesman Ratings</CardTitle>
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
          <div className="text-center text-gray-500 p-8">
            No salesman ratings found.
          </div>
        ) : (
          <>
            <DataTableReusable
              columns={columns}
              data={currentRatings}
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

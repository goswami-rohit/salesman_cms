// src/app/dashboard/dealerDevelopmentAndMappingReports/dealerBrandMapping.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import { DataTableReusable } from '@/components/data-table-reusable';

// Define a type for the dealer brand mapping data, including a record for dynamic brand columns.
type DealerBrandMappingData = {
  id: string;
  dealerName: string;
  area: string;
  totalPotential: number;
} & Record<string, number>; // Dynamic keys for brand names with number values

const columnHelper = createColumnHelper<DealerBrandMappingData>();

/**
 * A React component that fetches and displays dealer brand mapping reports.
 * It uses a reusable data table component and handles dynamic column generation
 * based on the brands returned from the API.
 */
export default function DealerBrandMappingPage() {
  const [data, setData] = useState<DealerBrandMappingData[]>([]);
  const [columns, setColumns] = useState<ColumnDef<DealerBrandMappingData, any>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Use useCallback to memoize the fetch logic and prevent unnecessary re-creations.
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/dealer-brand-mapping`);
      if (!response.ok) {
        throw new Error('Failed to fetch brand mapping data');
      }
      const fetchedData = await response.json();

      if (!fetchedData || fetchedData.length === 0) {
        setLoading(false);
        setData([]);
        setColumns([]);
        return;
      }

      // Dynamically generate columns based on the keys of the first data object.
      // Filter out the static keys to get only the brand names.
      const staticKeys = ['id', 'dealerName', 'area', 'totalPotential'];
      const brandNames = Object.keys(fetchedData[0]).filter(
        (key) => !staticKeys.includes(key)
      );

      // Create static columns
      const staticColumns: ColumnDef<DealerBrandMappingData, any>[] = [
        columnHelper.accessor('dealerName', {
          header: 'Dealer Name',
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('area', {
          header: 'Area',
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('totalPotential', {
          header: 'Total Potential (MT)',
          cell: (info) => info.getValue(),
        }),
      ];

      // Create dynamic columns for each brand
      const dynamicColumns: ColumnDef<DealerBrandMappingData, any>[] = brandNames.map(
        (brand) =>
          columnHelper.accessor(brand as keyof DealerBrandMappingData, {
            header: `${brand} (MT)`,
            cell: (info) => info.getValue(),
          })
      );

      // Set the columns and data states
      setColumns([...staticColumns, ...dynamicColumns]);
      setData(fetchedData);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch the data on component mount.
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Pagination logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReports = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col p-6">
      <div className="flex-1 space-y-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <p className="text-gray-500">Loading reports...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-10 text-red-600">
              <p>{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No dealer brand mapping reports found.
            </div>
          ) : (
            <>
              <DataTableReusable
                columns={columns}
                data={currentReports}
                // We are not using row dragging for this report
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

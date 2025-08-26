// app/dashboard/salesAndCollectionReports/collectionReports.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import { DataTableReusable } from '@/components/data-table-reusable';

// Define Zod schema for the data returned by this API
// This is the schema for the CollectionReport data you provided.
const collectionReportSchema = z.object({
  id: z.string(),
  dvrId: z.string(),
  collectedAmount: z.number(),
  collectedOnDate: z.string().date(), // YYYY-MM-DD string
  weeklyTarget: z.number().nullable(),
  tillDateAchievement: z.number().nullable(),
  yesterdayTarget: z.number().nullable(),
  yesterdayAchievement: z.number().nullable(),
  salesPersonName: z.string(),
  dealerName: z.string(),
});
type CollectionReport = z.infer<typeof collectionReportSchema>;

// Column definitions for the collection report table
const columnHelper = createColumnHelper<CollectionReport>();

const collectionReportColumns: ColumnDef<CollectionReport, any>[] = [
  columnHelper.accessor('salesPersonName', {
    header: 'Sales Person',
    cell: (info) => info.getValue(),
    meta: {
      filterType: 'search',
    },
  }),
  columnHelper.accessor('dealerName', {
    header: 'Dealer Name',
    cell: (info) => info.getValue(),
    meta: {
      filterType: 'search',
    },
  }),
  columnHelper.accessor('collectedOnDate', {
    header: 'Collection Date',
    cell: (info) => info.getValue(),
    meta: {
      filterType: 'date',
    },
  }),
  columnHelper.accessor('collectedAmount', {
    header: 'Amount Collected (₹)',
    cell: (info) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(info.getValue()),
    meta: {
      filterType: 'number',
    },
  }),
  columnHelper.accessor('weeklyTarget', {
    header: 'Weekly Target',
    cell: (info) => info.getValue() !== null ? new Intl.NumberFormat('en-IN').format(info.getValue()) : 'N/A',
  }),
  columnHelper.accessor('tillDateAchievement', {
    header: 'Till Date Achievement',
    cell: (info) => info.getValue() !== null ? new Intl.NumberFormat('en-IN').format(info.getValue()) : 'N/A',
  }),
  columnHelper.accessor('yesterdayTarget', {
    header: 'Yesterday\'s Target',
    cell: (info) => info.getValue() !== null ? new Intl.NumberFormat('en-IN').format(info.getValue()) : 'N/A',
  }),
  columnHelper.accessor('yesterdayAchievement', {
    header: 'Yesterday\'s Achievement',
    cell: (info) => info.getValue() !== null ? new Intl.NumberFormat('en-IN').format(info.getValue()) : 'N/A',
  }),
];

/**
 * Component to display a table of collection reports.
 * Fetches data from the /api/dashboardPagesAPI/collection-reports route.
 */
const CollectionReportsTable = () => {
  const [data, setData] = useState<CollectionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCollectionReports = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/collection-reports`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch collection reports.');
        }
        const reports: CollectionReport[] = await response.json();
        const validatedReports = z.array(collectionReportSchema).parse(reports);
        setData(validatedReports);
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectionReports();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReports = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-gray-500">Loading collection reports...</p>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No collection reports found for your company.
      </div>
    );
  }

  return (
    <>
      <DataTableReusable
        columns={collectionReportColumns}
        data={currentReports}
        // Assuming no row dragging is needed for reports
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
  );
};

export default CollectionReportsTable;

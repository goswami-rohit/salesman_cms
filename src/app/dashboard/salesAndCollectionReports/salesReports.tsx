// app/dashboard/salesAndCollectionReports/salesReports.tsx
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
// This is the schema for the SalesReport data you provided.
const salesReportSchema = z.object({
  id: z.number(),
  date: z.string().date(), // YYYY-MM-DD string
  monthlyTarget: z.number(),
  tillDateAchievement: z.number(),
  yesterdayTarget: z.number().nullable(),
  yesterdayAchievement: z.number().nullable(),
  salesPersonName: z.string(),
  dealerName: z.string(),
});
type SalesReport = z.infer<typeof salesReportSchema>;

// Column definitions for the sales report table
const columnHelper = createColumnHelper<SalesReport>();

const salesReportColumns: ColumnDef<SalesReport, any>[] = [
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
  columnHelper.accessor('date', {
    header: 'Report Date',
    cell: (info) => info.getValue(),
    meta: {
      filterType: 'date',
    },
  }),
  columnHelper.accessor('monthlyTarget', {
    header: 'Monthly Target (MT)',
    cell: (info) => new Intl.NumberFormat('en-IN').format(info.getValue()),
  }),
  columnHelper.accessor('tillDateAchievement', {
    header: 'Till Date Achievement (MT)',
    cell: (info) => new Intl.NumberFormat('en-IN').format(info.getValue()),
  }),
  columnHelper.accessor('yesterdayTarget', {
    header: 'Yesterday\'s Target (MT)',
    cell: (info) => info.getValue() !== null ? new Intl.NumberFormat('en-IN').format(info.getValue()) : 'N/A',
  }),
  columnHelper.accessor('yesterdayAchievement', {
    header: 'Yesterday\'s Achievement (MT)',
    cell: (info) => info.getValue() !== null ? new Intl.NumberFormat('en-IN').format(info.getValue()) : 'N/A',
  }),
];

/**
 * Component to display a table of sales reports.
 * Fetches data from the /api/dashboardPagesAPI/sales-reports route.
 */
const SalesReportsTable = () => {
  const [data, setData] = useState<SalesReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchSalesReports = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/sales-reports`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch sales reports.');
        }
        const reports: SalesReport[] = await response.json();
        const validatedReports = z.array(salesReportSchema).parse(reports);
        setData(validatedReports);
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesReports();
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
        <p className="text-gray-500">Loading sales reports...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No sales reports found for your company.
      </div>
    );
  }

  return (
    <>
      <DataTableReusable
        columns={salesReportColumns}
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

export default SalesReportsTable;

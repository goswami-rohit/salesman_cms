// src/app/dashboard/dealerDevelopmentAndMappingReports/dealerDevelopment.tsx
// This component fetches and displays the Dealer Development Process (DDP) data from the new API route.
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

// Define the Zod schema for the data expected from the API.
// This matches the format returned by the new 'dealer-development-reports' route.
const dealerDevelopmentSchema = z.object({
  id: z.number(),
  salesPersonName: z.string(),
  dealerName: z.string(),
  creationDate: z.string().date(), // YYYY-MM-DD string
  status: z.string(),
  obstacle: z.string().nullable(),
});
type DealerDevelopmentReport = z.infer<typeof dealerDevelopmentSchema>;

// Column definitions for the DDP table. These remain the same.
const columnHelper = createColumnHelper<DealerDevelopmentReport>();

const ddpColumns: ColumnDef<DealerDevelopmentReport, any>[] = [
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
  columnHelper.accessor('creationDate', {
    header: 'Creation Date',
    cell: (info) => info.getValue(),
    meta: {
      filterType: 'date',
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => info.getValue(),
    meta: {
      filterType: 'search',
    },
  }),
  columnHelper.accessor('obstacle', {
    header: 'Obstacle',
    cell: (info) => info.getValue() || 'N/A', // Display 'N/A' if no obstacle
  }),
];

/**
 * Component to display a table of Dealer Development reports.
 * It fetches data from the `/api/dashboardPagesAPI/dealer-development-reports` route.
 */
const DealerDevelopmentPage = () => {
  const [data, setData] = useState<DealerDevelopmentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDDPReports = async () => {
      try {
        // Updated API route to the correct one
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/dealer-development-reports`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch dealer development reports.');
        }
        const reports: DealerDevelopmentReport[] = await response.json();
        const validatedReports = z.array(dealerDevelopmentSchema).parse(reports);
        setData(validatedReports);
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDDPReports();
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
        <p className="text-gray-500">Loading dealer development reports...</p>
      </div>
    );
  }

  // Check if there are no reports to display
  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No dealer development reports found for your company.
      </div>
    );
  }

  return (
    <>
      <DataTableReusable
        columns={ddpColumns}
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

export default DealerDevelopmentPage;

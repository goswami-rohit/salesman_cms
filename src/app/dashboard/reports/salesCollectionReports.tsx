// app/dashboard/salesCollectionReports.tsx
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
import { salesOrderSchema } from '@/app/api/dashboardPagesAPI/reports/sales-orders/route'

type SalesOrder = z.infer<typeof salesOrderSchema>;

// Column definitions for the sales order table
const columnHelper = createColumnHelper<SalesOrder>();

const salesOrderColumns: ColumnDef<SalesOrder, any>[] = [
  columnHelper.accessor('salesmanName', {
    header: 'Salesman',
    cell: (info) => info.getValue(),
    meta: { filterType: 'search' },
  }),
  columnHelper.accessor('salesmanRole', {
    header: 'Role',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('dealerName', {
    header: 'Dealer',
    cell: (info) => info.getValue(),
    meta: { filterType: 'search' },
  }),
  columnHelper.accessor('dealerType', {
    header: 'Dealer Type',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('dealerPhone', {
    header: 'Phone',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('dealerAddress', {
    header: 'Address',
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
  columnHelper.accessor('quantity', {
    header: 'Quantity',
    cell: (info) => `${info.getValue()} ${info.row.original.unit}`,
  }),
  columnHelper.accessor('orderTotal', {
    header: 'Order Total (₹)',
    cell: (info) => new Intl.NumberFormat('en-IN').format(info.getValue()),
  }),
  columnHelper.accessor('advancePayment', {
    header: 'Advance (₹)',
    cell: (info) => new Intl.NumberFormat('en-IN').format(info.getValue()),
  }),
  columnHelper.accessor('pendingPayment', {
    header: 'Pending (₹)',
    cell: (info) => new Intl.NumberFormat('en-IN').format(info.getValue()),
  }),
  columnHelper.accessor('estimatedDelivery', {
    header: 'Delivery ETA',
    cell: (info) => info.getValue(),
    meta: { filterType: 'date' },
  }),
  columnHelper.accessor('remarks', {
    header: 'Remarks',
    cell: (info) => info.getValue() || '-',
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created On',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

// Component
const SalesOrdersTable = () => {
  const [data, setData] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchSalesOrders = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/reports/sales-orders`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch sales orders.');
        }
        const orders: SalesOrder[] = await response.json();
        const validatedOrders = z.array(salesOrderSchema).parse(orders);
        setData(validatedOrders);
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesOrders();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-gray-500">Loading sales orders...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No sales orders found for your company.
      </div>
    );
  }

  return (
    <>
      <DataTableReusable
        columns={salesOrderColumns}
        data={currentOrders}
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

export default SalesOrdersTable;

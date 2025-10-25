// src/app/dashboard/dailyVisitReports.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { UniqueIdentifier } from '@dnd-kit/core';

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
import { dailyVisitReportSchema } from '@/app/api/dashboardPagesAPI/reports/daily-visit-reports/route'

type DailyVisitReport = z.infer<typeof dailyVisitReportSchema>;
const columnHelper = createColumnHelper<DailyVisitReport>();
const ITEMS_PER_PAGE = 10;

export default function DailyVisitReportsPage() {
  const [reports, setReports] = useState<DailyVisitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/reports/daily-visit-reports`);
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('You are not authenticated. Redirecting to login.');
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          toast.error('You do not have permission to access this page. Redirecting.');
          router.push('/dashboard');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DailyVisitReport[] = await response.json();
      const validated = data.map((item) => {
        try {
          return dailyVisitReportSchema.parse(item);
        } catch (e) {
          toast.error('Invalid report data received from server.');
          return null;
        }
      }).filter(Boolean) as DailyVisitReport[];

      setReports(validated);
      toast.success('Daily Visit Reports loaded successfully!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to load daily visit reports.');
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = reports.filter((report) =>
    report.salesmanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.reportDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const currentReports = filteredReports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const dailyVisitReportColumns: ColumnDef<DailyVisitReport, any>[] = [
    columnHelper.accessor('salesmanName', { header: 'Salesman' }),
    columnHelper.accessor('reportDate', { header: 'Date' }),
    columnHelper.accessor('dealerType', { header: 'Dealer Type' }),
    columnHelper.accessor('dealerName', { header: 'Dealer Name', cell: info => info.getValue() || 'N/A' }),
    columnHelper.accessor('subDealerName', { header: 'Sub Dealer Name', cell: info => info.getValue() || 'N/A' }),
    columnHelper.accessor('location', { header: 'Location' }),
    columnHelper.accessor('visitType', { header: 'Visit Type' }),
    columnHelper.accessor('todayOrderMt', { header: 'Order (MT)', cell: info => info.getValue().toFixed(2) }),
    columnHelper.accessor('todayCollectionRupees', { header: 'Collection (₹)', cell: info => info.getValue().toFixed(2) }),
    columnHelper.accessor('overdueAmount', { 
      header: 'Overdue (₹)', 
      cell: info => info.getValue() ? info.getValue().toFixed(2) : '0.00' 
    }),
    columnHelper.accessor('feedbacks', {
      header: 'Feedbacks',
      cell: info => <span className="max-w-[250px] truncate block">{info.getValue()}</span>
    })
  ];

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading daily visit reports...</div>;

  if (error) return (
    <div className="text-center text-red-500 min-h-screen pt-10">
      Error: {error}
      <Button onClick={fetchReports} className="ml-4">Retry</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Daily Visit Reports</h2>
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
          {filteredReports.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No daily visit reports found.</div>
          ) : (
            <>
              <DataTableReusable
                columns={dailyVisitReportColumns}
                data={currentReports}
                //filterColumnAccessorKey="salesmanName"
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

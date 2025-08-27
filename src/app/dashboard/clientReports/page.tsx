// src/app/dashboard/clientReports/page.tsx
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

const clientReportSchema = z.object({
  id: z.string(),
  clientName: z.string(),
  contactPerson: z.string(),
  contactPhone: z.string(),
  location: z.string(),
  remarks: z.string(),
  dateAdded: z.string(),
});

type ClientReport = z.infer<typeof clientReportSchema>;
const ITEMS_PER_PAGE = 10;

export default function ClientReportsPage() {
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/client-reports`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const data = await res.json();
      const validated = data.map((item: any) => {
        try {
          return clientReportSchema.parse(item);
        } catch (err) {
          toast.error('Invalid data received');
          return null;
        }
      }).filter(Boolean) as ClientReport[];

      setReports(validated);
      toast.success('Client Reports loaded');
    } catch (err: any) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = reports.filter((report) =>
    report.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.remarks.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const currentReports = filteredReports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const columns: ColumnDef<ClientReport>[] = [
    { accessorKey: 'clientName', header: 'Client Name' },
    { accessorKey: 'contactPerson', header: 'Contact Person' },
    { accessorKey: 'contactPhone', header: 'Phone' },
    { accessorKey: 'location', header: 'Location' },
    { accessorKey: 'remarks', header: 'Remarks' },
    { accessorKey: 'dateAdded', header: 'Date Added' },
  ];

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading client reports...</div>;

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
          <h2 className="text-3xl font-bold tracking-tight">Client Reports</h2>
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
            <div className="text-center text-gray-500 py-8">No client reports found.</div>
          ) : (
            <>
              <DataTableReusable
                columns={columns}
                data={currentReports}
                //filterColumnAccessorKey="clientName"       
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

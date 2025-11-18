// src/app/dashboard/reports/competitionReports.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';

// Import your Shadcn UI components
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTableReusable } from '@/components/data-table-reusable';
import { competitionReportSchema } from '@/lib/shared-zod-schema'
//import { BASE_URL } from '@/lib/Reusable-constants';

// Infer the TypeScript type from the Zod schema
type CompetitionReport = z.infer<typeof competitionReportSchema>;

export default function CompetitionReportsPage() {
  const [reports, setReports] = useState<CompetitionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CompetitionReport | null>(null);

  // --- Data Fetching Logic ---
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the new, correct API endpoint
      const response = await fetch(`/api/dashboardPagesAPI/reports/competition-reports`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: CompetitionReport[] = await response.json();
      // Validate and ensure the required 'id' property exists for DataTableReusable
      const validatedData = data.map((item) => {
        try {
          const validated = competitionReportSchema.parse(item);
          // Assuming the schema includes an 'id' or we can use a unique field like 'date' + 'salesmanName' as fallback ID
          return { ...validated, id: (validated as any).id?.toString() || `${validated.salesmanName}-${validated.date}` }; 
        } catch (e) {
          console.error("Validation error for item:", item, e);
          toast.error("Invalid report data received from server.");
          return null;
        }
      }).filter(Boolean) as CompetitionReport[]; // Remove nulls
      setReports(validatedData);
      toast.success("Competition reports loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch competition reports:", e);
      setError(e.message || "Failed to fetch reports.");
      toast.error(e.message || "Failed to load competition reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);


  // --- Filtering Logic ---
  const filteredReports = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return reports.filter((report) => {
      const matchesSearch =
        report.salesmanName.toLowerCase().includes(q) ||
        report.brandName.toLowerCase().includes(q) ||
        report.remarks.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [reports, searchQuery]);


  const handleViewReport = (report: CompetitionReport) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  // --- 3. Define Columns for Competition Report DataTable (KEPT) ---
  const competitionReportColumns: ColumnDef<CompetitionReport>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "brandName", header: "Competitor Brand" },
    { accessorKey: "date", header: "Report Date" },
    { accessorKey: "billing", header: "Billing" },
    { accessorKey: "nod", header: "NOD" },
    { accessorKey: "retail", header: "Retail Channel" },
    { accessorKey: "schemesYesNo", header: "Schemes?" },
    { accessorKey: "avgSchemeCost", header: "Avg Scheme Cost (₹)" },
    { accessorKey: "remarks", header: "Remarks",
      cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.original.remarks}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
              <DropdownMenuItem onClick={() => handleViewReport(row.original)}>
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading competition reports...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 min-h-screen pt-10">
        Error: {error}
        <Button onClick={fetchReports} className="ml-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Competitor Information Reports</h2>
        </div>

        {/* Search Input */}
        <div className="flex justify-end mb-4">
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          {filteredReports.length === 0 && !loading && !error ? (
            <div className="text-center text-gray-500 py-8">No competition reports found.</div>
          ) : (
            <>
              <DataTableReusable
                columns={competitionReportColumns}
                data={filteredReports}    
                enableRowDragging={false}               
                onRowOrderChange={() => {}}
              />
            </>
          )}
        </div>
      </div>

      {selectedReport && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Competition Report Details</DialogTitle>
              <DialogDescription>
                Detailed information about the competitor.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              <div>
                <Label htmlFor="salesmanName">Salesman Name</Label>
                <Input id="salesmanName" value={selectedReport.salesmanName} readOnly />
              </div>
              <div>
                <Label htmlFor="brandName">Competitor Brand</Label>
                <Input id="brandName" value={selectedReport.brandName} readOnly />
              </div>
              <div>
                <Label htmlFor="date">Report Date</Label>
                <Input id="date" value={selectedReport.date} readOnly />
              </div>
              <div>
                <Label htmlFor="billing">Billing</Label>
                <Input id="billing" value={selectedReport.billing} readOnly />
              </div>
              <div>
                <Label htmlFor="nod">NOD</Label>
                <Input id="nod" value={selectedReport.nod} readOnly />
              </div>
              <div>
                <Label htmlFor="retail">Retail Channel</Label>
                <Input id="retail" value={selectedReport.retail} readOnly />
              </div>
              <div>
                <Label htmlFor="schemesYesNo">Schemes?</Label>
                <Input id="schemesYesNo" value={selectedReport.schemesYesNo} readOnly />
              </div>
              <div>
                <Label htmlFor="avgSchemeCost">Avg Scheme Cost (₹)</Label>
                {/* Ensure avgSchemeCost is a number before toFixed if necessary, assuming Zod handles this */}
                <Input id="avgSchemeCost" value={selectedReport.avgSchemeCost.toFixed(2)} readOnly />
              </div>
              <div className="col-span-1">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea id="remarks" value={selectedReport.remarks} readOnly className="h-24" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
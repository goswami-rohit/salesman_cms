// src/app/dashboard/permanentJourneyPlan/page.tsx
'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { UniqueIdentifier } from '@dnd-kit/core';

// Import your Shadcn UI components
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconDownload, IconLoader2 } from '@tabler/icons-react';
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

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// --- 1. Define Zod Schema for Permanent Journey Plan Data ---
const permanentJourneyPlanSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>,
  salesmanName: z.string(),
  areaToBeVisited: z.string(),
  date: z.string(), // YYYY-MM-DD string from backend
  description: z.string().optional().nullable(),
});

// Infer the TypeScript type from the Zod schema
type PermanentJourneyPlan = z.infer<typeof permanentJourneyPlanSchema>;

export default function PermanentJourneyPlanPage() {
  const [pjps, setPjps] = React.useState<PermanentJourneyPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [selectedPjp, setSelectedPjp] = React.useState<PermanentJourneyPlan | null>(null);

  // --- Data Fetching Logic ---
  const fetchPjps = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboardPagesAPI/permanent-journey-plan");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: PermanentJourneyPlan[] = await response.json();
      const validatedData = data.map((item) => {
        try {
          return permanentJourneyPlanSchema.parse(item);
        } catch (e) {
          console.error("Validation error for item:", item, e);
          toast.error("Invalid PJP data received from server.");
          return null;
        }
      }).filter(Boolean) as PermanentJourneyPlan[];
      setPjps(validatedData);
      toast.success("Permanent Journey Plans loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch PJPs:", e);
      setError(e.message || "Failed to fetch PJPs.");
      toast.error(e.message || "Failed to load Permanent Journey Plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPjps();
  }, [fetchPjps]);

  // --- Download Handlers ---
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleIndividualDownload = async (pjpId: UniqueIdentifier, format: 'csv' | 'xlsx'): Promise<void> => {
    if (format === 'xlsx') {
      toast.info("XLSX downloading is not yet implemented.");
      return;
    }
    setIsDownloading(true);
    toast.info(`Downloading PJP ${pjpId} as ${format.toUpperCase()}...`);
    const filename = `pjp-${pjpId}.csv`;
    const downloadUrl = `/api/dashboardPagesAPI/permanent-journey-plan?format=${format}&ids=${pjpId}`;
    handleDownload(downloadUrl, filename);
    setIsDownloading(false);
  };

  const handleDownloadAllPermanentJourneyPlans = async (format: 'csv' | 'xlsx'): Promise<void> => {
    if (format === 'xlsx') {
      toast.info("XLSX downloading is not yet implemented.");
      return;
    }
    setIsDownloading(true);
    toast.info(`Downloading all Permanent Journey Plans as ${format.toUpperCase()}...`);
    const filename = `all-permanent-journey-plans-${Date.now()}.csv`;
    const downloadUrl = `/api/dashboardPagesAPI/permanent-journey-plan?format=${format}`;
    handleDownload(downloadUrl, filename);
    setIsDownloading(false);
  };
  
  const handleViewPjp = (pjp: PermanentJourneyPlan) => {
    setSelectedPjp(pjp);
    setIsViewModalOpen(true);
  };

  // --- 3. Define Columns for Permanent Journey Plan DataTable ---
  const permanentJourneyPlanColumns: ColumnDef<PermanentJourneyPlan>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    { accessorKey: "areaToBeVisited", header: "Area to Visit",
      cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.original.areaToBeVisited}</span>,
    },
    { accessorKey: "date", header: "Planned Date" },
    { accessorKey: "description", header: "Description",
      cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.original.description || "N/A"}</span>,
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
              <DropdownMenuItem onClick={() => handleIndividualDownload(row.original.id, 'csv')}>
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleIndividualDownload(row.original.id, 'xlsx')}>
                Download XLSX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewPjp(row.original)}>
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
        Loading Permanent Journey Plans...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 min-h-screen pt-10">
        Error: {error}
        <Button onClick={fetchPjps} className="ml-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Permanent Journey Plans</h2>
          <Button
            onClick={() => handleDownloadAllPermanentJourneyPlans('csv')}
            className="h-8"
            disabled={isDownloading}
          >
            {isDownloading ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconDownload className="mr-2 h-4 w-4" />}
            Download All
          </Button>
        </div>

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <DataTableReusable
            columns={permanentJourneyPlanColumns}
            data={pjps}
            reportTitle="Permanent Journey Plans"
            filterColumnAccessorKey="areaToBeVisited"
            onDownloadAll={handleDownloadAllPermanentJourneyPlans}
            enableRowDragging={false}
          />
        </div>
      </div>

      {selectedPjp && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Permanent Journey Plan Details</DialogTitle>
              <DialogDescription>
                Detailed information about the permanent journey plan.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              <div>
                <Label htmlFor="salesmanName">Salesman Name</Label>
                <Input id="salesmanName" value={selectedPjp.salesmanName} readOnly />
              </div>
              <div>
                <Label htmlFor="areaToBeVisited">Area to Visit</Label>
                <Input id="areaToBeVisited" value={selectedPjp.areaToBeVisited} readOnly />
              </div>
              <div>
                <Label htmlFor="date">Planned Date</Label>
                <Input id="date" value={selectedPjp.date} readOnly />
              </div>
              <div className="col-span-1">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={selectedPjp.description || 'N/A'} readOnly className="h-24" />
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
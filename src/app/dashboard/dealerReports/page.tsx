// src/app/dashboard/dealerReports/page.tsx
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// --- 1. Define Zod Schema for Dealer/Sub-Dealer Report Data ---
const dealerReportSchema = z.object({
  id: z.string() as z.ZodType<UniqueIdentifier>,
  salesmanName: z.string(),
  type: z.enum(["Dealer", "Sub Dealer"]),
  dealerName: z.string().optional().nullable(),
  subDealerName: z.string().optional().nullable(),
  region: z.string(),
  area: z.string(),
  phoneNo: z.string(),
  address: z.string(),
  dealerTotalPotential: z.number().nullable(),
  dealerBestPotential: z.number().nullable(),
  brandSelling: z.array(z.string()),
  feedbacks: z.string(),
  remarks: z.string().optional().nullable(),
});

// Infer the TypeScript type from the Zod schema
type DealerReport = z.infer<typeof dealerReportSchema>;

export default function DealerReportsPage() {
  const [allReports, setAllReports] = React.useState<DealerReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"dealers" | "sub-dealers">("dealers");
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<DealerReport | null>(null);

  // --- Data Fetching Logic ---
  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboardPagesAPI/dealer-reports");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: DealerReport[] = await response.json();
      const validatedData = data.map((item) => {
        try {
          // Coerce nulls from DB to match the schema
          const validatedItem = dealerReportSchema.parse({
            ...item,
            dealerTotalPotential: item.dealerTotalPotential ?? null,
            dealerBestPotential: item.dealerBestPotential ?? null,
          });
          return validatedItem;
        } catch (e) {
          console.error("Validation error for item:", item, e);
          toast.error("Invalid dealer report data received from server.");
          return null;
        }
      }).filter(Boolean) as DealerReport[];
      setAllReports(validatedData);
      toast.success("Dealer reports loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch dealer reports:", e);
      setError(e.message || "Failed to fetch reports.");
      toast.error(e.message || "Failed to load dealer reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // --- Filtering based on active tab ---
  const currentData = activeTab === "dealers"
    ? allReports.filter(report => report.type === 'Dealer')
    : allReports.filter(report => report.type === 'Sub Dealer');

  // --- Download Handlers ---
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleIndividualDownload = async (reportId: UniqueIdentifier, format: 'csv' | 'xlsx'): Promise<void> => {
    if (format === 'xlsx') {
      toast.info("XLSX downloading is not yet implemented.");
      return;
    }
    setIsDownloading(true);
    toast.info(`Downloading report ${reportId} as ${format.toUpperCase()}...`);
    try {
      const filename = `${activeTab === 'dealers' ? 'dealer' : 'sub-dealer'}-report-${reportId}.csv`;
      const downloadUrl = `/api/dashboardPagesAPI/dealer-reports?format=${format}&ids=${reportId}`;
      handleDownload(downloadUrl, filename);
      toast.success("Download started successfully!");
    } catch (e) {
      toast.error("Failed to start download.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async (format: 'csv' | 'xlsx'): Promise<void> => {
    if (format === 'xlsx') {
      toast.info("XLSX downloading is not yet implemented.");
      return;
    }
    setIsDownloading(true);
    toast.info(`Downloading all ${activeTab === 'dealers' ? 'Dealer' : 'Sub-Dealer'} Reports as ${format.toUpperCase()}...`);
    try {
      const filename = `all-${activeTab === 'dealers' ? 'dealer' : 'sub-dealer'}-reports-${Date.now()}.csv`;
      const downloadUrl = `/api/dashboardPagesAPI/dealer-reports?format=${format}`;
      handleDownload(downloadUrl, filename);
      toast.success("Download started successfully!");
    } catch (e) {
      toast.error("Failed to start download.");
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleViewReport = (report: DealerReport) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  // --- 2. Define Columns for Dealer/Sub-Dealer Report DataTable ---
  const dealerReportColumns: ColumnDef<DealerReport>[] = [
    { accessorKey: "salesmanName", header: "Salesman" },
    // Conditionally display Dealer Name or Sub-Dealer Name
    {
      id: "name",
      header: activeTab === "dealers" ? "Dealer Name" : "Sub-Dealer Name",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.type === "Dealer" ? row.original.dealerName : row.original.subDealerName}
        </span>
      ),
    },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "region", header: "Region" },
    { accessorKey: "area", header: "Area" },
    { accessorKey: "phoneNo", header: "Phone No." },
    { accessorKey: "address", header: "Address",
      cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.original.address}</span>,
    },
    { accessorKey: "dealerTotalPotential", header: "Total Potential (₹)" },
    { accessorKey: "dealerBestPotential", header: "Best Potential (₹)" },
    { accessorKey: "brandSelling", header: "Brands Selling",
      cell: ({ row }) => (
        <span className="max-w-[150px] truncate block">
          {row.original.brandSelling.join(", ")}
        </span>
      ),
    },
    { accessorKey: "feedbacks", header: "Feedbacks",
      cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.feedbacks}</span>,
    },
    { accessorKey: "remarks", header: "Remarks",
      cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.remarks || "N/A"}</span>,
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
        Loading dealer reports...
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
          <h2 className="text-3xl font-bold tracking-tight">Dealer & Sub-Dealer Reports</h2>
        </div>

        {/* Tabs for Dealers and Sub-Dealers */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "dealers" | "sub-dealers")}>
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-fit grid-cols-2 bg-muted text-muted-foreground border-border">
              <TabsTrigger value="dealers" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">Dealers</TabsTrigger>
              <TabsTrigger value="sub-dealers" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">Sub-Dealers</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={isDownloading}>
                    {isDownloading ? (
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <IconDownload className="mr-2 h-4 w-4" />
                    )}
                    Download All
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownloadAll('csv')}>Download CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadAll('xlsx')}>Download XLSX</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content for Dealers Tab */}
          <TabsContent value="dealers">
            <div className="mt-4 bg-card p-6 rounded-lg border border-border">
              <DataTableReusable
                columns={dealerReportColumns}
                data={currentData}
                reportTitle="Dealer Reports"
                filterColumnAccessorKey="dealerName"
                onDownloadAll={handleDownloadAll}
                enableRowDragging={false}
              />
            </div>
          </TabsContent>

          {/* Content for Sub-Dealers Tab */}
          <TabsContent value="sub-dealers">
            <div className="mt-4 bg-card p-6 rounded-lg border border-border">
              <DataTableReusable
                columns={dealerReportColumns}
                data={currentData}
                reportTitle="Sub-Dealer Reports"
                filterColumnAccessorKey="subDealerName"
                onDownloadAll={() => handleDownloadAll('csv')}
                enableRowDragging={false}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedReport && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedReport.type} Report Details</DialogTitle>
              <DialogDescription>
                Detailed information about the {selectedReport.type.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              <div>
                <Label htmlFor="salesmanName">Salesman Name</Label>
                <Input id="salesmanName" value={selectedReport.salesmanName} readOnly />
              </div>
              <div>
                <Label htmlFor="name">{selectedReport.type === 'Dealer' ? 'Dealer Name' : 'Sub-Dealer Name'}</Label>
                <Input id="name" value={selectedReport.type === 'Dealer' ? selectedReport.dealerName || '' : selectedReport.subDealerName || ''} readOnly />
              </div>
              {selectedReport.type === 'Sub Dealer' && selectedReport.dealerName && (
                <div>
                  <Label htmlFor="parentDealerName">Parent Dealer</Label>
                  <Input id="parentDealerName" value={selectedReport.dealerName} readOnly />
                </div>
              )}
              <div>
                <Label htmlFor="type">Type</Label>
                <Input id="type" value={selectedReport.type} readOnly />
              </div>
              <div>
                <Label htmlFor="region">Region</Label>
                <Input id="region" value={selectedReport.region} readOnly />
              </div>
              <div>
                <Label htmlFor="area">Area</Label>
                <Input id="area" value={selectedReport.area} readOnly />
              </div>
              <div>
                <Label htmlFor="phoneNo">Phone No.</Label>
                <Input id="phoneNo" value={selectedReport.phoneNo} readOnly />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" value={selectedReport.address} readOnly className="h-16" />
              </div>
              <div>
                <Label htmlFor="totalPotential">Total Potential (₹)</Label>
                <Input id="totalPotential" value={selectedReport.dealerTotalPotential?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="bestPotential">Best Potential (₹)</Label>
                <Input id="bestPotential" value={selectedReport.dealerBestPotential?.toFixed(2) || 'N/A'} readOnly />
              </div>
              <div>
                <Label htmlFor="brandSelling">Brands Selling</Label>
                <Input id="brandSelling" value={selectedReport.brandSelling.join(', ')} readOnly />
              </div>
              <div>
                <Label htmlFor="feedbacks">Feedbacks</Label>
                <Textarea id="feedbacks" value={selectedReport.feedbacks} readOnly className="h-24" />
              </div>
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea id="remarks" value={selectedReport.remarks || 'N/A'} readOnly className="h-24" />
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

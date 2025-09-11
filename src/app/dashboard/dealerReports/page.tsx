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
import { IconDotsVertical } from '@tabler/icons-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
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
  type: z.string(),
  dealerName: z.string().optional().nullable(),
  subDealerName: z.string().optional().nullable(),
  region: z.string(),
  area: z.string(),
  phoneNo: z.string(),
  address: z.string(),
  dealerTotalPotential: z.number(),
  dealerBestPotential: z.number(),
  brandSelling: z.array(z.string()),
  feedbacks: z.string(),
  remarks: z.string().optional().nullable(),
});

// Infer the TypeScript type from the Zod schema
type DealerReport = z.infer<typeof dealerReportSchema>;

const ITEMS_PER_PAGE = 10; // Define items per page for pagination

export default function DealerReportsPage() {
  const [allReports, setAllReports] = React.useState<DealerReport[]>([]);
  const [dealers, setDealers] = React.useState<DealerReport[]>([]);
  const [subDealers, setSubDealers] = React.useState<DealerReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"dealers" | "sub-dealers">("dealers");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<DealerReport | null>(null);

  // --- Data Fetching Logic ---
  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/dealer-reports`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: DealerReport[] = await response.json();
      const validatedData = data.map((item) => {
        try {
          return dealerReportSchema.parse(item);
        } catch (e) {
          console.error("Validation error for item:", item, e);
          toast.error("Invalid dealer report data received from server.");
          return null;
        }
      }).filter(Boolean) as DealerReport[];

      setAllReports(validatedData);
      setDealers(validatedData.filter(report => report.type === 'Dealer'));
      setSubDealers(validatedData.filter(report => report.type === 'Sub Dealer'));
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

  // --- Filtering and Pagination Logic ---
  const currentData = activeTab === "dealers" ? dealers : subDealers;

  const filteredReports = currentData.filter((report) => {
    const nameToSearch = report.type === "Dealer" ? report.dealerName : report.subDealerName;
    const matchesSearch =
      report.salesmanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nameToSearch && nameToSearch.toLowerCase().includes(searchQuery.toLowerCase())) ||
      report.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.phoneNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.brandSelling.some(brand => brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      report.feedbacks.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.remarks && report.remarks.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedReports = filteredReports.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  React.useEffect(() => {
    // Reset page to 1 when tab changes or search query changes
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const handleViewReport = (report: DealerReport) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  // --- 3. Define Columns for Dealer/Sub-Dealer Report DataTable ---
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
              <DropdownMenuItem onClick={() => handleViewReport(row.original)}>
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleDealerReportOrderChange = (newOrder: DealerReport[]) => {
    console.log("New dealer report order:", newOrder.map(r => r.id));
  };

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
        <Tabs defaultValue="dealers" className="w-full" onValueChange={(value: any) => setActiveTab(value)}>
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-fit grid-cols-2 bg-muted text-muted-foreground border-border">
              <TabsTrigger value="dealers" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">Dealers</TabsTrigger>
              <TabsTrigger value="sub-dealers" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">Sub-Dealers</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          {/* Content for Dealers Tab */}
          <TabsContent value="dealers" className="mt-4 bg-card p-6 rounded-lg border border-border">
            {paginatedReports.length === 0 && !loading && !error ? (
              <div className="text-center text-gray-500 py-8">No dealer reports found.</div>
            ) : (
              <>
                <DataTableReusable
                  columns={dealerReportColumns}
                  data={paginatedReports}
                  //filterColumnAccessorKey="dealerName"
                  enableRowDragging={false}
                  onRowOrderChange={handleDealerReportOrderChange}
                />
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        aria-disabled={currentPage === 1}
                        tabIndex={currentPage === 1 ? -1 : undefined}
                      />
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
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        aria-disabled={currentPage === totalPages}
                        tabIndex={currentPage === totalPages ? -1 : undefined}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            )}
          </TabsContent>

          {/* Content for Sub-Dealers Tab */}
          <TabsContent value="sub-dealers" className="mt-4 bg-card p-6 rounded-lg border border-border">
            {paginatedReports.length === 0 && !loading && !error ? (
              <div className="text-center text-gray-500 py-8">No sub-dealer reports found.</div>
            ) : (
              <>
                <DataTableReusable
                  columns={dealerReportColumns}
                  data={paginatedReports}
                  //reportTitle="Sub-Dealer Reports"
                  //filterColumnAccessorKey="subDealerName"
                  //onDownloadAll={dummyDownloadFunction}
                  enableRowDragging={false}
                  onRowOrderChange={handleDealerReportOrderChange}
                  // Removed: hideToolbar={true}
                />
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        aria-disabled={currentPage === 1}
                        tabIndex={currentPage === 1 ? -1 : undefined}
                      />
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
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        aria-disabled={currentPage === totalPages}
                        tabIndex={currentPage === totalPages ? -1 : undefined}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            )}
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
                <Input id="totalPotential" value={selectedReport.dealerTotalPotential.toFixed(2)} readOnly />
              </div>
              <div>
                <Label htmlFor="bestPotential">Best Potential (₹)</Label>
                <Input id="bestPotential" value={selectedReport.dealerBestPotential.toFixed(2)} readOnly />
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
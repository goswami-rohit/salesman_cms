// src/app/dashboard/clientReports/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { z } from "zod";
import { toast } from "sonner";
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

// Zod schema for client report data
const clientReportSchema = z.object({
  id: z.string().uuid(),
  salesmanName: z.string(),
  dealerType: z.string(),
  dealerSubDealerName: z.string(),
  location: z.string(),
  typeBestNonBest: z.string(),
  dealerTotalPotential: z.number(),
  dealerBestPotential: z.number(),
  brandSelling: z.array(z.string()),
  contactPerson: z.string(),
  contactPersonPhoneNo: z.string(),
  todayOrderMT: z.number(),
  todayCollection: z.number(),
  feedbacks: z.string(),
  solutionsAsPerSalesperson: z.string(),
  anyRemarks: z.string(),
  checkOutTime: z.string(), // ISO string from backend
});

type ClientReport = z.infer<typeof clientReportSchema>;

const ITEMS_PER_PAGE = 10;

export default function ClientReportsPage() {
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ClientReport | null>(
    null
  );

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboardPagesAPI/client-reports");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ClientReport[] = await response.json();
      // Validate each item against the schema
      const validatedData = data.map((item) => {
        try {
          return clientReportSchema.parse(item);
        } catch (e) {
          console.error("Validation error for item:", item, e);
          toast.error("Invalid report data received from server.");
          return null; // Filter out invalid items or handle them
        }
      }).filter(Boolean) as ClientReport[]; // Remove nulls
      setReports(validatedData);
      toast.success("Client reports loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch client reports:", e);
      setError(e.message || "Failed to fetch reports.");
      toast.error(e.message || "Failed to load client reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.salesmanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.dealerSubDealerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.feedbacks.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "all" || report.dealerType.toLowerCase() === filterType;

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentReports = filteredReports.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleViewReport = (report: ClientReport) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading reports...
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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Client Reports</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by salesman, dealer, location, contact, or feedback..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="dealer">Dealer</SelectItem>
            <SelectItem value="sub dealer">Sub Dealer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center text-gray-500">No reports found matching your criteria.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Dealer Type</TableHead>
                  <TableHead>Dealer/Sub-Dealer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Total Potential</TableHead>
                  <TableHead>Today Order (MT)</TableHead>
                  <TableHead>Today Collection (₹)</TableHead>
                  <TableHead>Check-out Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.salesmanName}
                    </TableCell>
                    <TableCell>{report.dealerType}</TableCell>
                    <TableCell>{report.dealerSubDealerName}</TableCell>
                    <TableCell>{report.location}</TableCell>
                    <TableCell>{report.dealerTotalPotential.toFixed(2)}</TableCell>
                    <TableCell>{report.todayOrderMT.toFixed(2)}</TableCell>
                    <TableCell>{report.todayCollection.toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(report.checkOutTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewReport(report)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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

      {selectedReport && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Client Report Details</DialogTitle>
              <DialogDescription>
                Detailed information about the client visit.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="salesmanName">Salesman Name</Label>
                <Input id="salesmanName" value={selectedReport.salesmanName} readOnly />
              </div>
              <div>
                <Label htmlFor="dealerType">Dealer Type</Label>
                <Input id="dealerType" value={selectedReport.dealerType} readOnly />
              </div>
              <div>
                <Label htmlFor="dealerSubDealerName">Dealer/Sub-Dealer Name</Label>
                <Input id="dealerSubDealerName" value={selectedReport.dealerSubDealerName} readOnly />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={selectedReport.location} readOnly />
              </div>
              <div>
                <Label htmlFor="typeBestNonBest">Best/Non-Best Type</Label>
                <Input id="typeBestNonBest" value={selectedReport.typeBestNonBest} readOnly />
              </div>
              <div>
                <Label htmlFor="dealerTotalPotential">Dealer Total Potential</Label>
                <Input id="dealerTotalPotential" value={selectedReport.dealerTotalPotential.toFixed(2)} readOnly />
              </div>
              <div>
                <Label htmlFor="dealerBestPotential">Dealer Best Potential</Label>
                <Input id="dealerBestPotential" value={selectedReport.dealerBestPotential.toFixed(2)} readOnly />
              </div>
              <div>
                <Label htmlFor="brandSelling">Brands Selling</Label>
                <Input id="brandSelling" value={selectedReport.brandSelling.join(", ")} readOnly />
              </div>
              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input id="contactPerson" value={selectedReport.contactPerson} readOnly />
              </div>
              <div>
                <Label htmlFor="contactPersonPhoneNo">Contact Person Phone No.</Label>
                <Input id="contactPersonPhoneNo" value={selectedReport.contactPersonPhoneNo} readOnly />
              </div>
              <div>
                <Label htmlFor="todayOrderMT">Today's Order (MT)</Label>
                <Input id="todayOrderMT" value={selectedReport.todayOrderMT.toFixed(2)} readOnly />
              </div>
              <div>
                <Label htmlFor="todayCollection">Today's Collection (₹)</Label>
                <Input id="todayCollection" value={selectedReport.todayCollection.toFixed(2)} readOnly />
              </div>
              <div>
                <Label htmlFor="checkOutTime">Check-out Time</Label>
                <Input id="checkOutTime" value={new Date(selectedReport.checkOutTime).toLocaleString()} readOnly />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="feedbacks">Feedbacks</Label>
                <Textarea id="feedbacks" value={selectedReport.feedbacks} readOnly className="h-24" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="solutionsAsPerSalesperson">Solutions As Per Salesperson</Label>
                <Textarea id="solutionsAsPerSalesperson" value={selectedReport.solutionsAsPerSalesperson} readOnly className="h-24" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="anyRemarks">Any Remarks</Label>
                <Textarea id="anyRemarks" value={selectedReport.anyRemarks} readOnly className="h-24" />
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
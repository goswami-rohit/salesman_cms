// src/app/dashboard/masonpcSide/rewardsRedemption.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { Search, Loader2, IndianRupee, Package, CheckCircle, XCircle } from 'lucide-react';

// Import the reusable DataTable
import { DataTableReusable } from '@/components/data-table-reusable';

// UI Components for Filtering/Pagination
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
// Assuming cn utility exists for conditional class merging
// import { cn } from '@/lib/utils'; // Not importing due to path issue, using direct classes

// --- CONSTANTS AND TYPES ---
const ITEMS_PER_PAGE = 10;
// API Endpoint
const REDEMPTION_API_ENDPOINT = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/masonpc-side/rewards-redemption`;

// Type for data coming from the API (must match the flattened response structure)
type RedemptionRecord = {
    id: string;
    masonId: string;
    masonName: string;
    rewardId: number;
    rewardName: string;
    quantity: number;
    status: string; // e.g., 'PENDING', 'APPROVED', 'REJECTED', 'SHIPPED', 'DELIVERED'
    pointsDebited: number;
    deliveryName: string | null;
    deliveryPhone: string | null;
    deliveryAddress: string | null;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
};

// Static options for the Status filter (based on common states)
const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED', 'SHIPPED', 'DELIVERED'];


// --- HELPER FUNCTIONS ---

/**
 * Helper function to render the Select filter component
 */
const renderSelectFilter = (
  label: string,
  value: string,
  onValueChange: (v: string) => void,
  options: string[],
) => (
  <div className="flex flex-col space-y-1 w-full sm:w-[150px] min-w-[120px]">
    <label className="text-sm font-medium text-muted-foreground">{label}</label>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9">
        <SelectValue placeholder={`Select ${label}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}s</SelectItem>
        {options.map(option => (
          <SelectItem key={option} value={option}>
            {option.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} {/* Format for display */}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

/**
 * Formats an ISO date string to a readable date (including time).
 */
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(dateString));
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Gets the color variant and icon for the status badge.
 */
const getStatusBadgeProps = (status: string) => {
    switch (status.toUpperCase()) {
        case 'APPROVED':
            return {
                icon: CheckCircle,
                className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
            };
        case 'REJECTED':
            return {
                icon: XCircle,
                className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
            };
        case 'SHIPPED':
        case 'DELIVERED':
            return {
                icon: Package,
                className: 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200',
            };
        case 'PENDING':
        default:
            return {
                icon: Loader2,
                className: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200 animate-spin-slow',
            };
    }
};


// --- MAIN COMPONENT ---

export default function RewardsRedemptionPage() {
  const [redemptionRecords, setRedemptionRecords] = React.useState<RedemptionRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState(''); // Mason Name search
  const [statusFilter, setStatusFilter] = useState('all'); // Redemption Status filter
  const [currentPage, setCurrentPage] = useState(1);


  // --- Data Fetching Function ---

  /**
   * Fetches the main Rewards Redemption data.
   */
  const fetchRedemptionRecords = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(REDEMPTION_API_ENDPOINT);
      if (!response.ok) {
         if (response.status === 401) {
          toast.error('You are not authenticated. Redirecting to login.');
          window.location.href = '/login';
          return;
        }
        if (response.status === 403) {
          toast.error('You do not have permission to access this page. Redirecting.');
          window.location.href = '/dashboard';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: RedemptionRecord[] = await response.json();
      setRedemptionRecords(data);
      toast.success("Rewards Redemption records loaded successfully!");
    } catch (error: any) {
      console.error("Failed to fetch Rewards Redemption records:", error);
      toast.error(`Failed to fetch Rewards Redemption records: ${error.message}`);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  // Initial data load
  React.useEffect(() => {
    fetchRedemptionRecords();
  }, [fetchRedemptionRecords]);


  // --- Filtering and Pagination Logic ---
  const filteredRecords = useMemo(() => {
    setCurrentPage(1); // Reset page on filter change
    
    return redemptionRecords.filter((record) => {
      // 1. Mason Name Search
      const nameMatch = !searchQuery ||
        record.masonName.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Status Filter
      const statusMatch = statusFilter === 'all' || 
        record.status.toLowerCase() === statusFilter.toLowerCase(); 

      // Combine all conditions
      return nameMatch && statusMatch;
    });
  }, [redemptionRecords, searchQuery, statusFilter]);


  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  // Slice the filtered data for the current page
  const currentRecords = filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  

  // --- 3. Define Columns for Rewards Redemption DataTable ---
  const redemptionColumns: ColumnDef<RedemptionRecord>[] = [
    { 
        accessorKey: "createdAt", 
        header: "Redemption Date", 
        cell: ({ row }) => <span className="text-sm font-medium text-gray-700">{formatDate(row.original.createdAt)}</span>,
        enableSorting: true,
    },
    { 
      accessorKey: "masonName", 
      header: "Mason Name",
      enableSorting: true,
    },
    { 
      accessorKey: "rewardName", 
      header: "Reward Item",
    },
    { 
      accessorKey: "quantity", 
      header: "Qty",
    },
    { 
      accessorKey: "pointsDebited", 
      header: "Points Cost",
      cell: ({ row }) => (
        <div className='flex items-center text-red-600 font-semibold'>
            -{row.original.pointsDebited} <IndianRupee className='w-3 h-3 ml-1' />
        </div>
      ),
      enableSorting: true,
    },
    { 
      accessorKey: "status", 
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const { icon: Icon, className } = getStatusBadgeProps(status);
        return (
            <Badge className={`capitalize font-medium ${className}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status.toLowerCase()}
            </Badge>
        );
      },
      enableSorting: true,
    },
    { 
      accessorKey: "deliveryName", 
      header: "Recipient Name",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.deliveryName ?? 'N/A'}</span>
    },
    { 
      accessorKey: "deliveryAddress", 
      header: "Delivery Address",
      cell: ({ row }) => (
        <p className="max-w-[200px] truncate text-xs text-muted-foreground" title={row.original.deliveryAddress ?? 'N/A'}>
            {row.original.deliveryAddress ?? 'N/A'}
        </p>
      )
    },
  ];

  const handleRedemptionOrderChange = (newOrder: RedemptionRecord[]) => {
    console.log("New Redemption order:", newOrder.map(r => r.id));
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-2">Loading Rewards Redemption records...</span>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 min-h-screen pt-10">
      Error: {error}
      <Button onClick={fetchRedemptionRecords} className="ml-4">Retry</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Rewards Redemption Log</h2>
        </div>

        {/* --- Filter Components --- */}
        <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-card border">
          {/* 1. Mason Name Search Input */}
          <div className="flex flex-col space-y-1 w-full sm:w-[250px] min-w-[150px]">
            <label className="text-sm font-medium text-muted-foreground">Mason Name</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by mason name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* 2. Status Filter */}
          {renderSelectFilter(
            'Status', 
            statusFilter, 
            (v) => { setStatusFilter(v); }, 
            STATUS_OPTIONS
          )}
          
        </div>
        {/* --- End Filter Components --- */}

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          {filteredRecords.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No Rewards Redemption records found matching the selected filters.</div>
          ) : (
            <>
              <DataTableReusable
                columns={redemptionColumns}
                data={currentRecords} // Use filtered and paginated data
                enableRowDragging={false} 
                onRowOrderChange={handleRedemptionOrderChange}
              />
              
              {/* --- Pagination --- */}
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
                    <PaginationItem key={index} aria-current={currentPage === index + 1 ? "page" : undefined}>
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
              {/* --- End Pagination --- */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
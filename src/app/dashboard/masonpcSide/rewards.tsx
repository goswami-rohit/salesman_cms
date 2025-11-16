// src/app/dashboard/masonpcSide/rewards.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { Search, Loader2, IndianRupee, CheckCircle2, XCircle, Ban, TrendingUp } from 'lucide-react';

// NOTE: Using the aliased path. If this fails again, a relative path must be provided by the user.
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
// Assuming a Progress component exists for stock level
import { Progress } from '@/components/ui/progress'; 
import { BASE_URL } from '@/lib/Reusable-constants';


// --- CONSTANTS AND TYPES ---
const ITEMS_PER_PAGE = 10;
// API Endpoints
const REWARDS_API_ENDPOINT = `/api/dashboardPagesAPI/masonpc-side/rewards`;
const CATEGORIES_API_ENDPOINT = `/api/dashboardPagesAPI/masonpc-side/reward-categories`;

// Type for data coming from the API (must match the flattened response structure)
type RewardRecord = {
    id: number;
    name: string;
    pointCost: number;
    stock: number; // Current stock
    totalAvailableQuantity: number; // Total possible stock
    isActive: boolean;
    categoryName: string; // Flattened field
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
};

type CategoryOption = {
    id: number;
    name: string;
}


// --- HELPER FUNCTIONS ---

/**
 * Helper function to render the Select filter component.
 * Note: This accepts CategoryOption[] but is also used for the static statusOptions (which are mapped to CategoryOption type before calling).
 */
const renderSelectFilter = (
  label: string,
  value: string,
  onValueChange: (v: string) => void,
  options: CategoryOption[],
  isLoading: boolean = false
) => (
  <div className="flex flex-col space-y-1 w-full sm:w-[150px] min-w-[120px]">
    <label className="text-sm font-medium text-muted-foreground">{label}</label>
    <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
      <SelectTrigger className="h-9">
        {isLoading ? (
          <div className="flex flex-row items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <SelectValue placeholder={`Select ${label}`} />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}s</SelectItem>
        {options.map(option => (
          <SelectItem key={option.name} value={option.name}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

/**
 * Formats an ISO date string to a readable date (no time).
 */
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Determines the color and status of the reward item.
 */
const getStatusBadgeProps = (isActive: boolean, stock: number) => {
    if (!isActive) {
        return {
            icon: Ban,
            className: 'bg-gray-100 text-gray-700 border-gray-200',
            text: 'Inactive'
        };
    }
    if (stock <= 0) {
        return {
            icon: XCircle,
            className: 'bg-red-100 text-red-700 border-red-200',
            text: 'Out of Stock'
        };
    }
    // Check if stock is low (e.g., less than 20% of total)
    const stockPercentage = stock / (stock + (stock > 0 ? 1 : 0)); // Avoid division by zero, approximate total if not provided.
    if (stock > 0 && stockPercentage < 0.2) {
        return {
            icon: TrendingUp, // Using an alternative icon for low stock
            className: 'bg-orange-100 text-orange-700 border-orange-200',
            text: 'Low Stock'
        };
    }
    return {
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700 border-green-200',
            text: 'Active'
    };
};


// --- MAIN COMPONENT ---

export default function RewardsPage() {
  const [rewardRecords, setRewardRecords] = React.useState<RewardRecord[]>([]);
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([]);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState(''); // Reward Name search
  const [categoryFilter, setCategoryFilter] = useState('all'); // Category filter
  const [statusFilter, setStatusFilter] = useState('all'); // Status filter (Active/Inactive/Out of Stock)
  const [currentPage, setCurrentPage] = useState(1);
  const statusOptions = ['Active', 'Inactive', 'Out of Stock', 'Low Stock'];


  // --- Data Fetching Functions ---

  /**
   * Fetches the main Rewards data.
   */
  const fetchRewardRecords = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(REWARDS_API_ENDPOINT);
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
      const data: RewardRecord[] = await response.json();
      setRewardRecords(data);
      toast.success("Rewards list loaded successfully!");
    } catch (error: any) {
      console.error("Failed to fetch Rewards records:", error);
      toast.error(`Failed to fetch Rewards records: ${error.message}`);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []); 
  
  /**
   * Fetches the Reward Categories for the filter dropdown.
   */
  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const response = await fetch(CATEGORIES_API_ENDPOINT);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: CategoryOption[] = await response.json();
      setAvailableCategories(data.filter(c => c.name));
    } catch (err: any) {
      console.error('Failed to fetch filter categories:', err);
      toast.error('Failed to load category filters.');
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // Initial data loads
  React.useEffect(() => {
    fetchRewardRecords();
    fetchCategories();
  }, [fetchRewardRecords, fetchCategories]);


  // --- Filtering and Pagination Logic ---
  const filteredRecords = useMemo(() => {
    setCurrentPage(1); // Reset page on filter change
    
    return rewardRecords.filter((record) => {
      // 1. Reward Name Search
      const nameMatch = !searchQuery ||
        record.name.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Category Filter
      const categoryMatch = categoryFilter === 'all' || 
        record.categoryName.toLowerCase() === categoryFilter.toLowerCase(); 

      // 3. Status Filter
      const statusText = getStatusBadgeProps(record.isActive, record.stock).text;
      const statusMatch = statusFilter === 'all' || 
        statusText.toLowerCase() === statusFilter.toLowerCase();

      // Combine all conditions
      return nameMatch && categoryMatch && statusMatch;
    });
  }, [rewardRecords, searchQuery, categoryFilter, statusFilter]);


  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  // Slice the filtered data for the current page
  const currentRecords = filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  

  // --- 3. Define Columns for Rewards DataTable ---
  const rewardsColumns: ColumnDef<RewardRecord>[] = [
    { 
        accessorKey: "name", 
        header: "Reward Name",
        enableSorting: true,
    },
    { 
      accessorKey: "categoryName", 
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {row.original.categoryName}
        </Badge>
      )
    },
    { 
      accessorKey: "pointCost", 
      header: "Point Cost",
      cell: ({ row }) => (
        <div className='flex items-center text-primary font-semibold'>
            {row.original.pointCost} <IndianRupee className='w-3 h-3 ml-1' />
        </div>
      ),
      enableSorting: true,
    },
    { 
      accessorKey: "stock", 
      header: "Stock Level",
      cell: ({ row }) => {
        const { stock, totalAvailableQuantity } = row.original;
        // Calculate progress and color based on stock levels
        const progressValue = totalAvailableQuantity > 0 ? (stock / totalAvailableQuantity) * 100 : 0;
        
        let barColor = 'bg-gray-400';
        if (stock > 0) {
            if (progressValue >= 50) {
                barColor = 'bg-green-500';
            } else if (progressValue >= 20) {
                barColor = 'bg-yellow-500';
            } else {
                barColor = 'bg-orange-500';
            }
        } else {
            barColor = 'bg-red-500';
        }
        
        // FIX: Remove indicatorClassName and append barColor to className
        return (
          <div className="flex flex-col space-y-1 w-[120px]">
            <p className="text-sm font-mono text-right">{stock} / {totalAvailableQuantity}</p>
            <Progress 
                value={progressValue} 
                className={`h-2 ${barColor}`} // Apply barColor here for the indicator background
            />
          </div>
        );
      },
      enableSorting: true,
    },
    { 
      accessorKey: "isActive", 
      header: "Status",
      cell: ({ row }) => {
        const { isActive, stock } = row.original;
        const { icon: Icon, className, text } = getStatusBadgeProps(isActive, stock);
        return (
            <Badge className={`font-medium ${className}`}>
                <Icon className="w-3 h-3 mr-1" />
                {text}
            </Badge>
        );
      },
      enableSorting: true,
    },
    { 
        accessorKey: "createdAt", 
        header: "Created On",
        cell: ({ row }) => formatDate(row.original.createdAt)
    },
    { 
        accessorKey: "updatedAt", 
        header: "Last Update",
        cell: ({ row }) => formatDate(row.original.updatedAt)
    },
  ];

  const handleRewardsOrderChange = (newOrder: RewardRecord[]) => {
    console.log("New Rewards order:", newOrder.map(r => r.id));
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-2">Loading Rewards Master List...</span>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 min-h-screen pt-10">
      Error: {error}
      <Button onClick={fetchRewardRecords} className="ml-4">Retry</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Rewards Master List</h2>
          <div className="flex items-center space-x-2">
            <Button onClick={() => toast.info("Add New Reward functionality not yet implemented.")}>
                Add New Reward Category
            </Button>
          </div>
        </div>

        {/* --- Filter Components --- */}
        <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-card border">
          {/* 1. Reward Name Search Input */}
          <div className="flex flex-col space-y-1 w-full sm:w-[250px] min-w-[150px]">
            <label className="text-sm font-medium text-muted-foreground">Reward Name</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reward name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* 2. Category Filter */}
          {renderSelectFilter(
            'Category', 
            categoryFilter, 
            (v) => { setCategoryFilter(v); }, 
            availableCategories,
            isLoadingCategories
          )}
          
          {/* 3. Status Filter */}
          {renderSelectFilter(
            'Status', 
            statusFilter, 
            (v) => { setStatusFilter(v); }, 
            statusOptions.map(name => ({ id: 0, name: name })) // Map string array to expected CategoryOption type
          )}
          
        </div>
        {/* --- End Filter Components --- */}

        {/* Data Table Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          {filteredRecords.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No Rewards found matching the selected filters.</div>
          ) : (
            <>
              <DataTableReusable
                columns={rewardsColumns}
                data={currentRecords} // Use filtered and paginated data
                enableRowDragging={false} 
                onRowOrderChange={handleRewardsOrderChange}
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
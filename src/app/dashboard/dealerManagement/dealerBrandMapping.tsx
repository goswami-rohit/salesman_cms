// src/app/dashboard/dealerManagement/dealerBrandMapping.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { DataTableReusable } from '@/components/data-table-reusable';
// import { BASE_URL } from '@/lib/Reusable-constants'; // Keep if needed elsewhere

// Define a type for the dealer brand mapping data, including a record for dynamic brand columns.
type DealerBrandMappingData = {
  id: string;
  dealerName: string;
  area: string;
  totalPotential: number;
} & Record<string, number>; // Dynamic keys for brand names with number values

const columnHelper = createColumnHelper<DealerBrandMappingData>();

export default function DealerBrandMappingPage() {
  // Pass ALL fetched data to DataTableReusable
  const [data, setData] = useState<DealerBrandMappingData[]>([]);
  const [columns, setColumns] = useState<ColumnDef<DealerBrandMappingData, any>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use useCallback to memoize the fetch logic and prevent unnecessary re-creations.
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboardPagesAPI/dealerManagement/dealer-brand-mapping`);
      if (!response.ok) {
        throw new Error('Failed to fetch brand mapping data');
      }
      const fetchedData = await response.json();

      if (!fetchedData || fetchedData.length === 0) {
        setLoading(false);
        setData([]);
        setColumns([]);
        return;
      }

      // Dynamically generate columns based on the keys of the first data object.
      // Filter out the static keys to get only the brand names.
      const staticKeys = ['id', 'dealerName', 'area', 'totalPotential'];
      const brandNames = Object.keys(fetchedData[0]).filter(
        (key) => !staticKeys.includes(key)
      );

      // Create static columns
      const staticColumns: ColumnDef<DealerBrandMappingData, any>[] = [
        columnHelper.accessor('dealerName', {
          header: 'Dealer Name',
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('area', {
          header: 'Area',
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('totalPotential', {
          header: 'Total Potential (MT)',
          cell: (info) => info.getValue(),
        }),
      ];

      // Create dynamic columns for each brand
      const dynamicColumns: ColumnDef<DealerBrandMappingData, any>[] = brandNames.map(
        (brand) =>
          columnHelper.accessor(brand as keyof DealerBrandMappingData, {
            header: `${brand} (MT)`,
            cell: (info) => info.getValue(),
          })
      );

      // Set the columns and data states
      setColumns([...staticColumns, ...dynamicColumns]);
      setData(fetchedData); // Set the full data array
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch the data on component mount.
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="flex min-h-screen w-full flex-col p-6">
      <div className="flex-1 space-y-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <p className="text-gray-500">Loading reports...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-10 text-red-600">
              <p>{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No dealer brand mapping reports found.
            </div>
          ) : (
            <>
              {/* Pass the FULL data array to DataTableReusable */}
              <DataTableReusable
                columns={columns}
                data={data} 
                enableRowDragging={false}
                onRowOrderChange={() => {}}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
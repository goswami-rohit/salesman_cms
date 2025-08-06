// src/app/dashboard/dashboardGraphs.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartAreaInteractive } from '@/components/chart-area-reusable';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ColumnDef } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner'; // Import toast for client-side errors
import { Button } from '@/components/ui/button';
import { DataTableReusable } from '@/components/data-table-reusable';
import {
  DailyVisitsData,
  GeoTrackingData,
  DailyCollectionData,
  RawGeoTrackingRecord,
  RawDailyVisitReportRecord,
  rawGeoTrackingSchema, // Zod schema for validation
  rawDailyVisitReportSchema, // Zod schema for validation
} from './data-format';

// Define the columns for the geo-tracking data table
const geoTrackingColumns: ColumnDef<RawGeoTrackingRecord>[] = [
  { accessorKey: 'salesmanName', header: 'Salesman' },
  { accessorKey: 'recordedAt', header: 'Last Ping', cell: ({ row }) => new Date(row.original.recordedAt).toLocaleString() },
  { accessorKey: 'totalDistanceTravelled', header: 'Distance (km)', cell: ({ row }) => `${row.original.totalDistanceTravelled?.toFixed(2) ?? 'N/A'} km` },
  { accessorKey: 'employeeId', header: 'Employee ID' },
  { accessorKey: 'latitude', header: 'Latitude' },
  { accessorKey: 'longitude', header: 'Longitude' },
];

// Define the columns for the daily visit reports table
const dailyReportsColumns: ColumnDef<RawDailyVisitReportRecord>[] = [
  { accessorKey: 'salesmanName', header: 'Salesman' },
  { accessorKey: 'reportDate', header: 'Report Date' },
  { accessorKey: 'dealerName', header: 'Dealer Name', cell: info => info.getValue() || 'N/A' },
  { accessorKey: 'visitType', header: 'Visit Type' },
  { accessorKey: 'todayCollectionRupees', header: 'Collection (₹)', cell: ({ row }) => `₹${row.original.todayCollectionRupees?.toFixed(2) ?? 'N/A'}` },
  { accessorKey: 'feedbacks', 
    header: 'Feedbacks', 
    cell: info => <span className="max-w-[250px] truncate block">{info.getValue() as string}</span> // Explicitly cast to string
  },
];

export default function DashboardGraphs() {
  const [rawGeoTrackingRecords, setRawGeoTrackingRecords] = useState<RawGeoTrackingRecord[]>([]);
  const [rawDailyReports, setRawDailyReports] = useState<RawDailyVisitReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedGeoSalesmanId, setSelectedGeoSalesmanId] = useState<string | 'all'>('all');
  const [selectedDailySalesmanId, setSelectedDailySalesmanId] = useState<string | 'all'>('all');

  // Client-side fetching logic
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://salesmancms-dashboard.onrender.com'; // Fallback for client-side

      const [geoRes, dailyRes] = await Promise.all([
        fetch(`${baseUrl}/api/dashboardPagesAPI/slm-geotracking`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/dashboardPagesAPI/daily-visit-reports`, { cache: 'no-store' }),
      ]);

      if (!geoRes.ok) {
        const geoErrorText = await geoRes.text();
        throw new Error(`Failed to fetch geo-tracking data: ${geoRes.status} - ${geoErrorText}`);
      }
      if (!dailyRes.ok) {
        const dailyErrorText = await dailyRes.text();
        throw new Error(`Failed to fetch daily visit reports: ${dailyRes.status} - ${dailyErrorText}`);
      }

      const geoData = await geoRes.json();
      const dailyData = await dailyRes.json();

      // Validate and set data
      const validatedGeo = rawGeoTrackingSchema.array().parse(geoData);
      setRawGeoTrackingRecords(validatedGeo);

      const validatedDaily = rawDailyVisitReportSchema.array().parse(dailyData);
      setRawDailyReports(validatedDaily);

      toast.success('Dashboard data loaded successfully!');

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error('Error fetching dashboard data:', e);
      setError(errorMessage);
      toast.error(`Failed to load dashboard data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Validate raw data using Zod (moved here from page.tsx)
  const validatedGeoRecords = useMemo(() => {
    return rawGeoTrackingRecords; // Already validated in fetchData
  }, [rawGeoTrackingRecords]);

  const validatedDailyReports = useMemo(() => {
    return rawDailyReports; // Already validated in fetchData
  }, [rawDailyReports]);


  // Extract unique salesmen for the Geo-Tracking filter dropdown
  const uniqueGeoSalesmen = useMemo(() => {
    const salesmenMap = new Map<string, string>(); // Map<employeeId, salesmanName>
    validatedGeoRecords.forEach(record => {
      if (record.employeeId && record.salesmanName) {
        salesmenMap.set(record.employeeId, record.salesmanName);
      }
    });
    return Array.from(salesmenMap.entries()).map(([employeeId, salesmanName]) => ({
      id: employeeId,
      name: salesmanName,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [validatedGeoRecords]);

  // Extract unique salesmen for the Daily Reports filter dropdown
  const uniqueDailySalesmen = useMemo(() => {
    const salesmenMap = new Map<string, string>(); // Map<salesmanName, salesmanName>
    validatedDailyReports.forEach(record => {
      if (record.salesmanName) {
        salesmenMap.set(record.salesmanName, record.salesmanName);
      }
    });
    return Array.from(salesmenMap.entries()).map(([id, name]) => ({
      id: id,
      name: name,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [validatedDailyReports]);


  // Memoized function to prepare geo-tracking data for the graph
  const filteredAndAggregatedGeoData = useMemo(() => {
    let filteredRecords = validatedGeoRecords;

    if (selectedGeoSalesmanId !== 'all') {
      filteredRecords = validatedGeoRecords.filter(
        record => record.employeeId === selectedGeoSalesmanId
      );
    }

    // Aggregate data to get total distance per day for the filtered records
    const aggregatedData: Record<string, number> = {};
    filteredRecords.forEach(item => {
      if (item.recordedAt) {
        const date = new Date(item.recordedAt).toLocaleDateString('en-US');
        aggregatedData[date] = (aggregatedData[date] || 0) + (item.totalDistanceTravelled ?? 0);
      }
    });

    const graphData: GeoTrackingData[] = Object.keys(aggregatedData).sort().map(date => ({
      name: date,
      distance: aggregatedData[date],
    }));

    return graphData;
  }, [validatedGeoRecords, selectedGeoSalesmanId]);


  // Memoized function to prepare daily collection data for the graph
  const filteredAndAggregatedDailyCollectionData = useMemo(() => {
    let filteredReports = validatedDailyReports;

    if (selectedDailySalesmanId !== 'all') {
      filteredReports = validatedDailyReports.filter(
        report => report.salesmanName === selectedDailySalesmanId
      );
    }

    const aggregatedData: Record<string, number> = {};
    filteredReports.forEach(item => {
      if (item.reportDate) {
        const date = item.reportDate; // reportDate is already YYYY-MM-DD string
        aggregatedData[date] = (aggregatedData[date] || 0) + (item.todayCollectionRupees ?? 0);
      }
    });

    const graphData: DailyCollectionData[] = Object.keys(aggregatedData).sort().map(date => ({
      name: date,
      collection: aggregatedData[date],
    }));

    return graphData;
  }, [validatedDailyReports, selectedDailySalesmanId]);


  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading dashboard data...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        Error: {error}
        <Button onClick={fetchData} className="ml-4">Retry</Button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="graphs" className="space-y-4">
      <TabsList>
        <TabsTrigger value="graphs">Graphs</TabsTrigger>
        <TabsTrigger value="geo-table">Geo-Tracking Table</TabsTrigger>
        <TabsTrigger value="daily-reports-table">Daily Reports Table</TabsTrigger>
      </TabsList>

      <TabsContent value="graphs" className="space-y-4">
        {/* Consolidated Daily Reports Graph: Now shows Daily Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Daily Collection Reports
              <Select value={selectedDailySalesmanId} onValueChange={setSelectedDailySalesmanId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Salesman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salesmen</SelectItem>
                  {uniqueDailySalesmen.map(salesman => (
                    <SelectItem key={salesman.id} value={salesman.id}>
                      {salesman.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
            <CardDescription>
              Total collection (in Rupees) by the sales team per day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartAreaInteractive data={filteredAndAggregatedDailyCollectionData} dataKey="collection" />
          </CardContent>
        </Card>
        
        {/* Second Graph: GeoTracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Geo-Tracking Activity
              <Select value={selectedGeoSalesmanId} onValueChange={setSelectedGeoSalesmanId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Salesman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salesmen</SelectItem>
                  {uniqueGeoSalesmen.map(salesman => (
                    <SelectItem key={salesman.id} value={salesman.id}>
                      {salesman.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
            <CardDescription>
              Total distance travelled by the sales team per day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartAreaInteractive data={filteredAndAggregatedGeoData} dataKey="distance" />
          </CardContent>
        </Card>

      </TabsContent>

      <TabsContent value="geo-table">
        <Card>
          <CardHeader>
            <CardTitle>Sales Team Geo-Tracking Table</CardTitle>
            <CardDescription>
              Detailed view of the most recent geo-tracking data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validatedGeoRecords.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No geo-tracking reports found for your company.</div>
            ) : (
              <DataTableReusable columns={geoTrackingColumns} data={validatedGeoRecords} />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="daily-reports-table">
        <Card>
          <CardHeader>
            <CardTitle>Daily Visit Reports Table</CardTitle>
            <CardDescription>
              A table of all submitted daily visit reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validatedDailyReports.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No daily visit reports found for your company.</div>
            ) : (
              <DataTableReusable columns={dailyReportsColumns} data={validatedDailyReports} />
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// src/app/dashboard/dashboardGraphs.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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

import { DataTableReusable } from '@/components/data-table-reusable';
import { DailyVisitsData, GeoTrackingData, GeoTrackingRecord, DailyVisitReportRecord } from './data-format';

// Define the columns for the geo-tracking data table
const geoTrackingColumns: ColumnDef<GeoTrackingRecord>[] = [
  { accessorKey: 'salesmanName', header: 'Salesman' },
  { accessorKey: 'recordedAt', header: 'Last Ping', cell: ({ row }) => new Date(row.original.recordedAt).toLocaleString() },
  { accessorKey: 'totalDistanceTravelled', header: 'Distance (km)', cell: ({ row }) => `${row.original.totalDistanceTravelled?.toFixed(2) ?? 'N/A'} km` },
  { accessorKey: 'employeeId', header: 'Employee ID' },
  { accessorKey: 'latitude', header: 'Latitude' },
  { accessorKey: 'longitude', header: 'Longitude' },
];

// Define the columns for the daily visit reports table
const dailyReportsColumns: ColumnDef<DailyVisitReportRecord>[] = [
  { accessorKey: 'salesmanName', header: 'Salesman' },
  { accessorKey: 'reportDate', header: 'Report Date' },
  { accessorKey: 'dealerName', header: 'Dealer Name' },
  { accessorKey: 'visitType', header: 'Visit Type' },
];

// Define props for the DashboardGraphs component
interface DashboardGraphsProps {
  visitsData: DailyVisitsData[];
  rawGeoTrackingRecords: GeoTrackingRecord[]; // Now receives raw data
  dailyReports: DailyVisitReportRecord[];
}

export default function DashboardGraphs({ visitsData, rawGeoTrackingRecords, dailyReports }: DashboardGraphsProps) {
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string | 'all'>('all');

  // DEBUGGING LOGS: Check the data received by DashboardGraphs
  useEffect(() => {
    console.log('DashboardGraphs received rawGeoTrackingRecords:', rawGeoTrackingRecords);
    console.log('DashboardGraphs received dailyReports:', dailyReports);
    console.log('DashboardGraphs received visitsData:', visitsData);
  }, [rawGeoTrackingRecords, dailyReports, visitsData]);


  // Extract unique salesmen for the filter dropdown
  const uniqueSalesmen = useMemo(() => {
    const salesmenMap = new Map<string, string>(); // Map<employeeId, salesmanName>
    rawGeoTrackingRecords.forEach(record => {
      if (record.employeeId && record.salesmanName) {
        salesmenMap.set(record.employeeId, record.salesmanName);
      }
    });
    return Array.from(salesmenMap.entries()).map(([employeeId, salesmanName]) => ({
      id: employeeId,
      name: salesmanName,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rawGeoTrackingRecords]);

  // Memoized function to prepare geo-tracking data for the graph
  const filteredAndAggregatedGeoData = useMemo(() => {
    let filteredRecords = rawGeoTrackingRecords;

    if (selectedSalesmanId !== 'all') {
      filteredRecords = rawGeoTrackingRecords.filter(
        record => record.employeeId === selectedSalesmanId
      );
    }

    // Aggregate data to get total distance per day for the filtered records
    const aggregatedData: Record<string, number> = {};
    filteredRecords.forEach(item => {
      // Ensure recordedAt exists and is a valid date string
      if (item.recordedAt) {
        const date = new Date(item.recordedAt).toLocaleDateString('en-US'); // Format date for aggregation key
        // Ensure totalDistanceTravelled is treated as a number, defaulting to 0 if null
        aggregatedData[date] = (aggregatedData[date] || 0) + (item.totalDistanceTravelled ?? 0);
      }
    });

    // Convert the aggregated data into the chart format
    const graphData: GeoTrackingData[] = Object.keys(aggregatedData).sort().map(date => ({
      name: date,
      distance: aggregatedData[date],
    }));

    return graphData;
  }, [rawGeoTrackingRecords, selectedSalesmanId]);

  return (
    <Tabs defaultValue="graphs" className="space-y-4">
      <TabsList>
        <TabsTrigger value="graphs">Graphs</TabsTrigger>
        <TabsTrigger value="geo-table">Geo-Tracking Table</TabsTrigger>
        <TabsTrigger value="daily-reports-table">Daily Reports Table</TabsTrigger>
      </TabsList>

      <TabsContent value="graphs" className="space-y-4">
        {/* First Graph: Daily Visit Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Visits</CardTitle>
            <CardDescription>
              A quick overview of sales team visits over the last 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartAreaInteractive data={visitsData} dataKey="visits" />
          </CardContent>
        </Card>
        
        {/* Second Graph: GeoTracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Geo-Tracking Activity
              {/* Salesman Filter for Geo-Tracking Graph */}
              <Select value={selectedSalesmanId} onValueChange={setSelectedSalesmanId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Salesman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salesmen</SelectItem>
                  {uniqueSalesmen.map(salesman => (
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
            {/* salespersonData is now rawGeoTrackingRecords */}
            {rawGeoTrackingRecords.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No geo-tracking reports found for your company.</div>
            ) : (
              <DataTableReusable columns={geoTrackingColumns} data={rawGeoTrackingRecords} />
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
            {dailyReports.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No daily visit reports found for your company.</div>
            ) : (
              <DataTableReusable columns={dailyReportsColumns} data={dailyReports} />
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

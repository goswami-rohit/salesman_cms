// src/app/dashboard/DashboardGraphs.tsx
'use client';

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

import { DataTableReusable } from '@/components/data-table-reusable';
import { DailyVisitsData, GeoTrackingData, GeoTrackingRecord, DailyVisitReportRecord } from './data-format';

// Define the columns for the geo-tracking data table
const geoTrackingColumns: ColumnDef<GeoTrackingRecord>[] = [
  { accessorKey: 'salesmanName', header: 'Salesman' },
  { accessorKey: 'recordedAt', header: 'Last Ping' },
  { accessorKey: 'totalDistanceTravelled', header: 'Distance (km)' },
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
  geoData: GeoTrackingData[];
  salespersonData: GeoTrackingRecord[];
  dailyReports: DailyVisitReportRecord[];
}

export default function DashboardGraphs({ visitsData, geoData, salespersonData, dailyReports }: DashboardGraphsProps) {
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
            <CardTitle>Geo-Tracking Activity</CardTitle>
            <CardDescription>
              Total distance travelled by the sales team per day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartAreaInteractive data={geoData} dataKey="distance" />
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
            <DataTableReusable columns={geoTrackingColumns} data={salespersonData} />
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
            <DataTableReusable columns={dailyReportsColumns} data={dailyReports} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

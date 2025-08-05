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

// Assuming you have a reusable data table component for generic data
import { DataTableReusable } from '@/components/data-table-reusable';

// Define the types for the data passed to the components
type GeoTrackingRecord = {
  id: string;
  salesmanName: string;
  recordedAt: string;
  totalDistanceTravelled: number | null;
  // ...other fields from your API route
};

// Define props for the DashboardGraphs component
interface DashboardGraphsProps {
  visitsData: { name: string; visits: number }[];
  geoData: { name: string; distance: number }[];
  salespersonData: GeoTrackingRecord[];
}

// Define the columns for the geo-tracking data table
const geoTrackingColumns: ColumnDef<GeoTrackingRecord>[] = [
  { accessorKey: 'salesmanName', header: 'Salesman' },
  { accessorKey: 'recordedAt', header: 'Last Ping' },
  { accessorKey: 'totalDistanceTravelled', header: 'Distance (km)' },
  // Add more columns as needed for the table view
];

export default function DashboardGraphs({ visitsData, geoData, salespersonData }: DashboardGraphsProps) {
  return (
    <Tabs defaultValue="graphs" className="space-y-4">
      <TabsList>
        <TabsTrigger value="graphs">Graphs</TabsTrigger>
        <TabsTrigger value="table">Sales Team Overview</TabsTrigger>
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
            {/* The `dataKey` should match the key in your data object */}
            {/* Assuming ChartAreaInteractive takes a 'data' and 'dataKey' prop */}
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
            {/* The `dataKey` should match the key in your data object */}
            <ChartAreaInteractive data={geoData} dataKey="distance" />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="table">
        <Card>
          <CardHeader>
            <CardTitle>Sales Team Activity Table</CardTitle>
            <CardDescription>
              Detailed view of the most recent geo-tracking data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* We will use a more generic data table component here */}
            <DataTableReusable columns={geoTrackingColumns} data={salespersonData} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

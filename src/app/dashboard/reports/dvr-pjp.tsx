// app/dashboard/reports/dvr-pjp.tsx
'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Calendar, ChevronUp, ChevronDown, Gauge, List } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { DataTableReusable } from '@/components/data-table-reusable';
import { ChartAreaInteractive } from '@/components/chart-area-reusable';
import { useDvrPjpData } from '@/components/data-comparison-calculation'; // corrected path

// --- Types aligned with shared Zod schemas + helper hook ---
interface PJPRecord {
  id: string;
  salesmanName: string;
  planDate: string; // YYYY-MM-DD
  areaToBeVisited: string;
  description?: string | null;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  status: string;             // 'COMPLETED' | 'PENDING' | 'CANCELLED'
  visitDealerName?: string | null;
}

interface DVRRecord {
  id: string;
  salesmanName: string;
  role: string;
  reportDate: string; // YYYY-MM-DD
  dealerType: string; // present in shared schema
  dealerName: string | null;
  subDealerName: string | null;
  location: string;        // present in shared schema
  latitude: number;        // present in shared schema
  longitude: number;       // present in shared schema
  todayOrderMt: number;
  todayCollectionRupees: number;
}

interface MoMComparisonMetrics {
  metric: string;
  thisMonthValue: number;
  lastMonthValue: number;
  changePercentage: number;
}

interface DVRvPJPAnalytics {
  targetAchievementPercentage: number;
  momMetrics: MoMComparisonMetrics[];
}

const DATE_FILTERS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: '365', label: 'Last Year' },
];

export default function DvrPjpReportPage() {
  const [days, setDays] = React.useState<string>('30');

  // Client-side fetch + compute (uses ONLY VERIFIED PJPs internally)
  const { loading, error, filteredPjps, filteredDvrs, analytics } = useDvrPjpData(Number(days));

  React.useEffect(() => {
    if (error) toast.error('Data Load Error', { description: error });
  }, [error]);

  // Chart data
  const chartData = React.useMemo(() => {
    if (!filteredPjps || !filteredDvrs) return [];
    const map = new Map<string, { name: string; dvrs: number; pjps: number }>();

    filteredDvrs.forEach((d:any) => {
      const key = d.reportDate;
      if (!map.has(key)) map.set(key, { name: key, dvrs: 0, pjps: 0 });
      map.get(key)!.dvrs += 1;
    });

    filteredPjps.forEach((p:any) => {
      const key = p.planDate;
      if (!map.has(key)) map.set(key, { name: key, dvrs: 0, pjps: 0 });
      map.get(key)!.pjps += 1;
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()
    );
  }, [filteredPjps, filteredDvrs]);

  // Columns — PJP
  const pjpColumns: ColumnDef<PJPRecord>[] = React.useMemo(() => [
    { accessorKey: 'planDate', header: 'Plan Date', cell: ({ row }) => new Date(row.original.planDate).toLocaleDateString() },
    { accessorKey: 'salesmanName', header: 'Salesman' },
    { accessorKey: 'areaToBeVisited', header: 'Area' },
    { accessorKey: 'visitDealerName', header: 'Dealer' },
    {
      accessorKey: 'status',
      header: 'Plan Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const variant = status === 'COMPLETED' ? 'default'
                      : status === 'PENDING'   ? 'secondary'
                      : 'destructive';
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'verificationStatus',
      header: 'Verification',
      cell: ({ row }) => {
        const status = row.original.verificationStatus;
        const variant = status === 'VERIFIED' ? 'default'
                      : status === 'PENDING'  ? 'secondary'
                      : 'destructive';
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
  ], []);

  // Columns — DVR (aligned to shared schema)
  const dvrColumns: ColumnDef<DVRRecord>[] = React.useMemo(() => [
    { accessorKey: 'reportDate', header: 'Report Date', cell: ({ row }) => new Date(row.original.reportDate).toLocaleDateString() },
    { accessorKey: 'salesmanName', header: 'Salesman' },
    { accessorKey: 'dealerName', header: 'Dealer Visited' },
    { accessorKey: 'dealerType', header: 'Type', cell: ({ row }) => <Badge variant="outline">{row.original.dealerType}</Badge> },
    { accessorKey: 'location', header: 'Location' },
    { accessorKey: 'todayOrderMt', header: 'Order (MT)', cell: ({ row }) => row.original.todayOrderMt.toFixed(2) },
    { accessorKey: 'todayCollectionRupees', header: 'Collection (₹)', cell: ({ row }) => `₹${row.original.todayCollectionRupees.toLocaleString('en-IN')}` },
  ], []);

  // Error UI
  if (error) {
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-3xl font-bold">DVR vs PJP Analytics</h1>
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6 text-red-700 font-medium">
            <p>Error: Failed to load analytics data: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold flex items-center gap-3">DVR vs PJP Analytics Report</h1>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Data</CardTitle>
          <CardDescription>
            Select a date range to filter the transactional tables below. Analytics are computed using <b>only VERIFIED PJP</b>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Period:</span>
          </div>
          <Select value={days} onValueChange={setDays} disabled={loading}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTERS.map(f => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading && <div className="text-center py-16 text-white font-semibold">Loading DVR vs PJP data...</div>}

      {!loading && analytics && filteredDvrs && filteredPjps && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-2">Key Performance Indicators</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Target Achievement */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Target Achievement (DVR vs PJP)</CardTitle>
                <Gauge className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-extrabold text-primary">
                  {analytics.targetAchievementPercentage.toFixed(2)}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredDvrs.length} actual visits vs. {filteredPjps.length} verified planned visits.
                </p>
              </CardContent>
            </Card>

            {/* MoM Cards */}
            {analytics.momMetrics.find((m:any) => m.metric.includes('DVR')) && (
              <MoMMetricCard metricData={analytics.momMetrics.find((m:any) => m.metric.includes('DVR'))!} />
            )}
            {analytics.momMetrics.find((m:any) => m.metric.includes('PJP')) && (
              <MoMMetricCard metricData={analytics.momMetrics.find((m:any) => m.metric.includes('PJP'))!} />
            )}
          </div>

          {/* Trend Chart */}
          <div className="pt-6">
            <ChartAreaInteractive
              data={chartData}
              dataKey="dvrs"
              title={`Daily DVR & Verified PJP Trends (Last ${days} Days)`}
            />
          </div>

          <Separator className="my-8" />

          {/* Tables */}
          <h2 className="text-2xl font-semibold border-b pb-2 pt-4">Transactional Data (Last {days} Days)</h2>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Daily Visit Reports (DVRs)</CardTitle>
                <CardDescription>Total DVRs reported in the last {days} days: {filteredDvrs.length}</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTableReusable
                  columns={dvrColumns}
                  data={filteredDvrs}
                  enableRowDragging={false}
                  onRowOrderChange={() => {}}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permanent Journey Plans (VERIFIED PJPs)</CardTitle>
                <CardDescription>Total VERIFIED PJPs in the last {days} days: {filteredPjps.length}</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTableReusable
                  columns={pjpColumns}
                  data={filteredPjps}
                  enableRowDragging={false}
                  onRowOrderChange={() => {}}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Reusable MoM Card ---
interface MoMMetricCardProps { metricData: MoMComparisonMetrics; }

const MoMMetricCard: React.FC<MoMMetricCardProps> = ({ metricData }) => {
  const isGrowth = metricData.changePercentage > 0;
  const isDecline = metricData.changePercentage < 0;
  const isNeutral = metricData.changePercentage === 0 || !isFinite(metricData.changePercentage);

  const Icon = isGrowth ? ChevronUp : isDecline ? ChevronDown : List;
  const changeColor = isGrowth ? 'text-green-500' : isDecline ? 'text-red-500' : 'text-gray-500';

  const changeText = isFinite(metricData.changePercentage)
    ? `${Math.abs(metricData.changePercentage).toFixed(2)}%`
    : 'N/A';

  const formattedValue = metricData.thisMonthValue.toLocaleString();
  const formattedLastMonthValue = metricData.lastMonthValue.toLocaleString();

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{metricData.metric} MoM</CardTitle>
        <Icon className={`h-6 w-6 ${changeColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-extrabold">{formattedValue}</div>
        <div className={`text-sm mt-1 flex items-center ${changeColor}`}>
          {isNeutral ? (
            <span className="font-semibold text-gray-500">No Change/N/A</span>
          ) : (
            <span className="font-semibold">
              {changeText} {isGrowth ? 'Increase' : 'Decrease'}
            </span>
          )}
          <span className="ml-1 text-muted-foreground"> vs. Last Month ({formattedLastMonthValue})</span>
        </div>
      </CardContent>
    </Card>
  );
};

// app/dashboard/reports/sales-dvr.tsx
'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { IconFilter, IconRefresh, IconSearch, IconListDetails, IconTrendingUp } from '@tabler/icons-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { DataTableReusable } from '@/components/data-table-reusable';
import { MultiSelect } from '@/components/multi-select';

import {
  useDvrPjpData,
  filterByDateRange,
  calculateTotalSalesValue,
  calculateChange,
  type SalesRecord,
  type DVRRecord,
} from '@/components/data-comparison-calculation';

/* =========================
   Columns
========================= */
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

const salesColumns: ColumnDef<SalesRecord>[] = [
  {
    accessorKey: 'orderDate',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Order Date
        <IconFilter className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.orderDate}</span>,
    enableHiding: false,
  },
  { accessorKey: 'salesmanName', header: 'Salesman', cell: ({ row }) => <div className="font-medium text-sm">{row.original.salesmanName}</div> },
  { accessorKey: 'region', header: 'Region', cell: ({ row }) => <Badge variant="outline">{row.original.region || 'N/A'}</Badge> },
  { accessorKey: 'area', header: 'Area', cell: ({ row }) => <Badge variant="outline">{row.original.area || 'N/A'}</Badge> },
  { accessorKey: 'dealerName', header: 'Dealer', cell: ({ row }) => <span className="text-sm">{row.original.dealerName}</span> },
  {
    accessorKey: 'dealerType',
    header: 'Type',
    cell: ({ row }) => <Badge className="bg-sky-500/10 text-sky-600 hover:bg-sky-500/20">{row.original.dealerType}</Badge>,
  },
  {
    accessorKey: 'orderTotal',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="justify-end text-right w-full">
        Order Total
        <IconFilter className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-right font-semibold text-primary">{formatCurrency(row.original.orderTotal)}</div>,
  },
  {
    accessorKey: 'receivedPayment',
    header: 'Received',
    cell: ({ row }) => <div className="text-right text-sm text-green-600">{formatCurrency(row.original.receivedPayment ?? 0)}</div>,
  },
  {
    accessorKey: 'pendingPayment',
    header: 'Pending',
    cell: ({ row }) => <div className="text-right text-sm text-red-600">{formatCurrency(row.original.pendingPayment ?? 0)}</div>,
  },
  { accessorKey: 'orderQty', header: 'Qty', cell: ({ row }) => <div className="text-center font-mono text-sm">{row.original.orderQty ?? 0}</div> },
  { accessorKey: 'paymentMode', header: 'Payment Mode', cell: ({ row }) => <span className="text-xs text-gray-600">{row.original.paymentMode ?? '—'}</span>, enableSorting: false },
  { accessorKey: 'orderPartyName', header: 'Party Name', enableSorting: false, enableHiding: true },
];

/* =========================
   Filters
========================= */
const TIME_PERIOD_OPTIONS = [
  { label: 'Last 7 Days', value: '7' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'Last 90 Days', value: '90' },
  { label: 'All Time', value: 'all' },
];

/* =========================
   Component
========================= */
export default function SalesDVRReportPage() {
  // Pull raw arrays from the working endpoints via client hook
  const { loading, error, sales, dvrs, refetch } = useDvrPjpData(365);

  // UI filters
  const [timePeriod, setTimePeriod] = React.useState('30');
  const [salesmanFilter, setSalesmanFilter] = React.useState<string[]>([]);
  const [regionFilter, setRegionFilter] = React.useState<string[]>([]);
  const [areaFilter, setAreaFilter] = React.useState<string[]>([]);
  const [dealerTypeFilter, setDealerTypeFilter] = React.useState<string[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    if (error) toast.error('Failed to load sales/DVR data.', { description: error });
  }, [error]);

  /* =========================
     Unique options
  ========================= */
  const uniqueOptions = React.useMemo(() => {
    const salesmen = new Set<string>();
    const regions = new Set<string>();
    const areas = new Set<string>();
    const dealerTypes = new Set<string>();

    (sales ?? []).forEach(d => {
      if (d.salesmanName) salesmen.add(d.salesmanName);
      if (d.region) regions.add(d.region);
      if (d.area) areas.add(d.area);
      if (d.dealerType) dealerTypes.add(d.dealerType);
    });

    return {
      salesmen: Array.from(salesmen).sort().map(s => ({ label: s, value: s })),
      regions: Array.from(regions).sort().map(r => ({ label: r, value: r })),
      areas: Array.from(areas).sort().map(a => ({ label: a, value: a })),
      dealerTypes: Array.from(dealerTypes).sort().map(dt => ({ label: dt, value: dt })),
    };
  }, [sales]);

  /* =========================
     Time window helpers
  ========================= */
  const daysNumber = React.useMemo(() => {
    const n = parseInt(timePeriod, 10);
    return Number.isFinite(n) ? n : NaN;
  }, [timePeriod]);

  const salesInWindow = React.useMemo(() => {
    if (!sales) return [];
    if (timePeriod === 'all') return sales;
    if (!Number.isFinite(daysNumber)) return sales;
    return filterByDateRange<SalesRecord>(sales, daysNumber);
  }, [sales, timePeriod, daysNumber]);

  const dvrsInWindow = React.useMemo(() => {
    if (!dvrs) return [];
    if (timePeriod === 'all') return dvrs;
    if (!Number.isFinite(daysNumber)) return dvrs;
    return filterByDateRange<DVRRecord>(dvrs, daysNumber);
  }, [dvrs, timePeriod, daysNumber]);

  /* =========================
     Client-side filters
  ========================= */
  const filteredData = React.useMemo(() => {
    let temp = [...salesInWindow];

    if (salesmanFilter.length) temp = temp.filter(r => salesmanFilter.includes(r.salesmanName));
    if (regionFilter.length) temp = temp.filter(r => regionFilter.includes(r.region));
    if (areaFilter.length) temp = temp.filter(r => areaFilter.includes(r.area));
    if (dealerTypeFilter.length) temp = temp.filter(r => dealerTypeFilter.includes(r.dealerType));

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      temp = temp.filter(record =>
        Object.values(record).some(value => String(value).toLowerCase().includes(s))
      );
    }

    return temp;
  }, [salesInWindow, salesmanFilter, regionFilter, areaFilter, dealerTypeFilter, searchTerm]);

  /* =========================
     Analytics (Sales vs DVR)
  ========================= */
  const totalSalesValue = React.useMemo(() => calculateTotalSalesValue(filteredData), [filteredData]);
  const totalVisits = dvrsInWindow.length;
  const salesPerVisit = totalVisits > 0 ? totalSalesValue / totalVisits : 0;

  const mom = React.useMemo(() => {
    if (!sales || !dvrs) return null;

    const now = new Date();
    const thisY = now.getFullYear();
    const thisM = now.getMonth();
    const last = new Date(thisY, thisM - 1, 1);
    const lastY = last.getFullYear();
    const lastM = last.getMonth();

    const isThisMonth = (iso: string) => {
      const d = new Date(iso);
      return d.getFullYear() === thisY && d.getMonth() === thisM;
    };
    const isLastMonth = (iso: string) => {
      const d = new Date(iso);
      return d.getFullYear() === lastY && d.getMonth() === lastM;
    };

    const thisMonthSales = sales.filter(s => isThisMonth(s.orderDate));
    const lastMonthSales = sales.filter(s => isLastMonth(s.orderDate));
    const thisMonthSalesValue = calculateTotalSalesValue(thisMonthSales);
    const lastMonthSalesValue = calculateTotalSalesValue(lastMonthSales);

    const thisMonthDvrs = dvrs.filter(d => isThisMonth(d.reportDate)).length;
    const lastMonthDvrs = dvrs.filter(d => isLastMonth(d.reportDate)).length;

    return {
      sales: {
        thisMonthValue: thisMonthSalesValue,
        lastMonthValue: lastMonthSalesValue,
        changePercentage: calculateChange(thisMonthSalesValue, lastMonthSalesValue),
      },
      dvrs: {
        thisMonthValue: thisMonthDvrs,
        lastMonthValue: lastMonthDvrs,
        changePercentage: calculateChange(thisMonthDvrs, lastMonthDvrs),
      },
    };
  }, [sales, dvrs]);

  /* =========================
     Error UI (match DVR–PJP page look)
  ========================= */
  if (error) {
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-3xl font-bold">Sales vs DVR</h1>
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6 text-red-700 font-medium">
            <p>Error: {error}</p>
            <p className="text-sm mt-1">Please ensure you have the correct permissions to view this data.</p>
            <Button onClick={refetch} className="mt-4" variant="outline">
              <IconRefresh className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* =========================
     Loading UI
  ========================= */
  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <CardTitle className="h-6 bg-gray-200 w-1/4 rounded" />
            <CardDescription className="h-4 bg-gray-200 w-1/2 rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-gray-100 rounded" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* =========================
     Main UI
  ========================= */
  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md">
          <CardHeader><CardTitle>Total Sales (Selected)</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold text-primary">
            {formatCurrency(totalSalesValue)}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader><CardTitle>Total Visits (Selected)</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{totalVisits}</CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader><CardTitle>Sales per Visit</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold text-green-600">
            {formatCurrency(salesPerVisit)}
          </CardContent>
        </Card>
      </div>

      {/* MoM */}
      {mom && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>MoM: Sales Value</CardTitle>
              <IconTrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">
                This Month: <span className="font-semibold">{formatCurrency(mom.sales.thisMonthValue)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Last Month: {formatCurrency(mom.sales.lastMonthValue)}
              </div>
              <div className={`mt-2 font-semibold ${mom.sales.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {mom.sales.changePercentage.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>MoM: DVR Count</CardTitle>
              <IconTrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg">
                This Month: <span className="font-semibold">{mom.dvrs.thisMonthValue}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Last Month: {mom.dvrs.lastMonthValue}
              </div>
              <div className={`mt-2 font-semibold ${mom.dvrs.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {mom.dvrs.changePercentage.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header + Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-3 text-primary">
            <IconListDetails className="h-7 w-7" />
            Raw Sales Order DVR Report
          </CardTitle>
          <CardDescription>
            Detailed breakdown of all sales orders (DVR). Client-side filters + analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-secondary/10">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-full md:w-40 bg-white">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIOD_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative grow">
              <Input
                placeholder="Search all fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white"
              />
              <IconSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            <MultiSelect
              options={uniqueOptions.salesmen}
              selectedValues={salesmanFilter}
              onValueChange={setSalesmanFilter}
              placeholder="Filter Salesman"
              className="w-full md:w-[200px]"
            />
            <MultiSelect
              options={uniqueOptions.regions}
              selectedValues={regionFilter}
              onValueChange={setRegionFilter}
              placeholder="Filter Region"
              className="w-full md:w-40"
            />
            <MultiSelect
              options={uniqueOptions.areas}
              selectedValues={areaFilter}
              onValueChange={setAreaFilter}
              placeholder="Filter Area"
              className="w-full md:w-40"
            />
            <MultiSelect
              options={uniqueOptions.dealerTypes}
              selectedValues={dealerTypeFilter}
              onValueChange={setDealerTypeFilter}
              placeholder="Filter Dealer Type"
              className="w-full md:w-[180px]"
            />

            <Button
              variant="destructive"
              onClick={() => {
                setSalesmanFilter([]); setRegionFilter([]); setAreaFilter([]);
                setDealerTypeFilter([]); setSearchTerm(''); setTimePeriod('30');
              }}
            >
              Clear All
            </Button>
          </div>

          <Separator className="mb-6" />

          {/* Table */}
          <div className="text-sm font-medium mb-4 text-gray-600">
            Showing {filteredData.length} of {(salesInWindow ?? []).length} records (window), from {(sales ?? []).length} total.
          </div>

          {filteredData.length > 0 ? (
            <DataTableReusable
              columns={salesColumns}
              data={filteredData}
              enableRowDragging={false}
              onRowOrderChange={() => {}}
            />
          ) : (
            <div className="text-center text-gray-500 py-12 border border-dashed rounded-lg">
              <p className="font-medium">No sales records match your current filters or time period.</p>
              <p className="text-sm mt-1">Try adjusting the filters or selecting “All Time”.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

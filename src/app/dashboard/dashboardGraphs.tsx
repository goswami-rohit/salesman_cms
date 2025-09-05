// src/app/dashboard/dashboardGraphs.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColumnDef } from '@tanstack/react-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DataTableReusable } from '@/components/data-table-reusable';
import { ChartAreaInteractive } from '@/components/chart-area-reusable';

import {
  RawGeoTrackingRecord,
  RawDailyVisitReportRecord,
  rawGeoTrackingSchema,
  rawDailyVisitReportSchema,
} from './data-format';

// Sales roles after your migration
const SALES_ROLES = ['junior-executive', 'executive', 'senior-executive'] as const;
type SalesRole = (typeof SALES_ROLES)[number] | 'all';

type SlimUser = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;               // lowercased in your API
  salesmanLoginId: string | null;
};

type UsersApiResponse = {
  users: SlimUser[];
  currentUser: { role: string; companyName?: string | null; region?: string | null; area?: string | null };
};

// Geo table columns
const geoTrackingColumns: ColumnDef<RawGeoTrackingRecord>[] = [
  { accessorKey: 'salesmanName', header: 'Salesman' },
  {
    accessorKey: 'recordedAt',
    header: 'Last Ping',
    cell: ({ row }) =>
      new Date(row.original.recordedAt).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }),
  },
  {
    accessorKey: 'totalDistanceTravelled',
    header: 'Distance (km)',
    cell: ({ row }) => `${row.original.totalDistanceTravelled?.toFixed(2) ?? 'N/A'} km`,
  },
  { accessorKey: 'employeeId', header: 'Employee ID' },
  { accessorKey: 'latitude', header: 'Latitude' },
  { accessorKey: 'longitude', header: 'Longitude' },
  { accessorKey: 'locationType', header: 'Location Type' },
  { accessorKey: 'appState', header: 'App State' },
];

// DVR table columns
const dailyReportsColumns: ColumnDef<RawDailyVisitReportRecord>[] = [
  { accessorKey: 'salesmanName', header: 'Salesman' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'reportDate', header: 'Report Date' },
  { accessorKey: 'dealerName', header: 'Dealer Name', cell: info => info.getValue() || 'N/A' },
  { accessorKey: 'visitType', header: 'Visit Type' },
  {
    accessorKey: 'todayCollectionRupees',
    header: 'Collection (₹)',
    cell: ({ row }) => `₹${row.original.todayCollectionRupees?.toFixed(2) ?? 'N/A'}`,
  },
  {
    accessorKey: 'feedbacks',
    header: 'Feedbacks',
    cell: info => <span className="max-w-[250px] truncate block">{info.getValue() as string}</span>,
  },
];

type GeoTrackingData = { name: string; distance: number };
type DailyCollectionData = { name: string; collection: number };

export default function DashboardGraphs() {
  const [rawGeoTrackingRecords, setRawGeoTrackingRecords] = useState<RawGeoTrackingRecord[]>([]);
  const [rawDailyReports, setRawDailyReports] = useState<RawDailyVisitReportRecord[]>([]);
  const [users, setUsers] = useState<SlimUser[]>([]); // ← source of truth for the dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global filters
  const [selectedRole, setSelectedRole] = useState<SalesRole>('all');
  const [selectedSalesman, setSelectedSalesman] = useState<string | 'all'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      // Pull geo, dvr, and users
      const [geoRes, dailyRes, usersRes] = await Promise.all([
        fetch(`${baseUrl}/api/dashboardPagesAPI/slm-geotracking`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/dashboardPagesAPI/daily-visit-reports`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/users`, { cache: 'no-store' }),
      ]);

      if (!geoRes.ok) throw new Error(`Geo API: ${geoRes.status} - ${await geoRes.text()}`);
      if (!dailyRes.ok) throw new Error(`DVR API: ${dailyRes.status} - ${await dailyRes.text()}`);
      if (!usersRes.ok) throw new Error(`Users API: ${usersRes.status} - ${await usersRes.text()}`);

      const [geoData, dailyData, usersData] = await Promise.all([geoRes.json(), dailyRes.json(), usersRes.json()]);

      const validatedGeo = rawGeoTrackingSchema.array().parse(geoData);
      setRawGeoTrackingRecords(validatedGeo);

      const validatedDaily = rawDailyVisitReportSchema.array().parse(dailyData);
      setRawDailyReports(validatedDaily);

      const u = (usersData as UsersApiResponse).users ?? [];
      setUsers(u);

      toast.success('Dashboard data loaded');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.error('Dashboard load error:', e);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const journeyEndRecords = useMemo(
    () => rawGeoTrackingRecords.filter(
      r => r.appState === 'completed' || r.appState === 'journey_completed'
    ),
    [rawGeoTrackingRecords]
  );

  // Build salesman list from USERS endpoint, filtered by selected role
  const salesmenList = useMemo(() => {
    const pool = users.filter(u =>
      selectedRole === 'all'
        ? SALES_ROLES.includes(u.role as any)
        : u.role?.toLowerCase() === selectedRole
    );

    const unique = new Map<string, { id: string; name: string }>();
    pool.forEach(u => {
      const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || u.salesmanLoginId || `User-${u.id}`;
      // id by name is fine for dropdown; graphs filter by name too
      unique.set(name, { id: name, name });
    });

    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [users, selectedRole]);

  // If current selectedSalesman is not present after role change, reset to 'all'
  useEffect(() => {
    if (selectedSalesman !== 'all' && !salesmenList.some(s => s.id === selectedSalesman)) {
      setSelectedSalesman('all');
    }
  }, [salesmenList, selectedSalesman]);

  // Filter DVR by selected role for the collection graph aggregation
  const roleFilteredDailyReports = useMemo(() => {
    if (selectedRole === 'all') return rawDailyReports;
    return rawDailyReports.filter(r => r.role?.toLowerCase() === selectedRole);
  }, [rawDailyReports, selectedRole]);

  // Geo graph data filtered by selected salesman (by name)
  const geoGraphData: GeoTrackingData[] = useMemo(() => {
    let filtered = journeyEndRecords;
    if (selectedSalesman !== 'all') {
      filtered = filtered.filter(r => r.salesmanName === selectedSalesman);
    }
    const agg: Record<string, number> = {};
    filtered.forEach(item => {
      const key = new Date(item.recordedAt).toISOString().slice(0, 10);
      agg[key] = (agg[key] || 0) + (item.totalDistanceTravelled ?? 0);
    });
    return Object.keys(agg).sort().map(k => ({ name: k, distance: agg[k] }));
  }, [journeyEndRecords, selectedSalesman]);

  // Daily collection graph data filtered by role + salesman
  const collectionGraphData: DailyCollectionData[] = useMemo(() => {
    let filtered = roleFilteredDailyReports;
    if (selectedSalesman !== 'all') {
      filtered = filtered.filter(r => r.salesmanName === selectedSalesman);
    }
    const agg: Record<string, number> = {};
    filtered.forEach(item => {
      const key = item.reportDate;
      agg[key] = (agg[key] || 0) + (item.todayCollectionRupees ?? 0);
    });
    return Object.keys(agg).sort().map(k => ({ name: k, collection: agg[k] }));
  }, [roleFilteredDailyReports, selectedSalesman]);

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

      {/* UNIVERSAL FILTERS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap gap-3 items-center justify-between">
            <span>Filters</span>
            <div className="flex flex-wrap gap-3">
              {/* Role */}
              <Select value={selectedRole} onValueChange={v => setSelectedRole(v as SalesRole)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="junior-executive">Junior Executive</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="senior-executive">Senior Executive</SelectItem>
                </SelectContent>
              </Select>

              {/* Salesman from USERS list */}
              <Select value={selectedSalesman} onValueChange={setSelectedSalesman}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Select Salesman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salesmen</SelectItem>
                  {salesmenList.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No salesmen for selected role</div>
                  ) : (
                    salesmenList.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
          <CardDescription>Role and Salesman filters apply to all graphs below.</CardDescription>
        </CardHeader>
      </Card>

      {/* GRAPHS */}
      <TabsContent value="graphs" className="space-y-4">
        {/* Daily Collection */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Collection Reports</CardTitle>
            <CardDescription>Total collection (₹) per day.</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <ChartAreaInteractive data={collectionGraphData} dataKey="collection" />
            </div>
          </CardContent>
        </Card>

        {/* Geo-Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Geo-Tracking Activity</CardTitle>
            <CardDescription>Total distance travelled per day.</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <ChartAreaInteractive data={geoGraphData} dataKey="distance" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TABLES */}
      <TabsContent value="geo-table">
        <Card>
          <CardHeader>
            <CardTitle>Sales Team Geo-Tracking Table</CardTitle>
            <CardDescription>Most recent geo-tracking data.</CardDescription>
          </CardHeader>
          <CardContent>
            {journeyEndRecords.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No geo-tracking reports found.</div>
            ) : (
              <DataTableReusable columns={geoTrackingColumns} data={journeyEndRecords} />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="daily-reports-table">
        <Card>
          <CardHeader>
            <CardTitle>Daily Visit Reports Table</CardTitle>
            <CardDescription>All submitted daily visit reports.</CardDescription>
          </CardHeader>
          <CardContent>
            {rawDailyReports.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No daily visit reports found.</div>
            ) : (
              <DataTableReusable columns={dailyReportsColumns} data={rawDailyReports} />
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

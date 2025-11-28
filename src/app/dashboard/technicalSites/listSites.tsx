// src/app/dashboard/technicalSites/listSites.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTableReusable } from '@/components/data-table-reusable';

import { technicalSiteSchema } from '@/lib/shared-zod-schema';

type TechnicalSiteRecord = z.infer<typeof technicalSiteSchema>;

const API_URL = `/api/dashboardPagesAPI/technical-sites`;

export default function ListSitesPage() {
  const [sites, setSites] = useState<TechnicalSiteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');

  // Derived lists for dropdowns
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [availableStages, setAvailableStages] = useState<string[]>([]);

  // --- Fetch Sites ---
  const fetchSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Parse with Zod
      const validatedSites = z.array(technicalSiteSchema).parse(data);
      setSites(validatedSites);

      // Extract unique regions and stages for filters
      const regions = new Set<string>();
      const stages = new Set<string>();
      validatedSites.forEach(s => {
        if (s.region) regions.add(s.region);
        if (s.stageOfConstruction) stages.add(s.stageOfConstruction);
      });
      setAvailableRegions(Array.from(regions).sort());
      setAvailableStages(Array.from(stages).sort());

      toast.success('Technical sites loaded successfully!');
    } catch (e: any) {
      console.error('Failed to fetch sites:', e);
      const message = e instanceof z.ZodError
        ? 'Data validation failed.'
        : (e.message || 'An unknown error occurred.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // --- Client-side Filtering ---
  const filteredSites = React.useMemo(() => {
    return sites.filter((site) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (site.siteName || '').toLowerCase().includes(q) ||
        (site.concernedPerson || '').toLowerCase().includes(q) ||
        (site.phoneNo || '').includes(q);

      const matchesRegion = filterRegion === 'all' || site.region === filterRegion;
      const matchesStage = filterStage === 'all' || site.stageOfConstruction === filterStage;

      return matchesSearch && matchesRegion && matchesStage;
    });
  }, [sites, searchQuery, filterRegion, filterStage]);

  // --- Columns ---
  const columns: ColumnDef<TechnicalSiteRecord>[] = [
    { accessorKey: 'siteName', header: 'Site Name' },
    { accessorKey: 'concernedPerson', header: 'Contact Person' },
    { accessorKey: 'phoneNo', header: 'Phone' },
    { accessorKey: 'region', header: 'Region', cell: info => info.getValue() || '-' },
    { accessorKey: 'area', header: 'Area', cell: info => info.getValue() || '-' },
    { accessorKey: 'siteType', header: 'Type', cell: info => info.getValue() || '-' },
    { 
      accessorKey: 'stageOfConstruction', 
      header: 'Stage',
      cell: info => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {info.getValue() as string || 'N/A'}
        </span>
      )
    },
    { 
      accessorKey: 'createdAt', 
      header: 'Created On',
      cell: info => new Date(info.getValue() as string).toLocaleDateString()
    },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading technical sites...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-12">
        <p>Error: {error}</p>
        <button onClick={fetchSites} className="underline mt-2">Retry</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-card border rounded-lg">
        
        {/* Search */}
        <div className="flex flex-col space-y-1 w-full sm:w-[250px]">
          <label className="text-sm font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Name, Person, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Region Filter */}
        <div className="flex flex-col space-y-1 w-full sm:w-[200px]">
          <label className="text-sm font-medium text-muted-foreground">Region</label>
          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {availableRegions.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stage Filter */}
        <div className="flex flex-col space-y-1 w-full sm:w-[200px]">
          <label className="text-sm font-medium text-muted-foreground">Stage</label>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {availableStages.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* Table */}
      {sites.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No technical sites found.</div>
      ) : (
        <div className="bg-card p-6 rounded-lg border border-border">
          <DataTableReusable
            columns={columns}
            data={filteredSites}
            enableRowDragging={false}
            onRowOrderChange={() => {}}
          />
        </div>
      )}
    </div>
  );
}
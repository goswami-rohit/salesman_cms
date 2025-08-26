// src/app/dashboard/salesAndCollectionReports/page.tsx
'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import CollectionReportsTable from './collectionReports';
import SalesReportsTable from './salesReports';

/**
 * Main dashboard page for Sales and Collection reports.
 * Uses a tabbed interface with a consistent layout and styling.
 */
const SalesAndCollectionReportsPage = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Sales & Collection Reports
        </h2>
      </div>
      <p className="text-neutral-500">
        View and analyze sales and collection data from your team.
      </p>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Reports</TabsTrigger>
          <TabsTrigger value="collection">Collection Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="space-y-4">
          <SalesReportsTable />
        </TabsContent>
        <TabsContent value="collection" className="space-y-4">
          <CollectionReportsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesAndCollectionReportsPage;

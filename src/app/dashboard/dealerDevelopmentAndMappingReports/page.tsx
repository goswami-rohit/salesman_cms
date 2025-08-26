'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import the report pages
import DealerBrandMappingPage from './dealerBrandMapping';
import DealerDevelopmentPage from './dealerDevelopment';

/**
 * Main page component for Dealer Development and Mapping Reports.
 * It uses a tabbed interface to display different reports, with a consistent
 * layout and styling based on the Team Overview page.
 */
export default function DealerReportsMainPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dealer Reports</h2>
      </div>
      <p className="text-neutral-500">
        View reports on brand mapping and dealer development progress.
      </p>

      <Tabs defaultValue="dealer-brand-mapping" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dealer-brand-mapping">Brand Mapping</TabsTrigger>
          <TabsTrigger value="dealer-development">Development</TabsTrigger>
        </TabsList>
        <TabsContent value="dealer-brand-mapping" className="space-y-4">
          <DealerBrandMappingPage />
        </TabsContent>
        <TabsContent value="dealer-development" className="space-y-4">
          <DealerDevelopmentPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

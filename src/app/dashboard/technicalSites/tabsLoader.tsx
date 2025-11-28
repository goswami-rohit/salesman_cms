// src/app/dashboard/technicalSites/tabsLoader.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ListSitesPage from '@/app/dashboard/technicalSites/listSites';

interface TechnicalSitesTabsProps {
  canViewSites: boolean;
}

export function TechnicalSitesTabs({
  canViewSites,
}: TechnicalSitesTabsProps) {

  // Default tab logic
  let defaultTab = "";
  if (canViewSites) defaultTab = "listSites";

  if (!defaultTab) {
    return <div>No access to any tabs.</div>;
  }

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList>
        {canViewSites && (
          <TabsTrigger value="listSites">List Sites</TabsTrigger>
        )}
      </TabsList>

      {/* --- Tab Content --- */}
      {canViewSites && (
        <TabsContent value="listSites" className="space-y-4">
          <ListSitesPage />
        </TabsContent>
      )}
    </Tabs>
  );
}
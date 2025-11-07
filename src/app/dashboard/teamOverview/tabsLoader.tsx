// src/app/dashboard/teamOverview/tabsLoader.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamTabContent } from './teamTabContent';
import { SalesmanLiveLocation } from './salesmanLiveLocation';

// This component receives the permissions as props
// from the server component
interface TeamOverviewTabsProps {
  canSeeTeamView: boolean;
  canSeeLiveLocation: boolean;
}

export function TeamOverviewTabs({
  canSeeTeamView,
  canSeeLiveLocation,
}: TeamOverviewTabsProps) {

  // The logic for the default tab now lives here
  const defaultTab = canSeeTeamView ? 'team-view' : 'salesman-live-location';

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList>
        {/* Conditionally render the "Team View" tab button */}
        {canSeeTeamView && (
          <TabsTrigger value="team-view">
            Team View
          </TabsTrigger>
        )}

        {/* Conditionally render the "Live Location" tab button */}
        {canSeeLiveLocation && (
          <TabsTrigger value="salesman-live-location">
            Salesman Live Location
          </TabsTrigger>
        )}
      </TabsList>

      {/* Conditionally render the "Team View" tab content */}
      {canSeeTeamView && (
        <TabsContent value="team-view" className="space-y-4">
          <TeamTabContent />
        </TabsContent>
      )}

      {/* Conditionally render the "Live Location" tab content */}
      {canSeeLiveLocation && (
        <TabsContent value="salesman-live-location" className="space-y-4">
          <SalesmanLiveLocation />
        </TabsContent>
      )}
    </Tabs>
  );
}
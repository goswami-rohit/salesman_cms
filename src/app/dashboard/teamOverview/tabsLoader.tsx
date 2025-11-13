// src/app/dashboard/teamOverview/tabsLoader.tsx
'use client';

import React, { useState, useEffect } from 'react'; // 💡 Import useState and useEffect
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamTabContent } from './teamTabContent';
import { SalesmanLiveLocation } from './salesmanLiveLocation';
import { Loader2 } from 'lucide-react'; // Optional: for loading indicator

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

  // 1. State to track if the component has mounted client-side
  const [isMounted, setIsMounted] = useState(false);

  // 2. Set mount state true after initial client render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // The logic for the default tab now lives here
  const defaultTab = canSeeTeamView ? 'team-view' : 'salesman-live-location';

  // 3. Render placeholder/null during SSR and initial client cycle
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 4. Render the full, dynamic component only after client mount
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
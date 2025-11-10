// src/app/dashboard/masonpcSide/tabsLoader.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MasonPcPage from '@/app/dashboard/masonpcSide/masonpc';
import TsoMeetingsPage from '@/app/dashboard/masonpcSide/tsoMeetings';
import SchemesOffersPage from '@/app/dashboard/masonpcSide/schemesOffers';
import MasonOnSchemesPage from '@/app/dashboard/masonpcSide/masonOnSchemes';
import MasonOnMeetingsPage from '@/app/dashboard/masonpcSide/masonOnMeetings';

// This component receives the permissions as props
// from the server component (page.tsx)
interface MasonPcTabsProps {
  canSeeMasonPc: boolean;
  canSeeTsoMeetings: boolean;
  canSeeSchemesOffers: boolean;
  canSeeMasonOnSchemes: boolean;
  canSeeMasonOnMeetings: boolean;
}

export function MasonPcTabs({
  canSeeMasonPc,
  canSeeTsoMeetings,
  canSeeSchemesOffers,
  canSeeMasonOnSchemes,
  canSeeMasonOnMeetings,
}: MasonPcTabsProps) {

  // Determine the default tab based on the first permission they have
  let defaultTab = "";
  if (canSeeMasonPc) defaultTab = "masonPc";
  else if (canSeeTsoMeetings) defaultTab = "tsoMeetings";
  else if (canSeeSchemesOffers) defaultTab = "schemesOffers";
  else if (canSeeMasonOnSchemes) defaultTab = "masonOnSchemes";
  else if (canSeeMasonOnMeetings) defaultTab = "masonOnMeetings";

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList>
        {canSeeMasonPc && (
          <TabsTrigger value="masonPc">Mason - Petty Contractors</TabsTrigger>
        )}
        {canSeeTsoMeetings && (
          <TabsTrigger value="tsoMeetings">TSO Meetings</TabsTrigger>
        )}
        {canSeeSchemesOffers && (
          <TabsTrigger value="schemesOffers">Schemes & Offers</TabsTrigger>
        )}
         {canSeeMasonOnSchemes && (
          <TabsTrigger value="masonOnSchemes">Mason on Schemes</TabsTrigger>
        )}
         {canSeeMasonOnMeetings && (
          <TabsTrigger value="masonOnMeetings">Mason on Meetings</TabsTrigger>
        )}
      </TabsList>

      {/* --- Tab Content --- */}
      {canSeeMasonPc && (
        <TabsContent value="masonPc" className="space-y-4">
          <MasonPcPage />
        </TabsContent>
      )}
      {canSeeTsoMeetings && (
        <TabsContent value="tsoMeetings" className="space-y-4">
          <TsoMeetingsPage />
        </TabsContent>
      )}
      {canSeeSchemesOffers && (
        <TabsContent value="schemesOffers" className="space-y-4">
          <SchemesOffersPage />
        </TabsContent>
      )}
      {canSeeMasonOnSchemes && (
        <TabsContent value="masonOnSchemes" className="space-y-4">
          <MasonOnSchemesPage />
        </TabsContent>
      )}
      {canSeeMasonOnMeetings && (
        <TabsContent value="masonOnMeetings" className="space-y-4">
          <MasonOnMeetingsPage />
        </TabsContent>
      )}
    </Tabs>
  );
}
// src/app/dashboard/teamOverview/page.tsx
'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamTabContent } from './teamTabContent';
import { DVRTabContent } from './dvrTabContent';
import { TVRTabContent } from './tvrTabContent';

export default function TeamOverviewPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Team Overview</h2>
      </div>
      <p className="text-neutral-500">
        View detailed reports and the management hierarchy of your sales team.
      </p>

      <Tabs defaultValue="team-view" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team-view">Team View</TabsTrigger>
          <TabsTrigger value="daily-reports">Daily Visit Reports</TabsTrigger>
          <TabsTrigger value="technical-reports">Technical Visit Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="team-view" className="space-y-4">
          <TeamTabContent />
        </TabsContent>
        <TabsContent value="daily-reports" className="space-y-4">
          <DVRTabContent />
        </TabsContent>
        <TabsContent value="technical-reports" className="space-y-4">
          <TVRTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
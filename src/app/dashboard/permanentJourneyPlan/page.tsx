// src/app/dashboard/permanentJourneyPlan/page.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import the report components
import PJPListPage from './pjpList';
import PJPVerifyPage from './pjpVerify';


export default function ScoresAndRatingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Permanent Journey Plan
        </h2>
      </div>
      <p className="text-neutral-500">
        View and Manage Executive made PJPs here.
      </p>
      <Tabs defaultValue="pjpList" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pjpList">PJP List</TabsTrigger>
          <TabsTrigger value="pjpVerify">PJP Verify</TabsTrigger>
        </TabsList>
        <TabsContent value="pjpList" className="space-y-4">
          <PJPListPage />
        </TabsContent>
        <TabsContent value="pjpVerify" className="space-y-4">
          <PJPVerifyPage/>
        </TabsContent>
      </Tabs>
    </div>
  );
}

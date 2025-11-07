// src/app/dashboard/permanentJourneyPlan/tabsLoader.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PJPListPage from './pjpList';
import PJPVerifyPage from './pjpVerify';

// This component receives the permissions as props
// from the server component (page.tsx)
interface PermanentJourneyPlanTabsProps {
  canSeePjpList: boolean;
  canSeePjpVerify: boolean;
}

export function PermanentJourneyPlanTabs({
  canSeePjpList,
  canSeePjpVerify,
}: PermanentJourneyPlanTabsProps) {

  // The logic for the default tab now lives here
  const defaultTab = canSeePjpList ? 'pjpList' : 'pjpVerify';

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList>
        {/* Conditionally render the "PJP List" tab button */}
        {canSeePjpList && (
          <TabsTrigger value="pjpList">PJP List</TabsTrigger>
        )}

        {/* Conditionally render the "PJP Verify" tab button */}
        {canSeePjpVerify && (
          <TabsTrigger value="pjpVerify">PJP Verify</TabsTrigger>
        )}
      </TabsList>

      {/* Conditionally render the "PJP List" tab content */}
      {canSeePjpList && (
        <TabsContent value="pjpList" className="space-y-4">
          <PJPListPage />
        </TabsContent>
      )}

      {/* Conditionally render the "PJP Verify" tab content */}
      {canSeePjpVerify && (
        <TabsContent value="pjpVerify" className="space-y-4">
          <PJPVerifyPage />
        </TabsContent>
      )}
    </Tabs>
  );
}
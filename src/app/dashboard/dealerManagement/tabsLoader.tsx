// src/app/dashboard/dealerManagement/tabsLoader.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
//import AddAndListDealersPage from './addAndListDealers';
import ListDealersPage from '@/app/dashboard/dealerManagement/listDealers';
import VerifyDealersPage from '@/app/dashboard/dealerManagement/verifyDealers';
import DealerBrandMappingPage from '@/app/dashboard/dealerManagement/dealerBrandMapping';

// This component receives the permissions as props
// from the server component (page.tsx)
interface DealerManagementTabsProps {
  //canSeeAddAndListDealers: boolean;
  canSeeListDealers: boolean;
  canSeeVerifyDealers: boolean;
  canSeeBrandMapping: boolean;
}

export function DealerManagementTabs({
  //canSeeAddAndListDealers,
  canSeeListDealers,
  canSeeVerifyDealers,
  canSeeBrandMapping,
}: DealerManagementTabsProps) {

  // Determine the default tab based on the first permission they have
  let defaultTab = "";
  //if (canSeeAddAndListDealers) defaultTab = "AddAndListDealers";
  if (canSeeListDealers) defaultTab = "ListDealers";
  else if (canSeeVerifyDealers) defaultTab = "verifyDealers";
  else if (canSeeBrandMapping) defaultTab = "dealerBrandMapping";

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList>
        {/* {canSeeAddAndListDealers && (
          <TabsTrigger value="AddAndListDealers">Add & List Dealers</TabsTrigger>
        )} */}
        {canSeeListDealers && (
          <TabsTrigger value="ListDealers">List Dealers</TabsTrigger>
        )}
        {canSeeVerifyDealers && (
          <TabsTrigger value="verifyDealers">Verify Dealers</TabsTrigger>
        )}
        {canSeeBrandMapping && (
          <TabsTrigger value="dealerBrandMapping">Dealer Brand Mapping</TabsTrigger>
        )}
      </TabsList>

      {/* --- Tab Content --- */}
      {/* {canSeeAddAndListDealers && (
        <TabsContent value="AddAndListDealers" className="space-y-4">
          <AddAndListDealersPage />
        </TabsContent>
      )} */}
      {canSeeListDealers && (
        <TabsContent value="ListDealers" className="space-y-4">
          <ListDealersPage />
        </TabsContent>
      )}
      {canSeeVerifyDealers && (
        <TabsContent value="verifyDealers" className="space-y-4">
          <VerifyDealersPage />
        </TabsContent>
      )}
      {canSeeBrandMapping && (
        <TabsContent value="dealerBrandMapping" className="space-y-4">
          <DealerBrandMappingPage />
        </TabsContent>
      )}
    </Tabs>
  );
}
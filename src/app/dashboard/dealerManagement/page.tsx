// src/app/dashboard/dealerManagement/page.tsx
'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

//import AddAndListDealersPage from '@/app/dashboard/dealerManagement/addAndListDealers';
import ListDealersPage from '@/app/dashboard/dealerManagement/listDealers';
import VerifyDealersPage from '@/app/dashboard/dealerManagement/verifyDealers';
import DealerBrandMappingPage from '@/app/dashboard/dealerManagement/dealerBrandMapping';

export default function DealersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Dealers Management Page
        </h2>
      </div>

      <Tabs defaultValue="ListDealers" className="space-y-4">
        <TabsList>
          {/* <TabsTrigger value="addAndListDealers">Add-List Dealers</TabsTrigger> */}
          <TabsTrigger value="ListDealers">List Dealers</TabsTrigger>
          <TabsTrigger value="verifyDealers">Verify Dealers</TabsTrigger>
          <TabsTrigger value="dealerBrandMapping">Dealer Brand Mapping</TabsTrigger>
        </TabsList>
        {/* <TabsContent value="addAndListDealers" className="space-y-4">
          <AddAndListDealersPage />
        </TabsContent> */}
        <TabsContent value="ListDealers" className="space-y-4">
          <ListDealersPage />
        </TabsContent>
        <TabsContent value="verifyDealers" className="space-y-4">
          <VerifyDealersPage />
        </TabsContent>
        <TabsContent value="dealerBrandMapping" className="space-y-4">
          <DealerBrandMappingPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

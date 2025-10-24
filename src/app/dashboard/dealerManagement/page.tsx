// src/app/dashboard/addDealers/page.tsx
'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AddAndListDealersPage from '@/app/dashboard/dealerManagement/addAndListDealers';
import VerifyDealersPage from '@/app/dashboard/dealerManagement/verifyDealers';

export default function DealersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Dealers Management Page
        </h2>
      </div>

      <Tabs defaultValue="addAndListDealers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="addAndListDealers">Add-List Dealers</TabsTrigger>
          <TabsTrigger value="verifyDealers">Verify Dealers</TabsTrigger>
        </TabsList>
        <TabsContent value="addAndListDealers" className="space-y-4">
          <AddAndListDealersPage />
        </TabsContent>
        <TabsContent value="verifyDealers" className="space-y-4">
          <VerifyDealersPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

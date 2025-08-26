// src/app/dashboard/scoresAndRatings/page.tsx
'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import the report components
import SalesmanRatings from './salesmanRatings';
import DealerScores from './dealerScores';

/**
 * Main page component for the Scores and Ratings section.
 * It provides a tabbed interface to switch between different reports,
 * with a consistent layout and styling.
 */
export default function ScoresAndRatingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Scores and Ratings
        </h2>
      </div>
      <p className="text-neutral-500">
        View detailed ratings for salesmen and scores for dealers.
      </p>

      <Tabs defaultValue="salesmanRatings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="salesmanRatings">Salesman Ratings</TabsTrigger>
          <TabsTrigger value="dealerScores">Dealer Scores</TabsTrigger>
        </TabsList>
        <TabsContent value="salesmanRatings" className="space-y-4">
          <SalesmanRatings />
        </TabsContent>
        <TabsContent value="dealerScores" className="space-y-4">
          <DealerScores />
        </TabsContent>
      </Tabs>
    </div>
  );
}

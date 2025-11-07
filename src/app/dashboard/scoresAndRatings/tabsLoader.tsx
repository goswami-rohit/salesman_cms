// src/app/dashboard/scoresAndRatings/tabsLoader.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesmanRatings from './salesmanRatings';
import DealerScores from './dealerScores';

// This component receives the permissions as props
// from the server component (page.tsx)
interface ScoresAndRatingsTabsProps {
  canSeeSalesmanRatings: boolean;
  canSeeDealerScores: boolean;
}

export function ScoresAndRatingsTabs({
  canSeeSalesmanRatings,
  canSeeDealerScores,
}: ScoresAndRatingsTabsProps) {

  // The logic for the default tab now lives here
  const defaultTab = canSeeSalesmanRatings ? 'salesmanRatings' : 'dealerScores';

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList>
        {/* Conditionally render the "Salesman Ratings" tab button */}
        {canSeeSalesmanRatings && (
          <TabsTrigger value="salesmanRatings">Salesman Ratings</TabsTrigger>
        )}

        {/* Conditionally render the "Dealer Scores" tab button */}
        {canSeeDealerScores && (
          <TabsTrigger value="dealerScores">Dealer Scores</TabsTrigger>
        )}
      </TabsList>

      {/* Conditionally render the "Salesman Ratings" tab content */}
      {canSeeSalesmanRatings && (
        <TabsContent value="salesmanRatings" className="space-y-4">
          <SalesmanRatings />
        </TabsContent>
      )}

      {/* Conditionally render the "Dealer Scores" tab content */}
      {canSeeDealerScores && (
        <TabsContent value="dealerScores" className="space-y-4">
          <DealerScores />
        </TabsContent>
      )}
    </Tabs>
  );
}
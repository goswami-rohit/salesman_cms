// src/app/dashboard/page.tsx
import { Suspense } from 'react';
import { SectionCards } from '@/components/section-cards';
import DashboardGraphs from './DashboardGraphs'; // Import the new component
import { 
  getDailyVisitsDataForGraph,
  getGeoTrackingDataForGraph,
  getSalespersonDataForTable 
} from './data-format'; // Import the data-fetching helpers

export default async function DashboardPage() {
  const [visitsData, geoData, salespersonData] = await Promise.all([
    getDailyVisitsDataForGraph(),
    getGeoTrackingDataForGraph(),
    getSalespersonDataForTable(),
  ]);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* This component is likely a client component, so it can fetch its own data or be passed data from here */}
      <Suspense fallback={<div>Loading cards...</div>}>
        <SectionCards />
      </Suspense>
      
      {/* This is our new client component that handles the tabbed view with graphs and tables */}
      <Suspense fallback={<div>Loading dashboard data...</div>}>
        <DashboardGraphs 
          visitsData={visitsData}
          geoData={geoData}
          salespersonData={salespersonData}
        />
      </Suspense>
    </div>
  );
}

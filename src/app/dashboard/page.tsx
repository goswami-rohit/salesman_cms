// src/app/dashboard/page.tsx
import { Suspense } from 'react';
import { SectionCards } from '@/components/section-cards';
import DashboardGraphs from './dashboardGraphs';
import { 
  getRawDailyVisitReports, // Changed import
  getRawGeoTrackingRecords,
} from './data-format';

export default async function DashboardPage() {
  console.log('DashboardPage: Fetching data for DashboardGraphs...');

  // Fetch raw data using the updated functions
  const [rawDailyReports, rawGeoTrackingRecords] = await Promise.all([ // Changed variable names
    getRawDailyVisitReports(),
    getRawGeoTrackingRecords(),
  ]);

  console.log('DashboardPage: rawDailyReports received:', rawDailyReports.length, 'records');
  console.log('DashboardPage: rawGeoTrackingRecords received:', rawGeoTrackingRecords.length, 'records');

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <Suspense fallback={<div>Loading cards...</div>}>
        <SectionCards />
      </Suspense>
      
      <Suspense fallback={<div>Loading dashboard data...</div>}>
        <DashboardGraphs 
          rawDailyReports={rawDailyReports} // Pass raw data
          rawGeoTrackingRecords={rawGeoTrackingRecords} // Pass raw data
        />
      </Suspense>
    </div>
  );
}

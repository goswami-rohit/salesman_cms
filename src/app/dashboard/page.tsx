// src/app/dashboard/page.tsx
import { Suspense } from 'react';
import { SectionCards } from '@/components/section-cards';
import DashboardGraphs from './dashboardGraphs';
import { 
  getDailyVisitsDataForGraph,
  getGeoTrackingDataForGraph,
  getGeoTrackingDataForTable,
  getDailyVisitReportsForTable
} from './data-format';

export default async function DashboardPage() {
  const [visitsData, geoData, salespersonData, dailyReports] = await Promise.all([
    getDailyVisitsDataForGraph(),
    getGeoTrackingDataForGraph(),
    getGeoTrackingDataForTable(),
    getDailyVisitReportsForTable(),
  ]);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <Suspense fallback={<div>Loading cards...</div>}>
        <SectionCards />
      </Suspense>
      
      <Suspense fallback={<div>Loading dashboard data...</div>}>
        <DashboardGraphs 
          visitsData={visitsData}
          geoData={geoData}
          salespersonData={salespersonData}
          dailyReports={dailyReports}
        />
      </Suspense>
    </div>
  );
}

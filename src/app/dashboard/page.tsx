// src/app/dashboard/page.tsx
import { Suspense } from 'react';
//import { SectionCards } from '@/components/section-cards';
import DashboardGraphs from './dashboardGraphs';

export default async function DashboardPage() {
  console.log('DashboardPage: Rendering DashboardGraphs (data fetched client-side)...');

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* <Suspense fallback={<div>Loading cards...</div>}>
        <SectionCards />
      </Suspense> */}
      
      <Suspense fallback={<div>Loading dashboard data...</div>}>
        {/* DashboardGraphs will now fetch its own data client-side */}
        <DashboardGraphs />
      </Suspense>
    </div>
  );
}

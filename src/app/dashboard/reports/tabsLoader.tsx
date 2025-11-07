// src/app/dashboard/reports/tabsLoader.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompetitionReportsPage from './competitionReports';
import SalesOrdersTable from './salesOrders';
import DailyVisitReportsPage from './dailyVisitReports';
import TechnicalVisitReportsPage from './technicalVisitReports';
import DvrPjpReportPage from './dvrVpjp';
import SalesDVRReportPage from './salesVdvr';

// This component receives the permissions as props
// from the server component (page.tsx)
interface ReportsTabsProps {
  canSeeDVR: boolean;
  canSeeTVR: boolean;
  canSeeSalesOrders: boolean;
  canSeeCompetition: boolean;
  canSeeDvrVpjp: boolean;
  canSeeSalesVdvr: boolean;
}

export function ReportsTabs({
  canSeeDVR,
  canSeeTVR,
  canSeeSalesOrders,
  canSeeCompetition,
  canSeeDvrVpjp,
  canSeeSalesVdvr,
}: ReportsTabsProps) {

  // The logic for the default tab now lives here
  let defaultTab = "";
  if (canSeeDVR) defaultTab = "dailyVisitReport";
  else if (canSeeTVR) defaultTab = "technicalVisitReport";
  else if (canSeeSalesOrders) defaultTab = "salesOrderReport";
  else if (canSeeCompetition) defaultTab = "competitionReport";
  else if (canSeeDvrVpjp) defaultTab = "dvrVpjp";
  else if (canSeeSalesVdvr) defaultTab = "salesVdvr";

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList>
        {canSeeDVR && (
          <TabsTrigger value="dailyVisitReport">DVR Report</TabsTrigger>
        )}
        {canSeeTVR && (
          <TabsTrigger value="technicalVisitReport">TVR Report</TabsTrigger>
        )}
        {canSeeSalesOrders && (
          <TabsTrigger value="salesOrderReport">Sales Orders</TabsTrigger>
        )}
        {canSeeCompetition && (
          <TabsTrigger value="competitionReport">Competition Report</TabsTrigger>
        )}
        {canSeeDvrVpjp && (
          <TabsTrigger value="dvrVpjp">DVR V PJP</TabsTrigger>
        )}
        {canSeeSalesVdvr && (
          <TabsTrigger value="salesVdvr">Sales V DVR</TabsTrigger>
        )}
      </TabsList>

      {/* --- Tab Content --- */}
      {canSeeDVR && (
        <TabsContent value="dailyVisitReport" className="space-y-4">
          <DailyVisitReportsPage />
        </TabsContent>
      )}
      {canSeeTVR && (
        <TabsContent value="technicalVisitReport" className="space-y-4">
          <TechnicalVisitReportsPage />
        </TabsContent>
      )}
      {canSeeSalesOrders && (
        <TabsContent value="salesOrderReport" className="space-y-4">
          <SalesOrdersTable />
        </TabsContent>
      )}
      {canSeeCompetition && (
        <TabsContent value="competitionReport" className="space-y-4">
          <CompetitionReportsPage />
        </TabsContent>
      )}
      {canSeeDvrVpjp && (
        <TabsContent value="dvrVpjp" className="space-y-4">
          <DvrPjpReportPage />
        </TabsContent>
      )}
      {canSeeSalesVdvr && (
        <TabsContent value="salesVdvr" className="space-y-4">
          <SalesDVRReportPage />
        </TabsContent>
      )}
    </Tabs>
  );
}
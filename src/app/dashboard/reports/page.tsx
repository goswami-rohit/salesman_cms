// src/app/dashboard/reports/page.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import CompetitionReportsPage from './competitionReports';
import SalesOrdersTable from './salesOrders';
import DailyVisitReportsPage from './dailyVisitReports';
import TechnicalVisitReportsPage from './technicalVisitReports';
import DvrPjpReportPage from './dvr-pjp';
import SalesDVRReportPage from './sales-dvr';

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
        Reports Page
        </h2>
      </div>
      <Tabs defaultValue="dailyVisitReport" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dailyVisitReport">DVR Report</TabsTrigger>
          <TabsTrigger value="technicalVisitReport">TVR Report</TabsTrigger>
          <TabsTrigger value="salesOrderReport">Sales Orders</TabsTrigger>
          <TabsTrigger value="competitionReport">Competition Report</TabsTrigger>
          <TabsTrigger value="dvrVpjp">DVR V PJP</TabsTrigger>
          <TabsTrigger value="salesVdvr">Sales V DVR</TabsTrigger>
        </TabsList>
        <TabsContent value="dailyVisitReport" className="space-y-4">
          <DailyVisitReportsPage />
        </TabsContent>
        <TabsContent value="technicalVisitReport" className="space-y-4">
          <TechnicalVisitReportsPage />
        </TabsContent>
        <TabsContent value="salesOrderReport" className="space-y-4">
          <SalesOrdersTable />
        </TabsContent>
        <TabsContent value="competitionReport" className="space-y-4">
          <CompetitionReportsPage />
        </TabsContent>
        <TabsContent value="dvrVpjp" className="space-y-4">
          <DvrPjpReportPage />
        </TabsContent>
        <TabsContent value="salesVdvr" className="space-y-4">
          <SalesDVRReportPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

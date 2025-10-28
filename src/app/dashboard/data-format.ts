// src/app/dashboard/data-format.ts
import { z } from 'zod';

// zod imports from routes
import { geoTrackingSchema } from '@/app/api/dashboardPagesAPI/slm-geotracking/route';
import { dailyVisitReportSchema } from '@/app/api/dashboardPagesAPI/reports/daily-visit-reports/route';
import { technicalVisitReportSchema } from '@/app/api/dashboardPagesAPI/reports/technical-visit-reports/route';
import { salesOrderSchema } from '@/app/api/dashboardPagesAPI/reports/sales-orders/route';
import { competitionReportSchema } from '@/app/api/dashboardPagesAPI/reports/competition-reports/route';

// ---------------------------------------------------------------------
// 1. Exporting Raw Schemas
// ---------------------------------------------------------------------
export const rawDailyVisitReportSchema = dailyVisitReportSchema;
export const rawGeoTrackingSchema = geoTrackingSchema;
export const rawSalesOrderSchema = salesOrderSchema;
export const rawTechnicalVisitReportSchema = technicalVisitReportSchema;
export const rawCompetitionReportSchema = competitionReportSchema;


// ---------------------------------------------------------------------
// 2. Exporting Inferred Types for Raw Data
// ---------------------------------------------------------------------
export type RawGeoTrackingRecord = z.infer<typeof rawGeoTrackingSchema>;
export type RawDailyVisitReportRecord = z.infer<typeof rawDailyVisitReportSchema>;
export type RawTechnicalVisitReportRecord = z.infer<typeof rawTechnicalVisitReportSchema>;
export type RawSalesOrderReportRecord = z.infer<typeof rawSalesOrderSchema>;
export type RawCompetitionReportRecord = z.infer<typeof rawCompetitionReportSchema>;

// ---------------------------------------------------------------------
// 3. Types for Aggregated Graph Data
// ---------------------------------------------------------------------
// Existing
export type DailyVisitsData = {
  name: string; // Date
  visits: number;
};

export type GeoTrackingData = {
  name: string; // Date
  distance: number;
};

export type DailyCollectionData = {
  name: string; // Date
  collection: number;
};

export type SalesOrderQuantityData = {
  name: string;   // Date
  quantity: number; // Sum of orderQty (MT/Bags units handled in UI)
};

export type TechnicalConversionData = {
  name: string; // Date or Day
  conversionQuantity: number; // Sum of conversionQuantityValue
};

// Competition Report Graph (Competition Brand Counts - for Pie/Bar Chart)
export type CompetitionBrandCount = {
  name: string; // Brand Name
  count: number;
};

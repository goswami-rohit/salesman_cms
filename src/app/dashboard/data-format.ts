// src/app/dashboard/data-format.ts
import { z } from 'zod';
import { Prisma } from '@prisma/client'; // Import Prisma for Decimal type handling

// Define the schemas for the API responses to ensure data integrity
export const rawDailyVisitReportSchema = z.object({
  id: z.union([z.string().uuid(), z.number(), z.string()]).transform((v) => String(v)),
  salesmanName: z.string(),
  role: z.string(),
  reportDate: z.string(), 
  dealerType: z.string(), 
  dealerName: z.string().nullable().optional(),
  subDealerName: z.string().nullable().optional(),
  location: z.string(), 
  latitude: z.number(), 
  longitude: z.number(), 
  visitType: z.string(), 
  dealerTotalPotential: z.number(), 
  dealerBestPotential: z.number(), 
  brandSelling: z.array(z.string()), 
  contactPerson: z.string().nullable().optional(),
  contactPersonPhoneNo: z.string().nullable().optional(),
  todayOrderMt: z.number(), 
  todayCollectionRupees: z.number(), 
  overdueAmount: z.number().optional(), // added
  feedbacks: z.string(), 
  solutionBySalesperson: z.string().nullable().optional(),
  anyRemarks: z.string().nullable().optional(),
  checkInTime: z.string(), 
  checkOutTime: z.string().nullable().optional(),
  inTimeImageUrl: z.string().nullable().optional(),
  outTimeImageUrl: z.string().nullable().optional(),
});

export const rawGeoTrackingSchema = z.object({
  id: z.string(),
  salesmanName: z.string().nullable(),
  employeeId: z.string().nullable(),
  workosOrganizationId: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  recordedAt: z.string(),
  totalDistanceTravelled: z.number().nullable(), // This is the field for distance graph
  accuracy: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  altitude: z.number().nullable().optional(),
  locationType: z.string().nullable().optional(),
  activityType: z.string().nullable().optional(),
  appState: z.string().nullable().optional(),
  batteryLevel: z.number().nullable().optional(),
  isCharging: z.boolean().nullable().optional(),
  networkStatus: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  siteName: z.string().nullable().optional(),
  checkInTime: z.string().nullable().optional(),
  checkOutTime: z.string().nullable().optional(),
  journeyId: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});


// Export inferred types for raw data
export type RawGeoTrackingRecord = z.infer<typeof rawGeoTrackingSchema>;
export type RawDailyVisitReportRecord = z.infer<typeof rawDailyVisitReportSchema>;

// Types for aggregated graph data (still used by ChartAreaInteractive)
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

// Removed data fetching functions (getRawDailyVisitReports, getRawGeoTrackingRecords)
// as they will now be handled directly in DashboardGraphs.tsx (client component)

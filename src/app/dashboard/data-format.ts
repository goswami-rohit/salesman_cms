// src/app/dashboard/data-format.ts
import { z } from 'zod';
import { Prisma } from '@prisma/client'; // Import Prisma for Decimal type handling

// Define a base URL for API calls. This is crucial for server components
// as process.env.NEXT_PUBLIC_APP_URL might not always be reliably available
// during server-side rendering, or relative paths might be misresolved.
// Use a fallback to your deployment URL or a local development URL.
const BASE_API_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://salesmancms-dashboard.onrender.com';

// Define the schemas for the API responses to ensure data integrity
// These schemas will now be used in dashboardGraphs.tsx for validation
export const rawDailyVisitReportSchema = z.object({
  id: z.string().uuid(),
  salesmanName: z.string(),
  reportDate: z.string(),
  dealerType: z.string().optional(),
  dealerName: z.string().nullable().optional(),
  subDealerName: z.string().nullable().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  visitType: z.string().optional(),
  dealerTotalPotential: z.number().optional(),
  dealerBestPotential: z.number().optional(),
  brandSelling: z.array(z.string()).optional(),
  contactPerson: z.string().nullable().optional(),
  contactPersonPhoneNo: z.string().nullable().optional(),
  todayOrderMt: z.number().optional(),
  todayCollectionRupees: z.number().optional(), // This is the field for collection graph
  feedbacks: z.string().optional(),
  solutionBySalesperson: z.string().nullable().optional(),
  anyRemarks: z.string().nullable().optional(),
  checkInTime: z.string().optional(),
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

const dvrAPI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/daily-visit-reports`

const geoAPI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/slm-geotracking`

/**
 * Fetches raw daily visit reports data.
 * Aggregation and validation will happen in DashboardGraphs.tsx
 */
export async function getRawDailyVisitReports(): Promise<RawDailyVisitReportRecord[]> {
  try {
    console.log('data-format: Fetching raw daily visit reports...');
    const res = await fetch(dvrAPI, { cache: 'no-store' });
    console.log('data-format: Daily Visit Reports API Response Status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('data-format: Daily Visit Reports API Error Text:', errorText);
      throw new Error(`Failed to fetch daily visit reports: ${res.status} - ${errorText}`);
    }

    const data: RawDailyVisitReportRecord[] = await res.json();
    console.log('data-format: Raw Daily Visit Reports Data:', data);
    return data; // Return raw data
  } catch (err) {
    console.error('data-format: Error fetching raw daily visit reports:', err);
    return [];
  }
}

/**
 * Fetches all raw geo-tracking records.
 * Aggregation and validation will happen in DashboardGraphs.tsx
 */
export async function getRawGeoTrackingRecords(): Promise<RawGeoTrackingRecord[]> {
  try {
    console.log('data-format: Fetching raw geo-tracking records...');
    const res = await fetch(geoAPI, { cache: 'no-store' });
    console.log('data-format: Raw Geo-Tracking Records API Response Status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('data-format: Raw Geo-Tracking Records API Error Text:', errorText);
      throw new Error(`Failed to fetch raw geo-tracking data: ${res.status} - ${errorText}`);
    }

    const data: RawGeoTrackingRecord[] = await res.json();
    console.log('data-format: Raw Geo-Tracking Records Data:', data);
    return data; // Return raw data
  } catch (err) {
    console.error('data-format: Error fetching raw geo-tracking records:', err);
    return [];
  }
}

// src/app/dashboard/data-format.ts
import { z } from 'zod';
import { Prisma } from '@prisma/client'; // Import Prisma for Decimal type handling

// Define the schemas for the API responses to ensure data integrity
const dailyVisitReportSchema = z.object({
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
  todayCollectionRupees: z.number().optional(),
  feedbacks: z.string().optional(),
  solutionBySalesperson: z.string().nullable().optional(),
  anyRemarks: z.string().nullable().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().nullable().optional(),
  inTimeImageUrl: z.string().nullable().optional(),
  outTimeImageUrl: z.string().nullable().optional(),
});

// Updated geoTrackingSchema to match the API response and prisma schema
const geoTrackingSchema = z.object({
  id: z.string(),
  salesmanName: z.string().nullable(), // Can be null if user data is missing
  employeeId: z.string().nullable(),   // Can be null
  workosOrganizationId: z.string().nullable(), // Can be null
  latitude: z.number(),
  longitude: z.number(),
  recordedAt: z.string(),
  totalDistanceTravelled: z.number().nullable(), // Marked as nullable as per schema.prisma
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


// New, more specific types for our chart data
export type DailyVisitsData = {
  name: string; // Date
  visits: number;
};

export type GeoTrackingData = {
  name: string; // Date
  distance: number;
};

export type GeoTrackingRecord = z.infer<typeof geoTrackingSchema>;
export type DailyVisitReportRecord = z.infer<typeof dailyVisitReportSchema>;


/**
 * Fetches data from the daily-visit-reports API and formats it for a graph.
 * The data is aggregated to show the total number of visits per day.
 */
export async function getDailyVisitsDataForGraph(): Promise<DailyVisitsData[]> {
  try {
    const res = await fetch('/api/dashboardPagesAPI/daily-visit-reports', { cache: 'no-store' });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch daily visit reports: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    const validatedData = z.array(dailyVisitReportSchema).parse(data);

    // Aggregate data to get a count of visits per day
    const aggregatedData: Record<string, number> = {};
    validatedData.forEach(item => {
      // Use the exact YYYY-MM-DD format that the API returns
      const date = item.reportDate;
      aggregatedData[date] = (aggregatedData[date] || 0) + 1;
    });

    // Convert the aggregated data into the chart format
    const graphData: DailyVisitsData[] = Object.keys(aggregatedData).sort().map(date => ({
      name: date,
      visits: aggregatedData[date],
    }));

    return graphData;
  } catch (err) {
    console.error('Error fetching/parsing daily visits data for graph:', err);
    return [];
  }
}

/**
 * Fetches all daily visit reports for the table.
 */
export async function getDailyVisitReportsForTable(): Promise<DailyVisitReportRecord[]> {
  try {
    const res = await fetch('/api/dashboardPagesAPI/daily-visit-reports', { cache: 'no-store' });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch daily visit reports for table: ${res.status} - ${errorText}`);
    }
    const data = await res.json();
    return z.array(dailyVisitReportSchema).parse(data);
  } catch (err) {
    console.error('Error fetching/parsing daily visit reports for table:', err);
    return [];
  }
}

/**
 * Fetches all raw geo-tracking records.
 * This function will now be the source of raw data for both graph and table in DashboardGraphs.
 */
export async function getRawGeoTrackingRecords(): Promise<GeoTrackingRecord[]> {
  try {
    const res = await fetch('/api/dashboardPagesAPI/slm-geotracking', { cache: 'no-store' });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch raw geo-tracking data: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    // Ensure totalDistanceTravelled is converted from Decimal if needed (handled in API route)
    // and that nullable fields are correctly parsed by Zod.
    return z.array(geoTrackingSchema).parse(data);
  } catch (err) {
    console.error('Error fetching/parsing raw geo-tracking records:', err);
    return [];
  }
}

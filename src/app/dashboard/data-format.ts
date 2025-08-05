// src/app/dashboard/data-format.ts
import { z } from 'zod';

// Define the schemas for the API responses to ensure data integrity
const dailyVisitReportSchema = z.object({
  id: z.string().uuid(),
  salesmanName: z.string(),
  reportDate: z.string(),
});

const geoTrackingSchema = z.object({
  id: z.string(),
  salesmanName: z.string(),
  recordedAt: z.string(),
  totalDistanceTravelled: z.number().nullable(),
});

// New, more specific types for our chart data
export type DailyVisitsData = {
  name: string;
  visits: number;
};

export type GeoTrackingData = {
  name: string;
  distance: number;
};

export type GeoTrackingRecord = z.infer<typeof geoTrackingSchema>;


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
    console.error('Error fetching/parsing daily visits data:', err);
    return [];
  }
}

/**
 * Fetches data from the slm-geotracking API and formats it for a graph.
 * The data is aggregated to show the total distance travelled per day.
 */
export async function getGeoTrackingDataForGraph(): Promise<GeoTrackingData[]> {
  try {
    const res = await fetch('/api/dashboardPagesAPI/slm-geotracking', { cache: 'no-store' });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch geo-tracking data: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    const validatedData = z.array(geoTrackingSchema).parse(data);

    // Aggregate data to get total distance per day
    const aggregatedData: Record<string, number> = {};
    validatedData.forEach(item => {
      const date = new Date(item.recordedAt).toLocaleDateString('en-US');
      aggregatedData[date] = (aggregatedData[date] || 0) + (item.totalDistanceTravelled || 0);
    });

    // Convert the aggregated data into the chart format
    const graphData: GeoTrackingData[] = Object.keys(aggregatedData).sort().map(date => ({
      name: date,
      distance: aggregatedData[date],
    }));

    return graphData;
  } catch (err) {
    console.error('Error fetching/parsing geo-tracking data:', err);
    return [];
  }
}

/**
 * Fetches data for the main dashboard table.
 */
export async function getSalespersonDataForTable(): Promise<GeoTrackingRecord[]> {
  try {
    const res = await fetch('/api/dashboardPagesAPI/slm-geotracking', { cache: 'no-store' });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch salesperson data: ${res.status} - ${errorText}`);
    }
    const data = await res.json();
    return z.array(geoTrackingSchema).parse(data);
  } catch (err) {
    console.error('Error fetching/parsing salesperson data:', err);
    return [];
  }
}

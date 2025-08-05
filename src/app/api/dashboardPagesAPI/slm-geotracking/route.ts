// src/app/api/dashboardPagesAPI/slm-geotracking/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Define Zod schema for the GeoTracking data returned by this API
// This ensures that the data we return is properly structured and typed.
const geoTrackingSchema = z.object({
  id: z.string(),
  salesmanName: z.string(),
  employeeId: z.string(),
  workosOrganizationId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  recordedAt: z.string(), // ISO string from the database
  totalDistanceTravelled: z.number(),
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

export async function GET() {
  try {
    const claims = await getTokenClaims();

    // 1. Authentication Check
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Current User to check role and companyId
    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      include: { company: true } // Include company to get companyId for filtering
    });

    // 3. Role-based Authorization: Only 'admin' or 'manager' can access this dashboard data
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or manager role' }, { status: 403 });
    }

    // 4. Fetch GeoTracking Records for the current user's company
    const geotrackingReports = await prisma.geoTracking.findMany({
      where: {
        user: {
          companyId: currentUser.companyId,
        },
      },
      // We must include the user and company to get the workosOrganizationId
      include: {
        user: {
          include: {
            company: true,
          }
        },
      },
      orderBy: {
        recordedAt: 'desc',
      },
      take: 200,
    });

     // 5. Format the data for the frontend table display
    const formattedReports = geotrackingReports.map(report => ({
      id: report.id,
      // Access salesmanName from the nested user object
      salesmanName: report.user.firstName && report.user.lastName ? `${report.user.firstName} ${report.user.lastName}` : null,
      // Access employeeId from the nested user object
      employeeId: report.user.salesmanLoginId,
      workosOrganizationId: report.user.company?.workosOrganizationId ?? null,
      latitude: report.latitude.toNumber(),
      longitude: report.longitude.toNumber(),
      recordedAt: report.recordedAt.toISOString(),
      // Handle the case where totalDistanceTravelled might be null
      totalDistanceTravelled: report.totalDistanceTravelled?.toNumber() ?? null,
      accuracy: report.accuracy?.toNumber() ?? null,
      speed: report.speed?.toNumber() ?? null,
      heading: report.heading?.toNumber() ?? null,
      altitude: report.altitude?.toNumber() ?? null,
      locationType: report.locationType,
      activityType: report.activityType,
      appState: report.appState,
      batteryLevel: report.batteryLevel?.toNumber() ?? null,
      isCharging: report.isCharging,
      networkStatus: report.networkStatus,
      ipAddress: report.ipAddress,
      siteName: report.siteName,
      checkInTime: report.checkInTime?.toISOString() ?? null,
      checkOutTime: report.checkOutTime?.toISOString() ?? null,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    }));

    const validatedReports = z.array(geoTrackingSchema).parse(formattedReports);

    return NextResponse.json(validatedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching geo-tracking data:', error);
    // Return a 500 status with a generic error message
    return NextResponse.json({ error: 'Failed to fetch geo-tracking data' }, { status: 500 });
  } finally {
    // Disconnect Prisma client to prevent connection leaks, especially important in serverless environments
    await prisma.$disconnect();
  }
}
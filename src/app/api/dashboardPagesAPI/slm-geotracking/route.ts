// src/app/api/dashboardPagesAPI/slm-geotracking/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { generateAndStreamCsv, getAuthClaims } from '@/lib/download-utils';

export async function GET(request: NextRequest) {
  try {
    const claims = await getAuthClaims();

    // 1. Authentication and Authorization Checks
    if (claims instanceof NextResponse) return claims;

    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      include: { company: true }
    });

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or manager role' }, { status: 403 });
    }

    // 2. Parse query parameters for filtering and formatting
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const ids = searchParams.get('ids')?.split(','); // Optional array of IDs to filter by

    // 3. Fetch GeoTracking Records for the current user's company
    const geoTrackingRecords = await prisma.geoTracking.findMany({
      where: {
        // Fix: Use the array of strings directly, as 'id' is a String in Prisma.
        ...(ids && { id: { in: ids } }),
        user: {
          companyId: currentUser.companyId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            salesmanLoginId: true,
            workosUserId: true,
            role: true,
          },
        },
      },
      orderBy: {
        recordedAt: 'desc',
      },
      // Apply a limit only for the standard JSON response, not for downloads
      ...(!format && { take: 200 }),
    });

    // 4. Format the data for both JSON and CSV outputs
    const formattedRecords = geoTrackingRecords.map(record => ({
      id: record.id,
      salesmanName: `${record.user.firstName || ''} ${record.user.lastName || ''}`.trim() || record.user.email,
      employeeId: record.user.salesmanLoginId || 'N/A',
      workosOrganizationId: record.user.workosUserId,
      
      latitude: record.latitude.toNumber(),
      longitude: record.longitude.toNumber(),
      recordedAt: record.recordedAt.toISOString(),
      totalDistanceTravelled: record.totalDistanceTravelled?.toNumber() || 0,

      accuracy: record.accuracy?.toNumber() || null,
      speed: record.speed?.toNumber() || null,
      heading: record.heading?.toNumber() || null,
      altitude: record.altitude?.toNumber() || null,
      locationType: record.locationType || null,
      activityType: record.activityType || null,
      appState: record.appState || null,
      batteryLevel: record.batteryLevel?.toNumber() || null,
      isCharging: record.isCharging || null,
      networkStatus: record.networkStatus || null,
      ipAddress: record.ipAddress || null,
      siteName: record.siteName || null,
      checkInTime: record.checkInTime?.toISOString() || null,
      checkOutTime: record.checkOutTime?.toISOString() || null,
      
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }));

    // 5. Handle download requests based on the 'format' query parameter
    if (format) {
      switch (format) {
        case 'csv': {
          const headers = [
            "ID", "Salesman Name", "Employee ID", "WorkOS User ID", "Latitude",
            "Longitude", "Recorded At", "Total Distance Travelled (m)", "Accuracy",
            "Speed (m/s)", "Heading", "Altitude (m)", "Location Type",
            "Activity Type", "App State", "Battery Level", "Is Charging",
            "Network Status", "IP Address", "Site Name", "Check-in Time", "Check-out Time"
          ];
          const dataForCsv = [
            headers,
            ...formattedRecords.map(record => [
              record.id,
              record.salesmanName,
              record.employeeId,
              record.workosOrganizationId,
              record.latitude,
              record.longitude,
              record.recordedAt,
              record.totalDistanceTravelled,
              record.accuracy,
              record.speed,
              record.heading,
              record.altitude,
              record.locationType,
              record.activityType,
              record.appState,
              record.batteryLevel,
              record.isCharging,
              record.networkStatus,
              record.ipAddress,
              record.siteName,
              record.checkInTime,
              record.checkOutTime,
            ])
          ];
          const filename = `geo-tracking-reports-${Date.now()}.csv`;
          return generateAndStreamCsv(dataForCsv, filename);
        }
        case 'xlsx': {
          return NextResponse.json({ message: 'XLSX format is not yet supported.' }, { status: 501 });
        }
        default: {
          return NextResponse.json({ message: 'Invalid format specified.' }, { status: 400 });
        }
      }
    }

    // 6. Default behavior: return JSON data for the client-side table
    return NextResponse.json(formattedRecords, { status: 200 });
  } catch (error) {
    console.error('Error fetching geo-tracking data:', error);
    return NextResponse.json({ error: 'Failed to fetch geo-tracking data' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
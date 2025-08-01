// src/app/api/dashboardPagesAPI/salesman-attendance/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { generateAndStreamCsv, getAuthClaims } from '@/lib/download-utils';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication and Authorization Checks
    const claims = await getAuthClaims();
    if (claims instanceof NextResponse) return claims;

    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      include: { company: true },
    });

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or manager role' }, { status: 403 });
    }
    
    // 2. Parse query parameters for filtering and formatting
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const ids = searchParams.get('ids')?.split(','); // Optional array of IDs to filter by

    // 3. Fetch Attendance Records for the current user's company
    const attendanceRecords = await prisma.salesmanAttendance.findMany({
      where: {
        ...(ids && { id: { in: ids } }),
        user: {
          companyId: currentUser.companyId,
        },
      },
      include: {
        user: { // Include the entire User object to access firstName and lastName
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            }
        },
      },
      orderBy: {
        attendanceDate: 'desc',
      },
      // Apply a limit only for the standard JSON response, not for downloads
      ...(!format && { take: 200 }),
    });

    // 4. Map the Prisma data to the desired frontend format
    const formattedRecords = attendanceRecords.map(record => {
      const salesmanName = [record.user?.firstName, record.user?.lastName]
        .filter(Boolean)
        .join(' ') || 'N/A';

      return {
        id: record.id,
        salesmanName: salesmanName,
        date: record.attendanceDate.toISOString().split('T')[0],
        location: record.locationName,
        inTime: record.inTimeTimestamp ? record.inTimeTimestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
        outTime: record.outTimeTimestamp ? record.outTimeTimestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
        inTimeImageCaptured: record.inTimeImageCaptured,
        outTimeImageCaptured: record.outTimeImageCaptured,
        inTimeImageUrl: record.inTimeImageUrl,
        outTimeImageUrl: record.outTimeImageUrl,
        inTimeLatitude: record.inTimeLatitude?.toNumber() || null,
        inTimeLongitude: record.inTimeLongitude?.toNumber() || null,
        inTimeAccuracy: record.inTimeAccuracy?.toNumber() || null,
        inTimeSpeed: record.inTimeSpeed?.toNumber() || null,
        inTimeHeading: record.inTimeHeading?.toNumber() || null,
        inTimeAltitude: record.inTimeAltitude?.toNumber() || null,
        outTimeLatitude: record.outTimeLatitude?.toNumber() || null,
        outTimeLongitude: record.outTimeLongitude?.toNumber() || null,
        outTimeAccuracy: record.outTimeAccuracy?.toNumber() || null,
        outTimeSpeed: record.outTimeSpeed?.toNumber() || null,
        outTimeHeading: record.outTimeHeading?.toNumber() || null,
        outTimeAltitude: record.outTimeAltitude?.toNumber() || null,
      };
    });

    // 5. Handle download requests based on the 'format' query parameter
    if (format) {
      switch (format) {
        case 'csv': {
          const headers = [
            "ID", "Salesman Name", "Date", "Location", "In Time", "Out Time",
            "In Time Image Captured", "Out Time Image Captured", "In Time Image URL",
            "Out Time Image URL", "In Time Latitude", "In Time Longitude",
            "In Time Accuracy (m)", "In Time Speed (m/s)", "In Time Heading",
            "In Time Altitude (m)", "Out Time Latitude", "Out Time Longitude",
            "Out Time Accuracy (m)", "Out Time Speed (m/s)", "Out Time Heading",
            "Out Time Altitude (m)"
          ];
          const dataForCsv = [
            headers,
            ...formattedRecords.map(record => [
              record.id,
              record.salesmanName,
              record.date,
              record.location,
              record.inTime,
              record.outTime,
              record.inTimeImageCaptured,
              record.outTimeImageCaptured,
              record.inTimeImageUrl,
              record.outTimeImageUrl,
              record.inTimeLatitude,
              record.inTimeLongitude,
              record.inTimeAccuracy,
              record.inTimeSpeed,
              record.inTimeHeading,
              record.inTimeAltitude,
              record.outTimeLatitude,
              record.outTimeLongitude,
              record.outTimeAccuracy,
              record.outTimeSpeed,
              record.outTimeHeading,
              record.outTimeAltitude,
            ])
          ];
          const filename = `salesman-attendance-reports-${Date.now()}.csv`;
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
    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error('Error fetching salesman attendance reports:', error);
    return NextResponse.json({ message: 'Failed to fetch salesman attendance reports', error: (error as Error).message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
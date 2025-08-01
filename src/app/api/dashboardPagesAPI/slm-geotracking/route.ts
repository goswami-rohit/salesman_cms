// src/app/api/dashboardPagesAPI/slm-geotracking/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client

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
    // We filter records based on the 'companyId' of the 'user' who created the record.
    const geoTrackingRecords = await prisma.geoTracking.findMany({
      where: {
        user: { // Access the User relation
          companyId: currentUser.companyId, // Filter by the admin/manager's company
        },
      },
      include: {
        user: { // Include salesman details to get their name and other identifiers
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            salesmanLoginId: true, // Employee ID
            workosUserId: true,    // WorkOS User ID
            role: true,
          },
        },
      },
      orderBy: {
        recordedAt: 'desc', // Order by latest records first
      },
      take: 200, // Limit the number of records for performance in a dashboard view
    });

    // 5. Format the data for the frontend table display
    const formattedRecords = geoTrackingRecords.map(record => ({
      id: record.id,
      // Combine first and last name for salesmanName, fallback to email if names are null
      salesmanName: `${record.user.firstName || ''} ${record.user.lastName || ''}`.trim() || record.user.email,
      // Include unique identifiers for the employee
      employeeId: record.user.salesmanLoginId || 'N/A', // Assuming salesmanLoginId is the employee ID
      workosOrganizationId: record.user.workosUserId, // WorkOS User ID can serve as an org ID if needed, or fetch from Company model if more direct
      
      latitude: record.latitude.toNumber(),   // Convert Decimal to Number
      longitude: record.longitude.toNumber(), // Convert Decimal to Number
      recordedAt: record.recordedAt.toISOString(), // Full ISO string for precise timestamp
      totalDistanceTravelled: record.totalDistanceTravelled?.toNumber() || 0, // Convert Decimal to Number, default to 0 if null

      // Include other optional fields, ensuring they are not 'undefined' for JSON serialization
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

    return NextResponse.json(formattedRecords, { status: 200 });
  } catch (error) {
    console.error('Error fetching geo-tracking data:', error);
    // Return a 500 status with a generic error message
    return NextResponse.json({ error: 'Failed to fetch geo-tracking data' }, { status: 500 });
  } finally {
    // Disconnect Prisma client to prevent connection leaks, especially important in serverless environments
    await prisma.$disconnect();
  }
}
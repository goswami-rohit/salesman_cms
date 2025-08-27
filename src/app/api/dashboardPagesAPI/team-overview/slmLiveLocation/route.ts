// src/app/api/dashboardPagesAPI/team-overview/salesmanLiveLocation/route.ts

import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for the live location data of a single salesman
const liveLocationSchema = z.object({
  userId: z.number(),
  salesmanName: z.string(),
  employeeId: z.string().nullable(),
  role: z.string(),
  region: z.string().nullable(),
  area: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  recordedAt: z.string(),
  isActive: z.boolean(),
  // Optional fields
  accuracy: z.number().nullable(),
  speed: z.number().nullable(),
  heading: z.number().nullable(),
  altitude: z.number().nullable(),
  batteryLevel: z.number().nullable(),
});

const allowedRoles = [
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive', 'executive'
];

export async function GET() {
  try {
    const claims = await getTokenClaims();

    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
    });

    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to view live locations.' }, { status: 403 });
    }
    
    // 1. Fetch the distinct salesmen who have the latest recorded location.
    const latestLocations = await prisma.geoTracking.findMany({
      where: {
        user: {
          companyId: currentUser.companyId,
        },
      },
      distinct: ['userId'],
      orderBy: {
        recordedAt: 'desc',
      },
      select: {
        userId: true,
        recordedAt: true,
      },
    });

    // 2. Map through the latest locations to get the full record for each user.
    const liveLocations = await Promise.all(
      latestLocations.map(async (location) => {
        const latestRecord = await prisma.geoTracking.findFirst({
          where: {
            userId: location.userId,
            recordedAt: location.recordedAt,
          },
          include: {
            user: true, 
          },
          orderBy: {
            recordedAt: 'desc',
          },
        });

        if (!latestRecord) {
          return null;
        }

        const user = latestRecord.user;
        const salesmanName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'N/A';

        return {
          userId: user.id,
          salesmanName: salesmanName,
          employeeId: user.salesmanLoginId,
          role: user.role,
          region: user.region,
          area: user.area,
          latitude: latestRecord.latitude.toNumber(),
          longitude: latestRecord.longitude.toNumber(),
          recordedAt: latestRecord.recordedAt.toISOString(),
          isActive: latestRecord.isActive,
          accuracy: latestRecord.accuracy?.toNumber() ?? null,
          speed: latestRecord.speed?.toNumber() ?? null,
          heading: latestRecord.heading?.toNumber() ?? null,
          altitude: latestRecord.altitude?.toNumber() ?? null,
          batteryLevel: latestRecord.batteryLevel?.toNumber() ?? null,
        };
      })
    );

    const validatedData = z.array(liveLocationSchema).parse(liveLocations.filter(Boolean));

    return NextResponse.json(validatedData, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching live salesman locations:', error);
    return NextResponse.json({ error: 'Failed to fetch live location data' }, { status: 500 });
  }
}
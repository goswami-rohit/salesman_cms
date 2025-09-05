// src/app/api/dashboardPagesAPI/team-overview/salesmanLiveLocation/route.ts

import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// --- Zod Schema ---
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
  accuracy: z.number().nullable(),
  speed: z.number().nullable(),
  heading: z.number().nullable(),
  altitude: z.number().nullable(),
  batteryLevel: z.number().nullable(),
});

const allowedRoles = [
  'senior-manager',
  'manager',
  'assistant-manager',
  'senior-executive',
  'executive',
];

export async function GET() {
  try {
    const claims = await getTokenClaims();

    // Auth check
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
    });

    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view live locations.' },
        { status: 403 }
      );
    }

    // ✅ Fetch latest record per user in one query
    const latestLocations: any[] = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT ON (gt.user_id)
        gt.user_id,
        gt.latitude,
        gt.longitude,
        gt.recorded_at,
        gt.accuracy,
        gt.speed,
        gt.heading,
        gt.altitude,
        gt.battery_level,
        gt.is_active,
        u.first_name,
        u.last_name,
        u.salesman_login_id,
        u.role,
        u.region,
        u.area
      FROM geo_tracking gt
      JOIN "users" u ON gt.user_id = u.id
      WHERE u.company_id = $1
      ORDER BY gt.user_id, gt.recorded_at DESC
    `, currentUser.companyId);

    // ✅ Normalize + validate with Zod
    const liveLocations = latestLocations.map((row) => ({
      userId: Number(row.user_id),
      salesmanName:
        row.first_name && row.last_name
          ? `${row.first_name} ${row.last_name}`
          : 'N/A',
      employeeId: row.salesman_login_id,
      role: row.role,
      region: row.region,
      area: row.area,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      recordedAt: row.recorded_at.toISOString(),
      isActive: row.is_active,
      accuracy: row.accuracy !== null ? Number(row.accuracy) : null,
      speed: row.speed !== null ? Number(row.speed) : null,
      heading: row.heading !== null ? Number(row.heading) : null,
      altitude: row.altitude !== null ? Number(row.altitude) : null,
      batteryLevel: row.battery_level !== null ? Number(row.battery_level) : null,
    }));

    const validatedData = z.array(liveLocationSchema).parse(liveLocations);

    return NextResponse.json(validatedData, { status: 200 });
  } catch (error) {
    console.error('Error fetching live salesman locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live location data' },
      { status: 500 }
    );
  }
}

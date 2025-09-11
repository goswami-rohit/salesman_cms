// src/app/api/dashboardPagesAPI/add-dealers/dealer-locations/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const claims = await getTokenClaims();
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      select: { companyId: true }
    });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all unique regions for the current dealer's 
    const uniqueRegions = await prisma.dealer.findMany({
      where: {
        user: { companyId: currentUser.companyId },
      },
      select: { region: true },
      distinct: ['region'], // This is the key part of the query
    });

    // Fetch all unique areas for the current dealer's 
    const uniqueAreas = await prisma.dealer.findMany({
      where: {
        user: { companyId: currentUser.companyId },
      },
      select: { area: true },
      distinct: ['area'], // This is the key part of the query
    });

    // Extract the string values from the query results
    const regions = uniqueRegions.map(r => r.region);
    const areas = uniqueAreas.map(a => a.area);

    return NextResponse.json({ regions, areas }, { status: 200 });

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
// src/app/api/dashboardPagesAPI/permanent-journey-plan/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { getAuthClaims, generateAndStreamCsv } from '@/lib/download-utils';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication and Authorization Checks
    const claims = await getAuthClaims();
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

    // 3. Fetch Permanent Journey Plans for the current user's company
    const permanentJourneyPlans = await prisma.permanentJourneyPlan.findMany({
      where: {
        ...(ids && { id: { in: ids } }),
        user: {
          companyId: currentUser.companyId,
        },
      },
      include: {
        user: { // Include salesman details to get their name
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        planDate: 'desc', // Order by latest plans first
      },
    });

    // 4. Map the data to match the frontend's PermanentJourneyPlan schema and prepare for CSV
    const formattedPlans = permanentJourneyPlans.map(plan => ({
      id: plan.id,
      salesmanName: `${plan.user.firstName || ''} ${plan.user.lastName || ''}`.trim() || plan.user.email,
      areaToBeVisited: plan.areaToBeVisited,
      date: plan.planDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD string
      description: plan.description,
    }));

    // 5. Handle download requests based on the 'format' query parameter
    if (format) {
      switch (format) {
        case 'csv': {
          const headers = ["ID", "Salesman Name", "Area to be Visited", "Date", "Description"];
          const dataForCsv = [
            headers,
            ...formattedPlans.map(plan => [
              plan.id,
              plan.salesmanName,
              plan.areaToBeVisited,
              plan.date,
              plan.description,
            ])
          ];
          const filename = `permanent-journey-plans-${Date.now()}.csv`;
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
    return NextResponse.json(formattedPlans, { status: 200 });
  } catch (error) {
    console.error('Error fetching permanent journey plans:', error);
    return NextResponse.json({ error: 'Failed to fetch permanent journey plans' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
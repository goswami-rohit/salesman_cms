// src/app/api/dashboardPagesAPI/permanent-journey-plan/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client

export async function GET(request: Request) {
  try {
    const claims = await getTokenClaims();

    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the current user from your DB to check their role and companyId
    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      include: { company: true } // Include company to get companyId
    });

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or manager role' }, { status: 403 });
    }

    // Fetch Permanent Journey Plans for the current user's company
    const permanentJourneyPlans = await prisma.permanentJourneyPlan.findMany({
      where: {
        user: { // Access the User relation to filter by the user's company
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

    // Map the data to match the frontend's PermanentJourneyPlan schema
    const formattedPlans = permanentJourneyPlans.map(plan => ({
      id: plan.id,
      salesmanName: `${plan.user.firstName || ''} ${plan.user.lastName || ''}`.trim() || plan.user.email,
      areaToBeVisited: plan.areaToBeVisited,
      date: plan.planDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD string
      description: plan.description,
    }));

    return NextResponse.json(formattedPlans, { status: 200 });
  } catch (error) {
    console.error('Error fetching permanent journey plans:', error);
    return NextResponse.json({ error: 'Failed to fetch permanent journey plans' }, { status: 500 });
  }
}
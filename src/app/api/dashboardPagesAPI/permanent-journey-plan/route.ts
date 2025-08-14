// src/app/api/dashboardPagesAPI/permanent-journey-plan/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client

const allowedRoles = [
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive', 'executive'];

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
      include: { company: true } // Include company to get companyId
    });

    // --- UPDATED ROLE-BASED AUTHORIZATION ---
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Only the following roles can add dealers: ${allowedRoles.join(', ')}` }, { status: 403 });
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
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
        // Filter by the user's company who is assigned to the plan
        user: { 
          companyId: currentUser.companyId,
        },
      },
      include: {
        // Include salesman details to get their name
        user: { 
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        // Include creator details
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        // Also include the daily tasks associated with the PJP
        dailyTasks: {
          select: {
            id: true,
            status: true,
            visitType: true,
            relatedDealerId: true,
            siteName: true,
          },
        },
      },
      orderBy: {
        planDate: 'desc', // Order by latest plans first
      },
    });

    // Map the data to match the frontend's PermanentJourneyPlan schema
    const formattedPlans = permanentJourneyPlans.map(plan => {
      // Construct salesman and creator names, handling potential nulls
      const salesmanName = `${plan.user.firstName || ''} ${plan.user.lastName || ''}`.trim() || plan.user.email;
      const createdByName = `${plan.createdBy.firstName || ''} ${plan.createdBy.lastName || ''}`.trim() || plan.createdBy.email;

      // Extract only the IDs of the tasks
      const taskIds = plan.dailyTasks.map(task => task.id);

      return {
        id: plan.id,
        salesmanName: salesmanName,
        userId: plan.userId,
        createdByName: createdByName,
        createdByRole: plan.createdBy.role,
        areaToBeVisited: plan.areaToBeVisited,
        planDate: plan.planDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD string
        description: plan.description,
        status: plan.status,
        taskIds: taskIds,
      };
    });

    return NextResponse.json(formattedPlans, { status: 200 });
  } catch (error) {
    console.error('Error fetching permanent journey plans:', error);
    return NextResponse.json({ error: 'Failed to fetch permanent journey plans' }, { status: 500 });
  }
}
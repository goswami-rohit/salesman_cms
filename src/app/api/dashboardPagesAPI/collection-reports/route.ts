// src/app/api/dashboardPagesAPI/collection-reports/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { z } from 'zod'; // Import Zod for schema validation

// Define Zod schema for the data returned by this API
const collectionReportSchema = z.object({
  id: z.string(),
  dvrId: z.string(),
  collectedAmount: z.number(),
  collectedOnDate: z.string().date(), // YYYY-MM-DD string
  weeklyTarget: z.number().nullable(),
  tillDateAchievement: z.number().nullable(),
  yesterdayTarget: z.number().nullable(),
  yesterdayAchievement: z.number().nullable(),
  salesPersonName: z.string(),
  dealerName: z.string(),
});

// A list of roles that are allowed to access this endpoint.
const allowedRoles = [
  'president',
  'senior-general-manager',
  'general-manager',
  'assistant-sales-manager',
  'area-sales-manager',
  'regional-sales-manager',
  'senior-manager',
  'manager',
  'assistant-manager',
  'senior-executive',
  'executive',
  'junior-executive',
];

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
      select: { id: true, role: true, companyId: true } // Select only necessary fields
    });

    // 3. Role-based Authorization Check
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Your role does not have access to this data.` }, { status: 403 });
    }

    // 4. Fetch Collection Reports for the current user's company
    const collectionReports = await prisma.collectionReport.findMany({
      where: {
        // Filter reports by the company of the salesperson who created the associated DVR
        dvr: {
          user: {
            companyId: currentUser.companyId,
          },
        },
      },
      include: {
        dvr: { // Include DVR details to get the salesperson
          include: {
            user: { // Include the user (salesperson)
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        dealer: { // Include dealer details to get their name from the 'name' field
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        collectedOnDate: 'desc', // Order by latest collections first
      },
    });

    // 5. Format the data to match the frontend's expected structure and validate
    const formattedReports = collectionReports.map(report => {
      const salesPersonName = `${report.dvr.user.firstName || ''} ${report.dvr.user.lastName || ''}`.trim() || report.dvr.user.email;

      return {
        id: report.id,
        dvrId: report.dvrId,
        collectedAmount: report.collectedAmount.toNumber(),
        collectedOnDate: report.collectedOnDate.toISOString().split('T')[0], // YYYY-MM-DD
        weeklyTarget: report.weeklyTarget?.toNumber() || null,
        tillDateAchievement: report.tillDateAchievement?.toNumber() || null,
        yesterdayTarget: report.yesterdayTarget?.toNumber() || null,
        yesterdayAchievement: report.yesterdayAchievement?.toNumber() || null,
        salesPersonName: salesPersonName,
        dealerName: report.dealer.name,
      };
    });

    // Validate the formatted data against the schema
    const validatedReports = z.array(collectionReportSchema).parse(formattedReports);

    return NextResponse.json(validatedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching collection reports:', error);
    // Be careful not to expose sensitive error details in production
    return NextResponse.json({ error: 'Failed to fetch collection reports', details: (error as Error).message }, { status: 500 });
  }
}

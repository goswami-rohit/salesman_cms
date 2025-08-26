// src/app/api/dashboardPagesAPI/sales-reports/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { z } from 'zod'; // Import Zod for schema validation

// Define Zod schema for the data returned by this API
const salesReportSchema = z.object({
  id: z.number(),
  date: z.string().date(), // YYYY-MM-DD string
  monthlyTarget: z.number(),
  tillDateAchievement: z.number(),
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

    // 4. Fetch Sales Reports for the current user's company
    const salesReports = await prisma.salesReport.findMany({
      where: {
        // Filter reports by the company of the salesperson who created them
        salesPerson: {
          companyId: currentUser.companyId,
        },
      },
      include: {
        salesPerson: { // Include salesperson details to get their name
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        dealer: { // Include dealer details to get their name
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc', // Order by latest reports first
      },
    });

    // 5. Format the data to match the frontend's expected structure and validate
    const formattedReports = salesReports.map(report => {
      const salesPersonName = `${report.salesPerson.firstName || ''} ${report.salesPerson.lastName || ''}`.trim() || report.salesPerson.email;

      return {
        id: report.id,
        date: report.date.toISOString().split('T')[0], // YYYY-MM-DD
        monthlyTarget: report.monthlyTarget.toNumber(),
        tillDateAchievement: report.tillDateAchievement.toNumber(),
        yesterdayTarget: report.yesterdayTarget?.toNumber() || null,
        yesterdayAchievement: report.yesterdayAchievement?.toNumber() || null,
        salesPersonName: salesPersonName,
        dealerName: report.dealer.name,
      };
    });

    // Validate the formatted data against the schema
    const validatedReports = z.array(salesReportSchema).parse(formattedReports);

    return NextResponse.json(validatedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching sales reports:', error);
    // Be careful not to expose sensitive error details in production
    return NextResponse.json({ error: 'Failed to fetch sales reports', details: (error as Error).message }, { status: 500 });
  }
}

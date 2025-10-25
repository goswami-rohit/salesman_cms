// src/app/api/dashboardPagesAPI/reports/competition-reports/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod'; // 1. Added Zod Import

// --- ZOD SCHEMA DEFINITION ---
export const competitionReportSchema = z.object({
  id: z.string(),
  salesmanName: z.string(),
  brandName: z.string(),
  date: z.string(), // Mapped to YYYY-MM-DD
  billing: z.string(),
  nod: z.string(),
  retail: z.string(),
  schemesYesNo: z.string(),
  avgSchemeCost: z.number(), // Mapped from Decimal to Number
  remarks: z.string(), // Mapped from String? to non-nullable string
  createdAt: z.string(), // ISO String
  updatedAt: z.string(), // ISO String
});

const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive',];

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
      select: { id: true, role: true, companyId: true } // Optimized selection
    });

    // --- UPDATED ROLE-BASED AUTHORIZATION ---
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Only the following roles can view competition reports: ${allowedRoles.join(', ')}` }, { status: 403 });
    }

    // Fetch Competition Reports for the current user's company
    const competitionReports = await prisma.competitionReport.findMany({
      where: {
        user: { // Access the User relation
          companyId: currentUser.companyId, // Filter by the admin/manager's company
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
        reportDate: 'desc', // Order by latest reports first
      },
    });

    // Map the data to match the frontend's CompetitionReport schema (camelCase, combined fields)
    const formattedReports = competitionReports.map(report => ({
      id: report.id,
      salesmanName: `${report.user.firstName || ''} ${report.user.lastName || ''}`.trim() || report.user.email,
      brandName: report.brandName,
      date: report.reportDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD string
      billing: report.billing,
      nod: report.nod,
      retail: report.retail,
      schemesYesNo: report.schemesYesNo,
      avgSchemeCost: report.avgSchemeCost.toNumber(), // Convert Decimal to Number
      remarks: report.remarks || '', // Ensure remarks is a string, even if null in DB
      // ADDED: Missing timestamp fields
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    }));

    // 3. Added Zod Validation
    const validated = z.array(competitionReportSchema).parse(formattedReports);

    return NextResponse.json(validated, { status: 200 });
  } catch (error) {
    console.error('Error fetching competition reports:', error);
    return NextResponse.json({ error: 'Failed to fetch competition reports', details: (error as Error).message }, { status: 500 });
  }
}

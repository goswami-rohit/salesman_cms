// src/app/api/dashboardPagesAPI/competition-reports/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client

export async function GET() {
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
    }));

    return NextResponse.json(formattedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching competition reports:', error);
    return NextResponse.json({ error: 'Failed to fetch competition reports' }, { status: 500 });
  }
}
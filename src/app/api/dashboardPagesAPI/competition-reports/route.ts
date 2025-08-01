// src/app/api/dashboardPagesAPI/competition-reports/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { z } from 'zod';
import { getAuthClaims, generateAndStreamCsv } from '@/lib/download-utils';

// Define Zod schema for the data returned by this API
const competitionReportSchema = z.object({
  id: z.string().uuid(),
  salesmanName: z.string(),
  brandName: z.string(),
  date: z.string(), // YYYY-MM-DD string
  billing: z.string(),
  nod: z.string(),
  retail: z.string(),
  schemesYesNo: z.string(),
  avgSchemeCost: z.number(),
  remarks: z.string().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check and Authorization
    const claims = await getAuthClaims();
    if (claims instanceof NextResponse) return claims;

    // Fetch the current user from your DB to check their role and companyId
    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      include: { company: true } // Include company to get companyId
    });

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or manager role' }, { status: 403 });
    }

    // 2. Parse query parameters for filtering and formatting
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const ids = searchParams.get('ids')?.split(','); // Optional array of IDs to filter by

    // 3. Fetch Competition Reports for the current user's company
    const competitionReports = await prisma.competitionReport.findMany({
      where: {
        ...(ids && { id: { in: ids } }),
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
      // Apply a limit only for the standard JSON response, not for downloads
      ...(!format && { take: 200 }),
    });

    // 4. Map the data to match the frontend's CompetitionReport schema (camelCase, combined fields)
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

    // 5. Handle download requests based on the 'format' query parameter
    if (format) {
      switch (format) {
        case 'csv': {
          const headers = [
            "ID", "Salesman Name", "Brand Name", "Date", "Billing", "NOD", "Retail",
            "Schemes (Y/N)", "Avg Scheme Cost", "Remarks"
          ];
          const dataForCsv = [
            headers,
            ...formattedReports.map(report => [
              report.id,
              report.salesmanName,
              report.brandName,
              report.date,
              report.billing,
              report.nod,
              report.retail,
              report.schemesYesNo,
              report.avgSchemeCost,
              report.remarks,
            ])
          ];
          const filename = `competition-reports-${Date.now()}.csv`;
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

    // 6. Default behavior: return validated JSON data
    return NextResponse.json(formattedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching competition reports:', error);
    return NextResponse.json({ error: 'Failed to fetch competition reports' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

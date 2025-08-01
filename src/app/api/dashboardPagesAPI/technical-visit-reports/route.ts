// src/app/api/dashboardPagesAPI/technical-visit-reports/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateAndStreamCsv, getAuthClaims } from '@/lib/download-utils';

const prisma = new PrismaClient();

// GET /api/dashboardPagesAPI/technical-reports
// Fetches all technical visit reports for the authenticated user's company.
// Can also return a CSV file based on a 'format' query parameter.
export async function GET(request: NextRequest) {
  try {
    // 1. Get user claims and check for authentication
    const claims = await getAuthClaims();
    if (claims instanceof NextResponse) return claims;

    // 2. Parse query parameters for filtering and formatting
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const ids = searchParams.get('ids')?.split(','); // Optional array of IDs to filter by

    // 3. Fetch the data directly. TypeScript will correctly infer the
    // return type, including the `user` relation, without a separate type annotation.
    const technicalReports = await prisma.technicalVisitReport.findMany({
      where: {
        ...(ids && { id: { in: ids } }),
        user: {
          company: {
            workosOrganizationId: claims.org_id as string,
          },
        },
      },
      include: {
        user: true, // Include the associated User record to get salesman details
      },
      orderBy: {
        reportDate: 'desc', // Order the results by report date in descending order
      },
    });

    // 4. Format the data to match the frontend's expected structure
    const formattedReports = technicalReports.map(report => {
      // The 'user' property is now correctly recognized, so optional chaining works as intended.
      const salesmanName = [report.user?.firstName, report.user?.lastName]
        .filter(Boolean)
        .join(' ') || 'N/A';

      return {
        id: report.id,
        salesmanName: salesmanName,
        visitType: report.visitType,
        siteNameConcernedPerson: report.siteNameConcernedPerson,
        phoneNo: report.phoneNo,
        date: report.reportDate.toISOString().split('T')[0],
        emailId: report.emailId || '',
        clientsRemarks: report.clientsRemarks,
        salespersonRemarks: report.salespersonRemarks,
        checkInTime: report.checkInTime.toISOString(),
        checkOutTime: report.checkOutTime?.toISOString() || '',
      };
    });

    // 5. Handle download requests based on the 'format' query parameter
    if (format) {
      switch (format) {
        case 'csv': {
          const headers = [
            "ID", "Salesman Name", "Visit Type", "Site Name / Concerned Person",
            "Phone No", "Date", "Email ID", "Clients Remarks",
            "Salesperson Remarks", "Check-in Time", "Check-out Time"
          ];
          const dataForCsv = [
            headers,
            ...formattedReports.map(report => [
              report.id,
              report.salesmanName,
              report.visitType,
              report.siteNameConcernedPerson,
              report.phoneNo,
              report.date,
              report.emailId,
              report.clientsRemarks,
              report.salespersonRemarks,
              report.checkInTime,
              report.checkOutTime
            ])
          ];
          const filename = `technical-visit-reports-${Date.now()}.csv`;
          return generateAndStreamCsv(dataForCsv, filename);
        }
        case 'xlsx': {
          // Placeholder for XLSX format - not yet implemented
          return NextResponse.json({ message: 'XLSX format is not yet supported.' }, { status: 501 });
        }
        default: {
          return NextResponse.json({ message: 'Invalid format specified.' }, { status: 400 });
        }
      }
    }

    // 6. Default behavior: return JSON data for the client-side table
    return NextResponse.json(formattedReports);
  } catch (error) {
    console.error('Error fetching technical visit reports:', error);
    return NextResponse.json({ message: 'Failed to fetch technical visit reports', error: (error as Error).message }, { status: 500 });
  }
}
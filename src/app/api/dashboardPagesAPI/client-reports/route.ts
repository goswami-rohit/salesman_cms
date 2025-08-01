// src/app/api/dashboardPagesAPI/client-reports/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { z } from 'zod';
import { getAuthClaims, generateAndStreamCsv } from '@/lib/download-utils';

// Define Zod schema for the data returned by this API
const clientReportSchema = z.object({
  id: z.string().uuid(),
  salesmanName: z.string(),
  dealerType: z.string().nullable(),
  dealerSubDealerName: z.string(),
  location: z.string(),
  typeBestNonBest: z.string(),
  dealerTotalPotential: z.number(),
  dealerBestPotential: z.number(),
  brandSelling: z.string().nullable(),
  contactPerson: z.string().nullable(),
  contactPersonPhoneNo: z.string().nullable(),
  todayOrderMT: z.number(),
  todayCollection: z.number(),
  feedbacks: z.string().nullable(),
  solutionsAsPerSalesperson: z.string().nullable(),
  anyRemarks: z.string().nullable(),
  checkOutTime: z.string(), // ISO string from backend
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

    // 3. Fetch Client Reports for the current user's company
    const clientReports = await prisma.clientReport.findMany({
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
        checkOutTime: 'desc', // Order by latest reports first
      },
      // Apply a limit only for the standard JSON response, not for downloads
      ...(!format && { take: 200 }),
    });

    // 4. Map the data to match the frontend's ClientReport schema
    const formattedReports = clientReports.map(report => ({
      id: report.id,
      salesmanName: `${report.user.firstName || ''} ${report.user.lastName || ''}`.trim() || report.user.email,
      dealerType: report.dealerType,
      dealerSubDealerName: report.dealerSubDealerName,
      location: report.location,
      typeBestNonBest: report.typeBestNonBest,
      dealerTotalPotential: report.dealerTotalPotential.toNumber(),
      dealerBestPotential: report.dealerBestPotential.toNumber(),
      brandSelling: report.brandSelling,
      contactPerson: report.contactPerson,
      contactPersonPhoneNo: report.contactPersonPhoneNo,
      todayOrderMT: report.todayOrderMT.toNumber(),
      todayCollection: report.todayCollection.toNumber(),
      feedbacks: report.feedbacks,
      solutionsAsPerSalesperson: report.solutionsAsPerSalesperson,
      anyRemarks: report.anyRemarks,
      checkOutTime: report.checkOutTime.toISOString(), // Ensure consistent date string format
    }));

    // 5. Handle download requests based on the 'format' query parameter
    if (format) {
      switch (format) {
        case 'csv': {
          const headers = [
            "ID", "Salesman Name", "Dealer Type", "Dealer/Sub-Dealer Name", "Location", "Best/Non-Best",
            "Dealer Total Potential (MT)", "Dealer Best Potential (MT)", "Brand Selling", "Contact Person",
            "Contact Phone", "Today's Order (MT)", "Today's Collection (₹)", "Feedbacks",
            "Solutions as per Salesperson", "Any Remarks", "Check-out Time"
          ];
          const dataForCsv = [
            headers,
            ...formattedReports.map(report => [
              report.id,
              report.salesmanName,
              report.dealerType,
              report.dealerSubDealerName,
              report.location,
              report.typeBestNonBest,
              report.dealerTotalPotential,
              report.dealerBestPotential,
              report.brandSelling,
              report.contactPerson,
              report.contactPersonPhoneNo,
              report.todayOrderMT,
              report.todayCollection,
              report.feedbacks,
              report.solutionsAsPerSalesperson,
              report.anyRemarks,
              report.checkOutTime,
            ])
          ];
          const filename = `client-reports-${Date.now()}.csv`;
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
    console.error('Error fetching client reports:', error);
    return NextResponse.json({ error: 'Failed to fetch client reports' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

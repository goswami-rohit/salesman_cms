// src/app/api/dashboardPagesAPI/daily-visit-reports/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { z } from 'zod'; // Import Zod for schema validation
import { getAuthClaims, generateAndStreamCsv } from '@/lib/download-utils';

// Define Zod schema for the data returned by this API
const dailyVisitReportSchema = z.object({
  id: z.string().uuid(),
  salesmanName: z.string(),
  reportDate: z.string(), // YYYY-MM-DD string
  dealerType: z.string(),
  dealerName: z.string().nullable(),
  subDealerName: z.string().nullable(),
  location: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  visitType: z.string(),
  dealerTotalPotential: z.number().nullable(),
  dealerBestPotential: z.number().nullable(),
  brandSelling: z.array(z.string()),
  contactPerson: z.string().nullable(),
  contactPersonPhoneNo: z.string().nullable(),
  todayOrderMt: z.number().nullable(),
  todayCollectionRupees: z.number().nullable(),
  feedbacks: z.string(),
  solutionBySalesperson: z.string().nullable(),
  anyRemarks: z.string().nullable(),
  checkInTime: z.string(), // ISO string
  checkOutTime: z.string().nullable(), // ISO string or null
  inTimeImageUrl: z.string().nullable(),
  outTimeImageUrl: z.string().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check and Authorization
    const claims = await getAuthClaims();
    if (claims instanceof NextResponse) return claims;

    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      select: { id: true, role: true, companyId: true }
    });

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or manager role' }, { status: 403 });
    }

    // 2. Parse query parameters for filtering and formatting
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const ids = searchParams.get('ids')?.split(','); // Optional array of IDs to filter by

    // 3. Fetch Daily Visit Reports for the current user's company
    const dailyVisitReports = await prisma.dailyVisitReport.findMany({
      where: {
        ...(ids && { id: { in: ids } }),
        user: {
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
        reportDate: 'desc', // Order by latest reports first
      },
      // Apply a limit only for the standard JSON response, not for downloads
      ...(!format && { take: 200 }),
    });

    // 4. Format the data to match the frontend's expected structure and prepare for CSV
    const formattedReports = dailyVisitReports.map(report => {
      const salesmanName = `${report.user.firstName || ''} ${report.user.lastName || ''}`.trim() || report.user.email;
      
      return {
        id: report.id,
        salesmanName: salesmanName,
        reportDate: report.reportDate.toISOString().split('T')[0], // YYYY-MM-DD
        dealerType: report.dealerType,
        dealerName: report.dealerName,
        subDealerName: report.subDealerName,
        location: report.location,
        latitude: report.latitude.toNumber(),
        longitude: report.longitude.toNumber(),
        visitType: report.visitType,
        dealerTotalPotential: report.dealerTotalPotential?.toNumber() || null,
        dealerBestPotential: report.dealerBestPotential?.toNumber() || null,
        brandSelling: report.brandSelling,
        contactPerson: report.contactPerson,
        contactPersonPhoneNo: report.contactPersonPhoneNo,
        todayOrderMt: report.todayOrderMt?.toNumber() || null,
        todayCollectionRupees: report.todayCollectionRupees?.toNumber() || null,
        feedbacks: report.feedbacks,
        solutionBySalesperson: report.solutionBySalesperson,
        anyRemarks: report.anyRemarks,
        checkInTime: report.checkInTime.toISOString(),
        checkOutTime: report.checkOutTime?.toISOString() || null,
        inTimeImageUrl: report.inTimeImageUrl,
        outTimeImageUrl: report.outTimeImageUrl,
      };
    });

    // 5. Handle download requests based on the 'format' query parameter
    if (format) {
      switch (format) {
        case 'csv': {
          const headers = [
            "ID", "Salesman Name", "Report Date", "Dealer Type", "Dealer Name",
            "Sub-Dealer Name", "Location", "Latitude", "Longitude", "Visit Type",
            "Total Potential", "Best Potential", "Brand Selling", "Contact Person",
            "Contact Phone", "Today Order (MT)", "Today Collection (₹)", "Feedbacks",
            "Solution by Salesperson", "Remarks", "Check-in Time", "Check-out Time",
            "Check-in Image URL", "Check-out Image URL"
          ];
          const dataForCsv = [
            headers,
            ...formattedReports.map(report => [
              report.id,
              report.salesmanName,
              report.reportDate,
              report.dealerType,
              report.dealerName,
              report.subDealerName,
              report.location,
              report.latitude,
              report.longitude,
              report.visitType,
              report.dealerTotalPotential,
              report.dealerBestPotential,
              report.brandSelling.join(', '),
              report.contactPerson,
              report.contactPersonPhoneNo,
              report.todayOrderMt,
              report.todayCollectionRupees,
              report.feedbacks,
              report.solutionBySalesperson,
              report.anyRemarks,
              report.checkInTime,
              report.checkOutTime,
              report.inTimeImageUrl,
              report.outTimeImageUrl,
            ])
          ];
          const filename = `daily-visit-reports-${Date.now()}.csv`;
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

    // 6. Default behavior: return validated JSON data for the client-side table
    // The previous code had a validation step here, but it's more efficient
    // to do it once when mapping the data.
    return NextResponse.json(formattedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching daily visit reports:', error);
    return NextResponse.json({ error: 'Failed to fetch daily visit reports' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

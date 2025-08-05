// src/app/api/dashboardPagesAPI/daily-visit-reports/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { z } from 'zod'; // Import Zod for schema validation

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
  dealerTotalPotential: z.number(),
  dealerBestPotential: z.number(),
  brandSelling: z.array(z.string()),
  contactPerson: z.string().nullable(),
  contactPersonPhoneNo: z.string().nullable(),
  todayOrderMt: z.number(),
  todayCollectionRupees: z.number(),
  feedbacks: z.string(),
  solutionBySalesperson: z.string().nullable(),
  anyRemarks: z.string().nullable(),
  checkInTime: z.string(), // ISO string
  checkOutTime: z.string().nullable(), // ISO string or null
  inTimeImageUrl: z.string().nullable(),
  outTimeImageUrl: z.string().nullable(),
});

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

    // 3. Role-based Authorization: Only 'admin' or 'manager' can access this
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or manager role' }, { status: 403 });
    }

    // 4. Fetch Daily Visit Reports for the current user's company
    const dailyVisitReports = await prisma.dailyVisitReport.findMany({
      where: {
        user: { // Filter reports by the company of the user who created them
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
    });

    // 5. Format the data to match the frontend's expected structure and validate
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
        dealerTotalPotential: report.dealerTotalPotential.toNumber(),
        dealerBestPotential: report.dealerBestPotential.toNumber(),
        brandSelling: report.brandSelling,
        contactPerson: report.contactPerson,
        contactPersonPhoneNo: report.contactPersonPhoneNo,
        todayOrderMt: report.todayOrderMt.toNumber(),
        todayCollectionRupees: report.todayCollectionRupees.toNumber(),
        feedbacks: report.feedbacks,
        solutionBySalesperson: report.solutionBySalesperson,
        anyRemarks: report.anyRemarks,
        checkInTime: report.checkInTime.toISOString(),
        checkOutTime: report.checkOutTime?.toISOString() || null,
        inTimeImageUrl: report.inTimeImageUrl,
        outTimeImageUrl: report.outTimeImageUrl,
      };
    });

    // Validate the formatted data against the schema
    const validatedReports = z.array(dailyVisitReportSchema).parse(formattedReports);

    return NextResponse.json(validatedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching daily visit reports:', error);
    // Be careful not to expose sensitive error details in production
    return NextResponse.json({ error: 'Failed to fetch daily visit reports', details: (error as Error).message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

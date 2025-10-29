// src/app/api/dashboardPagesAPI/routes/daily-visit-reports/route.ts
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { z } from 'zod'; // Import Zod for schema validation
import { dailyVisitReportSchema } from '@/lib/shared-zod-schema';

const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive','executive',];

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

    // --- UPDATED ROLE-BASED AUTHORIZATION ---
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Only the following roles can add dealers: ${allowedRoles.join(', ')}` }, { status: 403 });
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
            role: true,
            area: true,
            region: true,
          },
        },
      },
      orderBy: {
        reportDate: 'desc', // Order by latest reports first
      },
    });

    // 5. Format the data to match the frontend's expected structure and validate
    const formattedReports = dailyVisitReports.map((report:any) => {
      const salesmanName = `${report.user.firstName || ''} ${report.user.lastName || ''}`.trim() || report.user.email;

      return {
        id: String(report.id),
        salesmanName: salesmanName,
        role: report.user.role,
        area: report.user.area,
        region: report.user.region,
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
        overdueAmount: report.overdueAmount?.toNumber() || null,
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
    //await prisma.$disconnect();
  }
}

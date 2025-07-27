// src/app/api/client-reports/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client

export async function GET(request: Request) {
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

    // Fetch Client Reports for the current user's company
    // We filter reports based on the 'companyId' of the 'user' who created the report.
    const clientReports = await prisma.clientReport.findMany({
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
        checkOutTime: 'desc', // Order by latest reports first
      },
    });

    // Map the data to match the frontend's ClientReport schema (camelCase, combined fields)
    const formattedReports = clientReports.map(report => ({
      id: report.id,
      salesmanName: `${report.user.firstName || ''} ${report.user.lastName || ''}`.trim() || report.user.email,
      dealerType: report.dealerType,
      dealerSubDealerName: report.dealerSubDealerName,
      location: report.location,
      typeBestNonBest: report.typeBestNonBest,
      dealerTotalPotential: report.dealerTotalPotential.toNumber(), // Convert Decimal to Number
      dealerBestPotential: report.dealerBestPotential.toNumber(),   // Convert Decimal to Number
      brandSelling: report.brandSelling,
      contactPerson: report.contactPerson,
      contactPersonPhoneNo: report.contactPersonPhoneNo,
      todayOrderMT: report.todayOrderMT.toNumber(), // Convert Decimal to Number
      todayCollection: report.todayCollection.toNumber(), // Convert Decimal to Number
      feedbacks: report.feedbacks,
      solutionsAsPerSalesperson: report.solutionsAsPerSalesperson,
      anyRemarks: report.anyRemarks,
      checkOutTime: report.checkOutTime.toISOString(), // Ensure consistent date string format
    }));

    return NextResponse.json(formattedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching client reports:', error);
    return NextResponse.json({ error: 'Failed to fetch client reports' }, { status: 500 });
  }
}
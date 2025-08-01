// src/app/api/dashboardPagesAPI/dealer-reports/route.ts
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

    // Fetch all Dealers (which includes sub-dealers via the 'type' field)
    const dealersAndSubDealers = await prisma.dealer.findMany({
      where: {
        user: { // Access the User relation to filter by the user's company
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
        createdAt: 'desc', // Order by latest entries first
      },
    });

    // Map the data to match the frontend's DealerReport schema
    const formattedReports = dealersAndSubDealers.map(report => ({
      id: report.id,
      salesmanName: `${report.user.firstName || ''} ${report.user.lastName || ''}`.trim() || report.user.email,
      type: report.type, // "Dealer" or "Sub Dealer"
      // Conditionally assign 'name' from DB to 'dealerName' or 'subDealerName'
      dealerName: report.type === 'Dealer' ? report.name : null,
      subDealerName: report.type === 'Sub Dealer' ? report.name : null,
      region: report.region,
      area: report.area,
      phoneNo: report.phoneNo,
      address: report.address,
      dealerTotalPotential: report.totalPotential.toNumber(), // Convert Decimal to Number
      dealerBestPotential: report.bestPotential.toNumber(),   // Convert Decimal to Number
      brandSelling: report.brandSelling,
      feedbacks: report.feedbacks,
      remarks: report.remarks,
    }));

    return NextResponse.json(formattedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching dealer reports:', error);
    return NextResponse.json({ error: 'Failed to fetch dealer reports' }, { status: 500 });
  }
}
// src/app/api/dashboardPagesAPI/dealer-reports/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client

const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive'];

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
      include: { company: true } // Include company to get companyId
    });

    // --- UPDATED ROLE-BASED AUTHORIZATION ---
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Only the following roles can add dealers: ${allowedRoles.join(', ')}` }, { status: 403 });
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
    const formattedReports = dealersAndSubDealers.map(report => {
      const salesmanName =
        report.user? `${report.user.firstName || ''} ${report.user.lastName || ''}`.trim() || report.user.email
          : "Unassigned"; // fallback if dealer has no salesman

      return {
        id: report.id,
        salesmanName,
        type: report.type, // "Dealer" or "Sub Dealer"
        dealerName: report.type === "Dealer" ? report.name : null,
        subDealerName: report.type === "Sub Dealer" ? report.name : null,
        region: report.region,
        area: report.area,
        phoneNo: report.phoneNo,
        address: report.address,
        dealerTotalPotential: report.totalPotential.toNumber(),
        dealerBestPotential: report.bestPotential.toNumber(),
        brandSelling: report.brandSelling,
        feedbacks: report.feedbacks,
        remarks: report.remarks,
      };
    });

    return NextResponse.json(formattedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching dealer reports:', error);
    return NextResponse.json({ error: 'Failed to fetch dealer reports' }, { status: 500 });
  }
}
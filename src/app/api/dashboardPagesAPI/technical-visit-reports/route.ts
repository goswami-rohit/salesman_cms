// src/app/api/dashboardPagesAPI/technical-visit-reports/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';

const prisma = new PrismaClient();

const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive', 'executive', 'junior-executive'];

// GET /api/dashboardPagesAPI/technical-reports
// Fetches all technical visit reports from the database
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

    const technicalReports = await prisma.technicalVisitReport.findMany({
      where: {
        user: { // Access the User relation
          companyId: currentUser.companyId, // Filter by the admin/manager's company
        },
      },
      include: {
        // --- CORRECTED PRISMA QUERY: Use `select` within `include` to fetch specific user fields ---
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true, // Now we are correctly selecting the user's role
            email: true,
          },
        },
      },
      orderBy: {
        reportDate: 'desc', // Order the results by report date in descending order
      },
    });

    // Format the data to match the frontend's expected TechnicalVisitReport structure
    const formattedReports = technicalReports.map(report => {
      // Construct salesmanName from user's firstName and lastName, handling potential nulls
      const salesmanName = [report.user?.firstName, report.user?.lastName]
        .filter(Boolean) // Filters out any null or undefined parts
        .join(' ') || 'N/A'; // Joins remaining parts with a space, defaults to 'N/A' if empty

      return {
        id: report.id,
        salesmanName: salesmanName,
        role: report.user.role,
        visitType: report.visitType,
        siteNameConcernedPerson: report.siteNameConcernedPerson,
        phoneNo: report.phoneNo,
        date: report.reportDate.toISOString().split('T')[0],
        emailId: report.emailId || '',
        clientsRemarks: report.clientsRemarks,
        salespersonRemarks: report.salespersonRemarks, // This is already a string
        checkInTime: report.checkInTime.toISOString(),
        checkOutTime: report.checkOutTime?.toISOString() || '',
        siteVisitBrandInUse: report.siteVisitBrandInUse,
        siteVisitStage: report.siteVisitStage || '',
        conversionFromBrand: report.conversionFromBrand || '',
        conversionQuantityValue: report.conversionQuantityValue ? parseFloat(report.conversionQuantityValue.toString()) : null, // Convert Decimal to number
        conversionQuantityUnit: report.conversionQuantityUnit || '',
        associatedPartyName: report.associatedPartyName || '',
        influencerType: report.influencerType,
        serviceType: report.serviceType || '',
        qualityComplaint: report.qualityComplaint || '',
        promotionalActivity: report.promotionalActivity || '',
        channelPartnerVisit: report.channelPartnerVisit || '',
      };
    });

    return NextResponse.json(formattedReports);
  } catch (error) {
    console.error('Error fetching technical visit reports:', error);
    // Return a 500 status with an error message in case of failure
    return NextResponse.json({ message: 'Failed to fetch technical visit reports', error: (error as Error).message }, { status: 500 });
  } finally {
    //await prisma.$disconnect();
  }
}